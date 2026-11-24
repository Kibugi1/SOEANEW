"""Partner management (admins and editors).

Editors prepare partners as drafts. Only an admin can publish or archive a partner, or
change one that is already public, so nothing reaches the website without the
founder's approval (the content guide: never show a partnership SOEA has not approved).
"""

from flask import g, request
from sqlalchemy import or_, select
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
from app.models import Partner, PartnershipArea, Program, UserRole
from app.schemas.admin import (
    PartnerAdminSchema,
    PartnerCreateSchema,
    PartnerListAdminQuerySchema,
    PartnerWriteSchema,
    SlugNameSchema,
)

from . import api_v1

_schema = PartnerAdminSchema()
_MANAGERS = UserRole.CONTENT_MANAGERS


def _editor_may_not_touch(partner=None, data=None):
    """None when allowed; otherwise a 403 response for a non-admin."""
    if g.current_user.role == UserRole.ADMIN:
        return None
    if data and data.get("publication_status", "draft") != "draft":
        return error_response(403, "FORBIDDEN", "Only an admin can publish or archive a partner.")
    if partner is not None and partner.publication_status != "draft":
        return error_response(403, "FORBIDDEN", "Only an admin can change a published or archived partner.")
    return None


def _apply(partner: Partner, data: dict) -> None:
    # Looking up linked rows must not flush a half-filled partner.
    with db.session.no_autoflush:
        _apply_fields(partner, data)


def _apply_fields(partner: Partner, data: dict) -> None:
    for field in ("name", "partner_type", "summary", "website_url", "sort_order"):
        if field in data:
            value = data[field]
            setattr(partner, field, value.strip() if isinstance(value, str) else value)

    if "slug" in data:
        check_slug_free(Partner, data["slug"], exclude_id=partner.id)
        partner.slug = data["slug"]
    if "logo_id" in data:
        partner.logo = resolve_image(data["logo_id"], "logo_id")
    if "area_slugs" in data:
        partner.areas = resolve_slugs(PartnershipArea, data["area_slugs"], "area_slugs")
    if "program_slugs" in data:
        partner.programs = resolve_slugs(Program, data["program_slugs"], "program_slugs")
    if "publication_status" in data:
        partner.publication_status = data["publication_status"]

    if partner.publication_status == "published" and not (partner.summary or "").strip():
        raise field_error("summary", "Add the approved description before publishing.")


@api_v1.get("/admin/partners")
@roles_required(*_MANAGERS)
def admin_list_partners():
    args = PartnerListAdminQuerySchema().load(request.args)
    statement = select(Partner).options(
        selectinload(Partner.areas), selectinload(Partner.programs), selectinload(Partner.logo),
    )
    if args.get("status"):
        statement = statement.where(Partner.publication_status == args["status"])
    if args.get("type"):
        statement = statement.where(Partner.partner_type == args["type"])
    if args.get("q"):
        pattern = like_pattern(args["q"])
        statement = statement.where(or_(
            Partner.name.ilike(pattern, escape="\\"), Partner.slug.ilike(pattern, escape="\\"),
        ))
    statement = statement.order_by(Partner.sort_order, Partner.name, Partner.id)
    pagination = paginate(statement, args)
    return collection_response(_schema.dump(pagination.items, many=True), pagination)


@api_v1.post("/admin/partners")
@roles_required(*_MANAGERS)
def admin_create_partner():
    data = PartnerCreateSchema().load(request.get_json(silent=True) or {})
    forbidden = _editor_may_not_touch(data=data)
    if forbidden:
        return forbidden

    partner = Partner(publication_status="draft", sort_order=0)
    if "slug" not in data:
        partner.slug = unique_slug(Partner, data["name"])
    _apply(partner, data)

    db.session.add(partner)
    db.session.flush()
    audit("partner.created", "partner", partner, {"publication_status": partner.publication_status})
    db.session.commit()
    return item_response(_schema.dump(partner)), 201


@api_v1.get("/admin/partners/<partner_id>")
@roles_required(*_MANAGERS)
def admin_get_partner(partner_id):
    return item_response(_schema.dump(get_or_404(Partner, partner_id)))


@api_v1.patch("/admin/partners/<partner_id>")
@roles_required(*_MANAGERS)
def admin_update_partner(partner_id):
    partner = get_or_404(Partner, partner_id)
    data = PartnerWriteSchema().load(request.get_json(silent=True) or {})
    if not data:
        raise field_error("_schema", "Provide at least one field to update.")
    forbidden = _editor_may_not_touch(partner, data)
    if forbidden:
        return forbidden

    before = partner.publication_status
    _apply(partner, data)
    details = {"fields": sorted(data)}
    if partner.publication_status != before:
        details["publication_status"] = {"from": before, "to": partner.publication_status}
    audit("partner.updated", "partner", partner, details)
    db.session.commit()
    return item_response(_schema.dump(partner))


@api_v1.delete("/admin/partners/<partner_id>")
@roles_required(UserRole.ADMIN)
def admin_delete_partner(partner_id):
    partner = get_or_404(Partner, partner_id)
    audit("partner.deleted", "partner", partner, {"slug": partner.slug})
    db.session.delete(partner)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response(
            409, "CONFLICT",
            "This partner is linked to programs, tracks, stories or areas. Archive it instead.",
        )
    return "", 204


@api_v1.get("/admin/partnership-areas")
@roles_required(*_MANAGERS)
def admin_list_partnership_areas():
    areas = db.session.scalars(
        select(PartnershipArea).order_by(PartnershipArea.sort_order, PartnershipArea.name)
    ).all()
    return item_response(SlugNameSchema(many=True).dump(areas))
