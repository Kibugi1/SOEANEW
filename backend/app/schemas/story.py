"""Public schemas for stories (list and detail)."""
from marshmallow import fields, validate

from .common import PaginationQuerySchema, UTCDateTime, safe_http_url
from .refs import location_ref, program_ref, published, theme_ref
from .team import public_authors
from .urls import STORY_URL_PREFIX, TEAM_URL_PREFIX

from marshmallow import Schema

SORT_CHOICES = ("newest", "oldest")

def _public_image(asset):
    """Return only approved public image information."""
    if asset is None:
        return None

    url = safe_http_url(asset.public_url)
    if not url:
        return None

    return {
        "url": url,
        "alt_text": asset.alt_text,
    }

def _first_program(story):
    programs = published(story.programs)
    return program_ref(programs[0]) if programs else None  # the guide shows a single program


def _public_phases(story):
    return [
        {"slug": phase.slug, "sequence": phase.sequence, "title": phase.title, "program": program_ref(phase.program)}
        for phase in story.phases
        if phase.publication_status == "published" and phase.program.publication_status == "published"
    ]


def _public_team(story):
    """Lead / support people, published profiles only."""
    return [
        {
            "slug": member.profile.slug,
            "display_name": member.profile.display_name,
            "role": member.role,
            "profile_url": f"{TEAM_URL_PREFIX}/{member.profile.slug}",
        }
        for member in story.team_members
        if member.profile.status == "published"
    ]


class StoryListSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    summary = fields.String()
    published_at = UTCDateTime()
    activity_date = fields.Date(allow_none=True)
    authors = fields.Function(public_authors)
    program = fields.Function(_first_program)
    themes = fields.Function(lambda story: [theme_ref(t) for t in published(story.themes)])
    locations = fields.Function(lambda story: [location_ref(l) for l in published(story.locations)])
    cover_image = fields.Function(lambda story: _public_image(story.cover_image))
    url = fields.Function(lambda story: f"{STORY_URL_PREFIX}/{story.slug}")


class StoryDetailSchema(StoryListSchema):
    # Story body is stored as Markdown and returned unchanged as a plain string.
    # The frontend must render Markdown without allowing raw HTML injection.
    body = fields.String()
    next_step = fields.String(allow_none=True)
    lessons = fields.String(allow_none=True)
    outcomes = fields.String(allow_none=True)  # only ever filled when independently substantiated
    video_url = fields.Function(lambda story: safe_http_url(story.video_url))
    social_url = fields.Function(lambda story: safe_http_url(story.social_url))
    programs = fields.Function(lambda story: [program_ref(p) for p in published(story.programs)])
    phases = fields.Function(_public_phases)
    team = fields.Function(_public_team)


class StoryListQuerySchema(PaginationQuerySchema):
    program = fields.String(validate=validate.Length(min=1, max=120))
    theme = fields.String(validate=validate.Length(min=1, max=120))
    location = fields.String(validate=validate.Length(min=1, max=120))
    author = fields.String(validate=validate.Length(min=1, max=120))
    q = fields.String(validate=validate.Length(max=100))
    sort = fields.String(load_default="newest", validate=validate.OneOf(SORT_CHOICES))
