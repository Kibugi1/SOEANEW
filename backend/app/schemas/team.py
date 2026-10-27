"""Public (read-only) team schemas.

These are allow-lists: only the fields declared here can ever leave the API. Private
columns (review_notes, consent_status, is_confidential, status, timestamps, ...) are
never declared, so they cannot leak by accident.
"""
from marshmallow import Schema, fields, validate

from app.models import ROLE_TYPES

from .common import PaginationQuerySchema, UTCDateTime, safe_http_url
from .refs import program_ref, published
from .urls import STORY_URL_PREFIX, TEAM_URL_PREFIX


def _safe_social_links(profile):
    """Never emit javascript:, data: or malformed links."""
    safe = []
    for link in profile.social_links or []:
        if not isinstance(link, dict):
            continue
        platform, url = link.get("platform"), safe_http_url(link.get("url"))
        if isinstance(platform, str) and url:
            safe.append({"platform": platform, "url": url})
    return safe


def public_authors(story):
    """Only published profiles are shown as authors (never a draft/archived one)."""
    return [
        {
            "slug": author.slug,
            "display_name": author.display_name,
            "profile_url": f"{TEAM_URL_PREFIX}/{author.slug}",
        }
        for author in story.authors
        if author.status == "published"
    ]


class TeamListQuerySchema(PaginationQuerySchema):
    role = fields.String(validate=validate.OneOf(ROLE_TYPES))
    q = fields.String(validate=validate.Length(max=100))


class TeamProfileListSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    display_name = fields.String()
    first_name = fields.String(allow_none=True)
    role_title = fields.String()
    short_role = fields.String(allow_none=True)
    role_type = fields.String()
    image = fields.Constant(None)  # reserved until MediaAsset exists
    url = fields.Function(lambda profile: f"{TEAM_URL_PREFIX}/{profile.slug}")


class TeamProfileDetailSchema(TeamProfileListSchema):
    bio = fields.String(allow_none=True)
    education = fields.String(allow_none=True)
    fun_fact = fields.String(allow_none=True)
    # Approved, publishable work email only (never a login address).
    email = fields.String(attribute="public_email", allow_none=True)
    social_links = fields.Function(_safe_social_links)
    programs = fields.Function(lambda profile: [program_ref(p) for p in published(profile.programs)])


class StoryRefSchema(Schema):
    """Minimal story reference, used inside other entities (profile, program, theme, place)."""

    slug = fields.String()
    title = fields.String()
    published_at = UTCDateTime()
    url = fields.Function(lambda story: f"{STORY_URL_PREFIX}/{story.slug}")
