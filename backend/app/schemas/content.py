"""Public schemas for themes, locations, programs, phases, milestones and training tracks."""
from marshmallow import Schema, fields, validate

from app.models import LOCATION_TYPES

from .common import PaginationQuerySchema
from .refs import location_ref, program_ref, published, theme_ref
from .urls import LOCATION_URL_PREFIX, PROGRAM_URL_PREFIX, THEME_URL_PREFIX


def _published_parent(location):
    parent = location.parent
    if parent is not None and parent.publication_status == "published":
        return location_ref(parent)
    return None


class ThemeSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    name = fields.String()
    summary = fields.String()
    people_served = fields.String(allow_none=True)
    is_anchor = fields.Boolean()
    url = fields.Function(lambda theme: f"{THEME_URL_PREFIX}/{theme.slug}")


class LocationSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    name = fields.String()
    location_type = fields.String()
    summary = fields.String(allow_none=True)
    # "active" = SOEA works here; "focus_only" = a geographic area of focus, no activity claim.
    engagement_status = fields.String()
    is_coordination_hub = fields.Boolean()
    parent = fields.Function(_published_parent)
    url = fields.Function(lambda location: f"{LOCATION_URL_PREFIX}/{location.slug}")


class TrackSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    track_type = fields.String()
    summary = fields.String(allow_none=True)
    intended_skills = fields.String(allow_none=True)
    practical_activity = fields.String(allow_none=True)
    safety_requirements = fields.String(allow_none=True)
    status = fields.String()
    themes = fields.Function(lambda track: [theme_ref(t) for t in published(track.themes)])


class MilestoneSchema(Schema):
    slug = fields.String()
    title = fields.String()
    summary = fields.String(allow_none=True)
    occurred_on = fields.Date(allow_none=True)
    venue = fields.String(allow_none=True)
    status = fields.String()


class PhaseSchema(Schema):
    slug = fields.String()
    sequence = fields.Integer()
    title = fields.String()
    summary = fields.String(allow_none=True)
    period_label = fields.String(allow_none=True)
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    status = fields.String()


class ProgramListSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    short_name = fields.String(allow_none=True)
    summary = fields.String()
    status = fields.String()
    is_featured = fields.Boolean()
    themes = fields.Function(lambda program: [theme_ref(t) for t in published(program.themes)])
    locations = fields.Function(lambda program: [location_ref(l) for l in published(program.locations)])
    url = fields.Function(lambda program: f"{PROGRAM_URL_PREFIX}/{program.slug}")


class ProgramDetailSchema(ProgramListSchema):
    body = fields.String(allow_none=True)
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)


# ---------- query-string schemas ----------

class LocationListQuerySchema(PaginationQuerySchema):
    type = fields.String(validate=validate.OneOf(LOCATION_TYPES))


class ProgramListQuerySchema(PaginationQuerySchema):
    theme = fields.String(validate=validate.Length(min=1, max=120))
    location = fields.String(validate=validate.Length(min=1, max=120))
    featured = fields.Boolean()
