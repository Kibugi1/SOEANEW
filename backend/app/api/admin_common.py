"""Helpers shared by the admin content endpoints."""

import re
import unicodedata
from uuid import UUID

from flask import abort, g
from marshmallow import ValidationError
from sqlalchemy import select

from app.extensions import db
from app.models import AuditEvent, MediaAsset

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
_SLUG_RE = re.compile(SLUG_PATTERN)


def get_or_404(model, object_id):
    try:
        parsed = UUID(str(object_id))
    except (ValueError, TypeError, AttributeError):
        abort(404)
    obj = db.session.get(model, parsed)
    if obj is None:
        abort(404)
    return obj


def audit(action: str, target_type: str, obj, details: dict | None = None) -> None:
    db.session.add(AuditEvent(
        actor_user_id=g.current_user.id,
        action=action,
        target_type=target_type,
        target_id=str(obj.id),
        details=details or {},
    ))


def field_error(field: str, message: str) -> ValidationError:
    """Raise this to return the standard 400 VALIDATION_ERROR for one field."""
    return ValidationError({field: [message]})


def slugify(text: str, max_length: int = 120) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug[:max_length].rstrip("-") or "item"


def unique_slug(model, wanted: str, exclude_id=None, max_length: int = 120) -> str:
    """`wanted`, or `wanted-2`, `wanted-3` ... if already taken."""
    base = slugify(wanted, max_length)
    candidate, number = base, 2
    while True:
        statement = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            statement = statement.where(model.id != exclude_id)
        if db.session.execute(statement).first() is None:
            return candidate
        suffix = f"-{number}"
        candidate = base[: max_length - len(suffix)] + suffix
        number += 1


def check_slug_free(model, slug: str, exclude_id=None) -> None:
    if not _SLUG_RE.match(slug):
        raise field_error("slug", "Use lowercase letters, numbers and single hyphens.")
    statement = select(model.id).where(model.slug == slug)
    if exclude_id is not None:
        statement = statement.where(model.id != exclude_id)
    if db.session.execute(statement).first() is not None:
        raise field_error("slug", "This slug is already in use.")


def resolve_slugs(model, slugs: list[str], field: str, slug_attr: str = "slug") -> list:
    """Load rows by slug, in the given order; unknown slugs are a validation error."""
    unique = list(dict.fromkeys(slugs))
    rows = db.session.scalars(select(model).where(getattr(model, slug_attr).in_(unique))).all()
    by_slug = {getattr(row, slug_attr): row for row in rows}
    missing = [slug for slug in unique if slug not in by_slug]
    if missing:
        raise field_error(field, f"Unknown: {', '.join(missing)}.")
    return [by_slug[slug] for slug in unique]


def resolve_image(asset_id, field: str):
    """An uploaded image by id, or None; a document or unknown id is a validation error."""
    if asset_id is None:
        return None
    asset = db.session.get(MediaAsset, asset_id)
    if asset is None or asset.kind != "image":
        raise field_error(field, "Choose an uploaded image.")
    return asset
