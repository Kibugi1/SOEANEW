"""Writing and reviewing stories and events.

Workflow:  DRAFT --submit--> IN_REVIEW --approve--> PUBLISHED --unpublish--> ARCHIVED
                                  \\--request changes--> CHANGES_REQUESTED --submit--> ...

- Anyone signed in can write. A new story is bylined to the writer's linked profile, so
  once published it also appears on their profile page.
- Authors edit their own stories while DRAFT or CHANGES_REQUESTED. Editors can help with
  anything not yet live. Admins can edit anything.
- Only an admin approves (which publishes) or requests changes. An admin's own story can
  be approved straight from draft: the founder does not need to review herself.
- Nothing is public unless PUBLISHED, consent is "confirmed" or "not_required", and it is
  not confidential (see app.models.queries.public_stories).
"""

from datetime import datetime, timezone

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
from app.api.decorators import admin_required, roles_required
from app.api.helpers import collection_response, item_response, like_pattern, paginate
from app.errors import error_response
from app.extensions import db
from app.models import (
    Location,
    Phase,
    Program,
    Story,
    StoryMedia,
    StoryTeamMember,
    TeamProfile,
    ThematicArea,
    UserRole,
    story_authors,
)
from app.models.story import PUBLIC_CONSENT_STATUSES
from app.schemas.admin import (
    ApproveSchema,
    ReviewNotesSchema,
    StoryAdminSchema,
    StoryCreateSchema,
    StoryListAdminQuerySchema,
    StoryWriteSchema,
)
from app.services.notifications import notify_author, notify_review_requested

from . import api_v1

_schema = StoryAdminSchema()
_EDITABLE_BY_AUTHOR = ("DRAFT", "CHANGES_REQUESTED")
_SUBMITTABLE = ("DRAFT", "CHANGES_REQUESTED")
_SIMPLE_FIELDS = (
    "title", "summary", "body", "story_type", "activity_date", "event_end_date", "venue",
    "organiser", "event_role", "next_step", "lessons", "outcomes", "video_url", "social_url",
    "consent_status",
)
_MANAGER_ONLY_FIELDS = ("is_confidential", "author_slugs")


# --- permissions ---------------------------------------------------------------------------

def _user():
    return g.current_user


def _is_admin():
    return _user().role == UserRole.ADMIN


def _is_manager():
    return _user().role in UserRole.CONTENT_MANAGERS


def _is_own(story) -> bool:
    user = _user()
    if story.created_by_user_id == user.id:
        return True
    return user.team_profile_id is not None and any(a.id == user.team_profile_id for a in story.authors)


def _own_stories_filter():
    user = _user()
    conditions = [Story.created_by_user_id == user.id]
    if user.team_profile_id is not None:
        conditions.append(Story.id.in_(
            select(story_authors.c.story_id).where(story_authors.c.profile_id == user.team_profile_id)
        ))
    return or_(*conditions)


def _can_view(story):
    return _is_manager() or _is_own(story)


def _can_edit(story):
    if _is_admin():
        return True
    if _is_manager():
        return story.status not in ("PUBLISHED", "ARCHIVED")
    return _is_own(story) and story.status in _EDITABLE_BY_AUTHOR


def _permissions(story):
    own = _is_own(story)
    return {
        "edit": _can_edit(story),
        "submit": story.status in _SUBMITTABLE and (own or _is_manager()),
        "approve": _is_admin() and (
            story.status == "IN_REVIEW" or (story.status in _SUBMITTABLE and story.created_by_user_id == _user().id)
        ),
        "request_changes": _is_admin() and story.status == "IN_REVIEW",
        "unpublish": _is_admin() and story.status == "PUBLISHED",
        "delete": (_is_admin() and story.status != "PUBLISHED")
        or (own and story.status == "DRAFT"),
    }


def _get_story(story_id) -> Story:
    story = get_or_404(Story, story_id)
    if not _can_view(story):
        # Someone else's story looks like it does not exist.
        from flask import abort
        abort(404)
    return story


def _dump(story):
    data = _schema.dump(story)
    data["permissions"] = _permissions(story)
    return data


# --- applying changes -----------------------------------------------------------------------

def _resolve_phases(refs):
    phases = []
    for ref in dict.fromkeys(refs):
        program_slug, _, phase_slug = ref.partition("/")
        phase = db.session.scalars(
            select(Phase).join(Program).where(Program.slug == program_slug, Phase.slug == phase_slug)
        ).first()
        if phase is None:
            raise field_error("phase_refs", f"Unknown phase: {ref}. Use program-slug/phase-slug.")
        phases.append(phase)
    return phases


def _resolve_gallery_image(media_id):
    asset = resolve_image(media_id, "gallery")
    if not _is_manager() and asset.uploaded_by_user_id != _user().id:
        raise field_error("gallery", "Use photos you uploaded.")
    return asset


