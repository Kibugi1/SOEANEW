"""Public (read-only) partner schemas."""

from marshmallow import Schema, fields, validate

from app.models.constants import PARTNER_TYPES

from .common import PaginationQuerySchema, public_image, safe_http_url
from .urls import PARTNER_URL_PREFIX


class PartnershipAreaSchema(Schema):
    slug = fields.String()
    name = fields.String()
    summary = fields.String(allow_none=True)


class PartnerListQuerySchema(PaginationQuerySchema):
    type = fields.String(data_key="type", validate=validate.OneOf(PARTNER_TYPES))


class PartnerListSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    name = fields.String()
    partner_type = fields.String()
    summary = fields.String(allow_none=True)
    website_url = fields.Function(lambda partner: safe_http_url(partner.website_url))
    logo = fields.Function(lambda partner: public_image(partner.logo, fallback_alt=f"{partner.name} logo"))
    areas = fields.Function(
        lambda partner: PartnershipAreaSchema(many=True).dump(
            [
                area
                for area in partner.areas
                if area.publication_status == "published"
            ]
        )
    )
    url = fields.Function(lambda partner: f"{PARTNER_URL_PREFIX}/{partner.slug}")