"""Public, read-only social post schemas."""

from marshmallow import Schema, fields, validate

from app.models.social_post import SOCIAL_PLATFORMS
from .common import PaginationQuerySchema, UTCDateTime, safe_http_url


class SocialPostListQuerySchema(PaginationQuerySchema):
    platform = fields.String(validate=validate.OneOf(SOCIAL_PLATFORMS))


class SocialPostListSchema(Schema):
    id = fields.UUID()
    platform = fields.String()
    title = fields.String(allow_none=True)
    caption = fields.String(allow_none=True)
    post_url = fields.Function(lambda post: safe_http_url(post.post_url))
    thumbnail_url = fields.Function(lambda post: safe_http_url(post.thumbnail_url))
    created_at = UTCDateTime()
