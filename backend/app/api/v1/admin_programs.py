"""Program management (admins and editors).

Same publishing rule as partners: editors prepare drafts; only an admin publishes,
archives, or changes a program that is already public.
"""

from flask import g, request
from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.admin_common import (
    audit,
    check_slug_free,
    field_error,
    get_or_404,
    resolve_image,
    resolve_slugs,
    unique_slug,
)
from app.api.decorators import roles_required
from app.api.helpers import collection_response, item_response, like_pattern, paginate
from app.errors import error_response
from app.extensions import db
from app.models import Location, Partner, Program, TeamProfile, ThematicArea, UserRole, program_themes
from app.schemas.admin import (
    ProgramAdminSchema,
    ProgramCreateSchema,
    ProgramListAdminQuerySchema,
    ProgramWriteSchema,
)

from . import api_v1

_schema = ProgramAdminSchema()
_MANAGERS = UserRole.CONTENT_MANAGERS
_SIMPLE_FIELDS = (
    "title", "short_name", "summary", "body", "status", "is_featured", "start_date", "end_date",
    "sort_order", "cta_label", "cta_url", "cta_pending",
)


def _primary_theme_slug(program):
    return db.session.scalar(
        select(ThematicArea.slug)
        .join(program_themes, program_themes.c.theme_id == ThematicArea.id)
        .where(program_themes.c.program_id == program.id, program_themes.c.is_primary.is_(True))
    )


def _dump(program):
    data = _schema.dump(program)
    data["primary_theme"] = _primary_theme_slug(program)
    return data


def _forbidden_for_editor(program=None, data=None):
    if g.current_user.role == UserRole.ADMIN:
        return None
    if data and data.get("publication_status", "draft") != "draft":
        return error_response(403, "FORBIDDEN", "Only an admin can publish or archive a program.")
    if program is not None and program.publication_status != "draft":
        return error_response(403, "FORBIDDEN", "Only an admin can change a published or archived program.")
    return None


def _set_parent(program, slug):
    if slug is None:
        program.parent = None
        return
    parent = resolve_slugs(Program, [slug], "parent_slug")[0]
    ancestor = parent
    while ancestor is not None:
        if ancestor is program:
            raise field_error("parent_slug", "A program cannot sit under itself or one of its sub-programs.")
        ancestor = ancestor.parent
    program.parent = parent


def _apply(program: Program, data: dict) -> None:
    # Looking up linked rows must not flush a half-filled program.
    with db.session.no_autoflush:
        _apply_fields(program, data)


def _apply_fields(program: Program, data: dict) -> None:
    for field in _SIMPLE_FIELDS:
        if field in data:
            value = data[field]
            setattr(program, field, value.strip() if isinstance(value, str) else value)

    if "contact_email" in data:
        program.contact_email = data["contact_email"].strip().lower() if data["contact_email"] else None
    if "slug" in data:
        check_slug_free(Program, data["slug"], exclude_id=program.id)
        program.slug = data["slug"]
    if "cover_image_id" in data:
        program.cover_image = resolve_image(data["cover_image_id"], "cover_image_id")
    if "parent_slug" in data:
        _set_parent(program, data["parent_slug"])
    if "lead_profile_slug" in data:
        program.lead = (
            resolve_slugs(TeamProfile, [data["lead_profile_slug"]], "lead_profile_slug")[0]
            if data["lead_profile_slug"] else None
        )
    if "theme_slugs" in data:
        program.themes = resolve_slugs(ThematicArea, data["theme_slugs"], "theme_slugs")
    if "location_slugs" in data:
        program.locations = resolve_slugs(Location, data["location_slugs"], "location_slugs")
    if "partner_slugs" in data:
        program.partners = resolve_slugs(Partner, data["partner_slugs"], "partner_slugs")
    if "publication_status" in data:
        program.publication_status = data["publication_status"]

    if "primary_theme_slug" in data and data["primary_theme_slug"] is not None:
        if data["primary_theme_slug"] not in {theme.slug for theme in program.themes}:
            raise field_error("primary_theme_slug", "The primary theme must be one of the program's themes.")

    if program.start_date and program.end_date and program.end_date < program.start_date:
        raise field_error("end_date", "The end date must be on or after the start date.")
    if program.cta_label and not program.cta_pending and not program.cta_url:
        raise field_error("cta_url", "Add a link, or mark the call to action as pending.")


