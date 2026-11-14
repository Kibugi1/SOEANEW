"""Validation schemas for administrative newsletter campaigns."""

from marshmallow import Schema, fields, validate

from app.schemas.common import UTCDateTime


class NewsletterCampaignCreateSchema(Schema):
    subject = fields.String(
        required=True,
        validate=validate.Length(min=1, max=255),
    )
    body_text = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )
    body_html = fields.String(
        allow_none=True,
        load_default=None,
    )


class NewsletterCampaignUpdateSchema(Schema):
    subject = fields.String(
        validate=validate.Length(min=1, max=255),
    )
    body_text = fields.String(
        validate=validate.Length(min=1),
    )
    body_html = fields.String(allow_none=True)


class NewsletterCampaignScheduleSchema(Schema):
    scheduled_at = fields.DateTime(required=True)


class NewsletterCampaignResponseSchema(Schema):
    id = fields.UUID(dump_only=True)
    subject = fields.String(dump_only=True)
    body_text = fields.String(dump_only=True)
    body_html = fields.String(dump_only=True, allow_none=True)
    status = fields.String(dump_only=True)
    scheduled_at = UTCDateTime(dump_only=True)
    sent_at = UTCDateTime(dump_only=True)
    created_by_user_id = fields.UUID(dump_only=True, allow_none=True)
    created_at = UTCDateTime(dump_only=True)
    updated_at = UTCDateTime(dump_only=True)