def _apply(story: Story, data: dict) -> None:
    with db.session.no_autoflush:
        if not _is_manager():
            for field in _MANAGER_ONLY_FIELDS:
                if field in data:
                    raise field_error(field, "Only an admin or editor can change this.")

        for field in _SIMPLE_FIELDS:
            if field in data:
                value = data[field]
                setattr(story, field, value.strip() if isinstance(value, str) else value)
        if "is_confidential" in data:
            story.is_confidential = data["is_confidential"]
        if "slug" in data:
            check_slug_free(Story, data["slug"], exclude_id=story.id)
            story.slug = data["slug"]
        if "cover_image_id" in data:
            story.cover_image = (
                _resolve_gallery_image(data["cover_image_id"]) if data["cover_image_id"] else None
            )
        if "gallery" in data:
            seen, items = set(), []
            for index, item in enumerate(data["gallery"]):
                if item["media_id"] in seen:
                    continue
                seen.add(item["media_id"])
                asset = _resolve_gallery_image(item["media_id"])
                items.append(StoryMedia(media=asset, sort_order=index, caption=item.get("caption")))
            story.gallery = items
        if "author_slugs" in data:
            story.authors = resolve_slugs(TeamProfile, data["author_slugs"], "author_slugs")
        if "team" in data:
            profiles = resolve_slugs(TeamProfile, [m["slug"] for m in data["team"]], "team")
            by_slug = {p.slug: p for p in profiles}
            members, seen = [], set()
            for index, member in enumerate(data["team"]):
                if member["slug"] in seen:
                    continue
                seen.add(member["slug"])
                members.append(StoryTeamMember(profile=by_slug[member["slug"]], role=member["role"], sort_order=index))
            story.team_members = members
        if "program_slugs" in data:
            story.programs = resolve_slugs(Program, data["program_slugs"], "program_slugs")
        if "phase_refs" in data:
            story.phases = _resolve_phases(data["phase_refs"])
        if "theme_slugs" in data:
            story.themes = resolve_slugs(ThematicArea, data["theme_slugs"], "theme_slugs")
        if "location_slugs" in data:
            story.locations = resolve_slugs(Location, data["location_slugs"], "location_slugs")

    if story.story_type != "event":
        story.event_end_date = story.venue = story.organiser = story.event_role = None
    if story.event_end_date and story.activity_date and story.event_end_date < story.activity_date:
        raise field_error("event_end_date", "The end date must be on or after the start date.")


def _check_ready(story: Story) -> None:
    """What a story needs before it can go to review or be published."""
    errors = {}
    for field in ("title", "summary", "body"):
        if not (getattr(story, field) or "").strip():
            errors[field] = ["Required before review."]
    if story.consent_status == "unreviewed":
        errors["consent_status"] = [
            "Confirm consent for the people and photos in this story, or mark it as not required."
        ]
    elif story.consent_status not in PUBLIC_CONSENT_STATUSES:
        errors["consent_status"] = ["Consent has been withdrawn; this story cannot be published."]
    if story.story_type == "event":
        if not story.activity_date:
            errors["activity_date"] = ["Events need the date they took place."]
        if not story.event_role:
            errors["event_role"] = ["Say whether SOEA hosted, participated, was on air, or met."]
    for item in story.gallery:
        if not (item.media.alt_text or "").strip():
            errors["gallery"] = ["Every photo needs a description (alt text) before publishing."]
            break
    if errors:
        from marshmallow import ValidationError
        raise ValidationError(errors)


# --- endpoints ---------------------------------------------------------------------------------

@api_v1.get("/admin/stories")
@admin_required
def admin_list_stories():
    args = StoryListAdminQuerySchema().load(request.args)
    statement = select(Story).options(
        selectinload(Story.authors), selectinload(Story.programs), selectinload(Story.themes),
        selectinload(Story.locations), selectinload(Story.gallery).selectinload(StoryMedia.media),
        selectinload(Story.team_members).selectinload(StoryTeamMember.profile),
        selectinload(Story.phases), selectinload(Story.created_by), selectinload(Story.reviewed_by),
    )
    if not _is_manager() or args.get("mine"):
        statement = statement.where(_own_stories_filter())
    if args.get("status"):
        statement = statement.where(Story.status == args["status"])
    if args.get("type"):
        statement = statement.where(Story.story_type == args["type"])
    if args.get("q"):
        pattern = like_pattern(args["q"])
        statement = statement.where(or_(
            Story.title.ilike(pattern, escape="\\"), Story.summary.ilike(pattern, escape="\\"),
        ))
    statement = statement.order_by(Story.updated_at.desc(), Story.id)
    pagination = paginate(statement, args)
    return collection_response([_dump(s) for s in pagination.items], pagination)


@api_v1.post("/admin/stories")
@admin_required
def admin_create_story():
    data = StoryCreateSchema().load(request.get_json(silent=True) or {})
    user = _user()
    story = Story(
        status="DRAFT", consent_status="unreviewed", is_confidential=False, story_type="story",
        summary="", body="", created_by_user_id=user.id,
    )
    with db.session.no_autoflush:
        story.created_by = user
        if "slug" not in data:
            story.slug = unique_slug(Story, data["title"], max_length=160)
        _apply(story, data)
        if "author_slugs" not in data and user.team_profile is not None:
            story.authors = [user.team_profile]
    db.session.add(story)

    db.session.flush()
    audit("story.created", "story", story, {"story_type": story.story_type})
    db.session.commit()
    return item_response(_dump(story)), 201


