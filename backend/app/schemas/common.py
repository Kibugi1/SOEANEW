from datetime import timezone
from urllib.parse import urlsplit

from marshmallow import EXCLUDE, Schema, fields, validate

DEFAULT_PER_PAGE = 12
MAX_PER_PAGE = 50


class UTCDateTime(fields.Field):
    """Serialize datetimes as ISO 8601 UTC, e.g. 2026-10-21T08:00:00Z.

    SQLite returns naive datetimes (tzinfo dropped), so naive values are treated as UTC.
    """

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class PaginationQuerySchema(Schema):
    class Meta:
        unknown = EXCLUDE  # ignore unrelated query parameters

    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(
        load_default=DEFAULT_PER_PAGE, validate=validate.Range(min=1, max=MAX_PER_PAGE)
    )


_ALLOWED_URL_SCHEMES = {"http", "https"}


def safe_http_url(value) -> str | None:
    """Return the URL only if it is a real http(s) link with a host, else None.

    Defence in depth: javascript:, data:, host-less and malformed values never reach a browser.
    """
    if not isinstance(value, str):
        return None
    value = value.strip()
    parts = urlsplit(value)
    if parts.scheme.lower() in _ALLOWED_URL_SCHEMES and parts.netloc:
        return value
    return None


def public_image(asset, fallback_alt: str | None = None) -> dict | None:
    """Only the public parts of an uploaded image: its URL and alt text."""
    if asset is None or getattr(asset, "kind", "image") != "image":
        return None
    url = safe_http_url(asset.public_url)
    if not url:
        return None
    return {
        "url": url,
        "alt_text": asset.alt_text or fallback_alt,
        "width": asset.width,
        "height": asset.height,
    }


def safe_http_or_path(value) -> str | None:
    """An http(s) URL, or a site-relative path such as /partner-with-us, else None."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if value.startswith("/") and not value.startswith("//") and "\\" not in value:
        return value
    return safe_http_url(value)
