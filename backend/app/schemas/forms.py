"""Validation schemas for public forms."""

from marshmallow import Schema, fields, pre_load, validate, validates_schema, ValidationError


class TrimmedSchema(Schema):
    @pre_load
    def trim_strings(self, data, **kwargs):
        if isinstance(data, dict):
            return {
                key: value.strip() if isinstance(value, str) else value
                for key, value in data.items()
            }
        return data


class ContactEnquiryCreateSchema(TrimmedSchema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=160))
    organization = fields.String(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True, validate=validate.Length(max=254))
    phone = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=40))
    partnership_category = fields.String(required=True, validate=validate.Length(min=1, max=120))
    experience_resources = fields.String(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=5000),
    )
    message = fields.String(required=True, validate=validate.Length(min=10, max=10000))
    consent = fields.Boolean(
        required=True,
        validate=validate.Equal(True, error="Consent must be provided."),
    )

    @validates_schema
    def reject_blank_required_text(self, data, **kwargs):
        for field_name in ("name", "organization", "partnership_category"):
            if not data.get(field_name):
                raise ValidationError(
                    {field_name: ["This field cannot be blank."]}
                )


class NewsletterSubscriptionCreateSchema(TrimmedSchema):
    email = fields.Email(required=True, validate=validate.Length(max=254))
    consent = fields.Boolean(
        required=True,
        validate=validate.Equal(True, error="Newsletter consent must be provided."),
    )