@api_v1.get("/admin/stories/<story_id>")
@admin_required
def admin_get_story(story_id):
    return item_response(_dump(_get_story(story_id)))


@api_v1.patch("/admin/stories/<story_id>")
@admin_required
def admin_update_story(story_id):
    story = _get_story(story_id)
    data = StoryWriteSchema().load(request.get_json(silent=True) or {})
    if not data:
        raise field_error("_schema", "Provide at least one field to update.")
    if not _can_edit(story):
        return error_response(403, "FORBIDDEN", "This story cannot be edited in its current state.")

    _apply(story, data)
    if story.status == "PUBLISHED":
        _check_ready(story)  # a live story must stay publishable
    audit("story.updated", "story", story, {"fields": sorted(data), "status": story.status})
    db.session.commit()
    return item_response(_dump(story))


@api_v1.post("/admin/stories/<story_id>/submit")
@admin_required
def admin_submit_story(story_id):
    story = _get_story(story_id)
    if not _permissions(story)["submit"]:
        return error_response(409, "CONFLICT", "Only a draft or a story with requested changes can be submitted.")
    _check_ready(story)

    story.status = "IN_REVIEW"
    story.submitted_at = datetime.now(timezone.utc)
    audit("story.submitted", "story", story)
    db.session.commit()
    notify_review_requested(story, _user())
    return item_response(_dump(story))


@api_v1.post("/admin/stories/<story_id>/request-changes")
@roles_required(UserRole.ADMIN)
def admin_request_story_changes(story_id):
    story = _get_story(story_id)
    data = ReviewNotesSchema().load(request.get_json(silent=True) or {})
    if story.status != "IN_REVIEW":
        return error_response(409, "CONFLICT", "Only a story in review can be sent back.")

    story.status = "CHANGES_REQUESTED"
    story.review_notes = data["notes"].strip()
    story.reviewed_by_user_id = _user().id
    story.reviewed_at = datetime.now(timezone.utc)
    audit("story.changes_requested", "story", story)
    db.session.commit()
    notify_author(story, "changes_requested")
    return item_response(_dump(story))


@api_v1.post("/admin/stories/<story_id>/approve")
@roles_required(UserRole.ADMIN)
def admin_approve_story(story_id):
    story = _get_story(story_id)
    data = ApproveSchema().load(request.get_json(silent=True) or {})
    if not _permissions(story)["approve"]:
        return error_response(
            409, "CONFLICT",
            "Only a story in review, or your own draft, can be approved.",
        )
    _check_ready(story)

    now = datetime.now(timezone.utc)
    publish_at = data.get("publish_at") or now
    if publish_at < now:
        raise field_error("publish_at", "Choose a time in the future, or leave empty to publish now.")

    story.status = "PUBLISHED"
    story.published_at = publish_at
    story.reviewed_by_user_id = _user().id
    story.reviewed_at = now
    if data.get("notes"):
        story.review_notes = data["notes"].strip()
    audit("story.approved", "story", story, {"publish_at": publish_at.isoformat()})
    db.session.commit()
    if story.created_by_user_id != _user().id:
        notify_author(story, "scheduled" if publish_at > now else "published")
    return item_response(_dump(story))


@api_v1.post("/admin/stories/<story_id>/unpublish")
@roles_required(UserRole.ADMIN)
def admin_unpublish_story(story_id):
    story = _get_story(story_id)
    if story.status != "PUBLISHED":
        return error_response(409, "CONFLICT", "Only a published story can be unpublished.")
    story.status = "ARCHIVED"
    audit("story.unpublished", "story", story)
    db.session.commit()
    return item_response(_dump(story))


@api_v1.post("/admin/stories/<story_id>/reopen")
@roles_required(UserRole.ADMIN)
def admin_reopen_story(story_id):
    """Bring an archived story back as a draft so it can be revised and re-approved."""
    story = _get_story(story_id)
    if story.status != "ARCHIVED":
        return error_response(409, "CONFLICT", "Only an archived story can be reopened.")
    story.status = "DRAFT"
    story.published_at = None
    audit("story.reopened", "story", story)
    db.session.commit()
    return item_response(_dump(story))


@api_v1.delete("/admin/stories/<story_id>")
@admin_required
def admin_delete_story(story_id):
    story = _get_story(story_id)
    if not _permissions(story)["delete"]:
        return error_response(
            403, "FORBIDDEN",
            "Published stories must be unpublished first; authors can delete only their own drafts.",
        )
    audit("story.deleted", "story", story, {"slug": story.slug, "status": story.status})
    db.session.delete(story)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response(409, "CONFLICT", "A resource links to this story. Remove that link first.")
    return "", 204
