from datetime import datetime, timezone

from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.models.resource import RESOURCE_TYPES

from .common import PaginationQuerySchema, safe_http_url
from .refs import location_ref, program_ref
from .story import StoryListSchema


class ResourceQuerySchema(PaginationQuerySchema):
    type = fields.String(validate=validate.OneOf(RESOURCE_TYPES))
    program = fields.String(validate=validate.Length(min=1, max=120))
    location = fields.String(validate=validate.Length(min=1, max=120))
    phase = fields.String(validate=validate.Length(min=1, max=120))
    date_from = fields.Date()
    date_to = fields.Date()

    @validates_schema
    def validate_date_range(self, data, **kwargs):
        start = data.get("date_from")
        end = data.get("date_to")

        if start and end and start > end:
            raise ValidationError(
                {"date_to": ["date_to must be on or after date_from."]}
            )


def _public_story(story):
    published_at = story.published_at

    if published_at is None:
        return False

    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)

    return (
        story.status == "PUBLISHED"
        and published_at <= datetime.now(timezone.utc)
        and not story.is_confidential
        and story.consent_status in ("confirmed", "not_required")
    )


def _public_cover_image(resource):
    asset = resource.cover_image

    if asset is None:
        return None

    url = safe_http_url(asset.public_url)

    if not url:
        return None

    return {
        "url": url,
        "alt_text": asset.alt_text,
    }


def _public_program(resource):
    program = resource.program

    if program is None or program.publication_status != "published":
        return None

    return program_ref(program)


def _public_location(resource):
    location = resource.location

    if location is None or location.publication_status != "published":
        return None

    return location_ref(location)


def _public_phase(resource):
    phase = resource.phase

    if (
        phase is None
        or phase.publication_status != "published"
        or phase.program.publication_status != "published"
    ):
        return None

    return {
        "slug": phase.slug,
        "sequence": phase.sequence,
        "title": phase.title,
        "program": program_ref(phase.program),
    }


def _public_stories(resource):
    stories = [story for story in resource.stories if _public_story(story)]
    return StoryListSchema(many=True).dump(stories)


class ResourceSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    resource_type = fields.String()
    summary = fields.String()
    plain_language_summary = fields.String(allow_none=True)
    published_on = fields.Date(allow_none=True)
    document_url = fields.Function(lambda resource: safe_http_url(resource.document_url))
    program = fields.Function(_public_program)
    location = fields.Function(_public_location)
    phase = fields.Function(_public_phase)
    cover_image = fields.Function(_public_cover_image)
    stories = fields.Function(_public_stories)
    url = fields.Function(lambda resource: f"/resources/{resource.slug}")