def _set_primary_theme(program, data) -> None:
    """Runs after flush, once the program's theme links exist."""
    if "primary_theme_slug" not in data and "theme_slugs" not in data:
        return
    wanted = data.get("primary_theme_slug", _primary_theme_slug(program))
    if wanted not in {theme.slug for theme in program.themes}:
        wanted = None  # the old primary theme was removed from the program

    db.session.execute(
        update(program_themes).where(program_themes.c.program_id == program.id).values(is_primary=False)
    )
    if wanted is not None:
        theme_id = next(theme.id for theme in program.themes if theme.slug == wanted)
        db.session.execute(
            update(program_themes)
            .where(program_themes.c.program_id == program.id, program_themes.c.theme_id == theme_id)
            .values(is_primary=True)
        )


@api_v1.get("/admin/programs")
@roles_required(*_MANAGERS)
def admin_list_programs():
    args = ProgramListAdminQuerySchema().load(request.args)
    statement = select(Program).options(
        selectinload(Program.themes), selectinload(Program.locations), selectinload(Program.partners),
        selectinload(Program.children), selectinload(Program.parent), selectinload(Program.lead),
        selectinload(Program.cover_image),
    )
    if args.get("status"):
        statement = statement.where(Program.publication_status == args["status"])
    if args.get("progress"):
        statement = statement.where(Program.status == args["progress"])
    if args.get("q"):
        pattern = like_pattern(args["q"])
        statement = statement.where(or_(
            Program.title.ilike(pattern, escape="\\"),
            Program.short_name.ilike(pattern, escape="\\"),
            Program.slug.ilike(pattern, escape="\\"),
        ))
    statement = statement.order_by(Program.sort_order, Program.title, Program.id)
    pagination = paginate(statement, args)
    return collection_response([_dump(p) for p in pagination.items], pagination)


@api_v1.post("/admin/programs")
@roles_required(*_MANAGERS)
def admin_create_program():
    data = ProgramCreateSchema().load(request.get_json(silent=True) or {})
    forbidden = _forbidden_for_editor(data=data)
    if forbidden:
        return forbidden

    program = Program(publication_status="draft", status="planned", sort_order=0,
                      is_featured=False, cta_pending=False)
    if "slug" not in data:
        program.slug = unique_slug(Program, data.get("short_name") or data["title"])
    _apply(program, data)
    db.session.add(program)
    db.session.flush()
    _set_primary_theme(program, data)
    audit("program.created", "program", program, {"publication_status": program.publication_status})
    db.session.commit()
    return item_response(_dump(program)), 201


@api_v1.get("/admin/programs/<program_id>")
@roles_required(*_MANAGERS)
def admin_get_program(program_id):
    return item_response(_dump(get_or_404(Program, program_id)))


@api_v1.patch("/admin/programs/<program_id>")
@roles_required(*_MANAGERS)
def admin_update_program(program_id):
    program = get_or_404(Program, program_id)
    data = ProgramWriteSchema().load(request.get_json(silent=True) or {})
    if not data:
        raise field_error("_schema", "Provide at least one field to update.")
    forbidden = _forbidden_for_editor(program, data)
    if forbidden:
        return forbidden

    before = program.publication_status
    _apply(program, data)
    db.session.flush()
    _set_primary_theme(program, data)

    details = {"fields": sorted(data)}
    if program.publication_status != before:
        details["publication_status"] = {"from": before, "to": program.publication_status}
    audit("program.updated", "program", program, details)
    db.session.commit()
    return item_response(_dump(program))


@api_v1.delete("/admin/programs/<program_id>")
@roles_required(UserRole.ADMIN)
def admin_delete_program(program_id):
    program = get_or_404(Program, program_id)
    if program.children:
        return error_response(409, "CONFLICT", "Move or delete this program's sub-programs first.")
    audit("program.deleted", "program", program, {"slug": program.slug})
    db.session.delete(program)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response(
            409, "CONFLICT", "Stories or team profiles are linked to this program. Archive it instead.",
        )
    return "", 204
