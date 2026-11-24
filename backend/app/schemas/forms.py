"""Validation schemas for public forms."""

from marshmallow import Schema, fields, pre_load, validate, validates_schema, ValidationError

from app.models.forms import CONTACT_TOPICS, ENQUIRY_KINDS


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
    """One schema for every website message; `kind` decides which fields are required.

    partnership  organization, interests (or the legacy partnership_category),
                 experience_resources; message optional.
    volunteer    area, skills, availability, motivation.
    contact      topic and message; organization optional.

    The default kind is "partnership", so existing clients keep working.
    """

    kind = fields.String(load_default="partnership", validate=validate.OneOf(ENQUIRY_KINDS))
    name = fields.String(required=True, validate=validate.Length(min=1, max=160))
    organization = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True, validate=validate.Length(max=254))
    phone = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=40))

    # Partnership
    partnership_category = fields.String(
        allow_none=True, load_default=None, validate=validate.Length(min=1, max=120)
    )
    interests = fields.List(
        fields.String(validate=validate.Length(min=1, max=80)),
        load_default=None,
        validate=validate.Length(min=1, max=12),
    )
    experience_resources = fields.String(
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=5000),
    )

    # Volunteer
    area = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=1, max=80))
    skills = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=1, max=5000))
    availability = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=1, max=80))
    motivation = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=1, max=5000))

    # Contact
    topic = fields.String(allow_none=True, load_default=None, validate=validate.OneOf(CONTACT_TOPICS))

    message = fields.String(allow_none=True, load_default=None, validate=validate.Length(min=10, max=10000))
    source_page = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=200))
    consent = fields.Boolean(
        required=True,
        validate=validate.Equal(True, error="Consent must be provided."),
    )
    # Honeypot: hidden from people, so only bots fill it. Accepted, then discarded.
    website = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=500))

    _REQUIRED_BY_KIND = {
        "partnership": ("organization",),
        "volunteer": ("area", "skills", "availability", "motivation"),
        "contact": ("topic", "message"),
    }

    @validates_schema
    def reject_blank_required_text(self, data, **kwargs):
        errors = {}
        kind = data.get("kind", "partnership")

        for field_name in ("name", "organization", "partnership_category"):
            if field_name in data and data[field_name] is not None and not data[field_name]:
                errors[field_name] = ["This field cannot be blank."]
        if not data.get("name"):
            errors.setdefault("name", ["This field cannot be blank."])

        for field_name in self._REQUIRED_BY_KIND[kind]:
            if not data.get(field_name):
                errors.setdefault(field_name, ["This field is required."])

        if kind == "partnership" and not data.get("interests") and not data.get("partnership_category"):
            errors.setdefault("interests", ["Choose at least one partnership area."])

        if errors:
            raise ValidationError(errors)


class NewsletterSubscriptionCreateSchema(TrimmedSchema):
    email = fields.Email(required=True, validate=validate.Length(max=254))
    consent = fields.Boolean(
        required=True,
        validate=validate.Equal(True, error="Newsletter consent must be provided."),
    )
