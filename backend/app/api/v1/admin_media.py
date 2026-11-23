"""Uploading and managing images and documents (any signed-in role).

Authors can upload (for their stories) and manage only their own files; admins and
editors manage every file. A file that is still in use cannot be deleted.
"""

from pathlib import PurePath
from uuid import UUID

from flask import abort, g, request
from sqlalchemy import func, select

from app.api.decorators import admin_required
from app.api.helpers import collection_response, item_response, paginate
from app.errors import error_response
from app.extensions import db
from app.models import AuditEvent, MediaAsset, UserRole
from app.schemas.admin import MediaAssetSchema, MediaListQuerySchema, MediaUpdateSchema
from app.services.media_storage import UploadError, delete_stored, public_url_for, store_upload

from . import api_v1

_schema = MediaAssetSchema()


def _is_manager() -> bool:
    return g.current_user.role in UserRole.CONTENT_MANAGERS


def _get_asset(asset_id) -> MediaAsset:
    try:
        parsed = UUID(str(asset_id))
    except (ValueError, TypeError, AttributeError):
        abort(404)
    asset = db.session.get(MediaAsset, parsed)
    # Authors only see their own files; anything else looks like it does not exist.
    if asset is None or (not _is_manager() and asset.uploaded_by_user_id != g.current_user.id):
        abort(404)
    return asset


def _audit(action, asset, details=None):
    db.session.add(AuditEvent(
        actor_user_id=g.current_user.id,
        action=action,
        target_type="media_asset",
        target_id=str(asset.id),
        details=details or {},
    ))


def media_usage_count(asset_id) -> int:
    """How many records point at this file (logos, portraits, covers, galleries)."""
    total = 0
    for table in db.metadata.sorted_tables:
        for column in table.columns:
            for key in column.foreign_keys:
                if key.column.table.name == "media_asset" and table.name != "media_asset":
                    total += db.session.scalar(
                        select(func.count()).select_from(table).where(column == asset_id)
                    )
    return total


@api_v1.post("/admin/media")
@admin_required
def upload_media():
    upload = request.files.get("file")
    if upload is None:
        return error_response(
            400, "VALIDATION_ERROR", "Please correct the highlighted fields.",
            {"file": ["Choose a file to upload."]},
        )

    alt_text = (request.form.get("alt_text") or "").strip() or None
    if alt_text and len(alt_text) > 500:
        return error_response(
            400, "VALIDATION_ERROR", "Please correct the highlighted fields.",
            {"alt_text": ["Longer than maximum length 500."]},
        )

    try:
        stored = store_upload(upload.read())
    except UploadError as exc:
        return error_response(
            400, "VALIDATION_ERROR", "Please correct the highlighted fields.", {"file": [str(exc)]},
        )

    # Keep only the final path component of the original name, for display.
    original = PurePath((upload.filename or "upload").replace("\\", "/")).name[:255] or "upload"

    asset = MediaAsset(
        kind=stored.kind,
        storage_key=stored.storage_key,
        original_filename=original,
        mime_type=stored.mime_type,
        file_size=stored.file_size,
        width=stored.width,
        height=stored.height,
        alt_text=alt_text,
        public_url=public_url_for(stored.storage_key),
        uploaded_by_user_id=g.current_user.id,
    )
    db.session.add(asset)
    db.session.flush()
    _audit("media.uploaded", asset, {"kind": asset.kind})
    db.session.commit()
    return item_response(_schema.dump(asset)), 201


@api_v1.get("/admin/media")
@admin_required
def list_media():
    args = MediaListQuerySchema().load(request.args)
    statement = select(MediaAsset)
    if not _is_manager():
        statement = statement.where(MediaAsset.uploaded_by_user_id == g.current_user.id)
    if args.get("kind"):
        statement = statement.where(MediaAsset.kind == args["kind"])
    statement = statement.order_by(MediaAsset.created_at.desc(), MediaAsset.id)
    pagination = paginate(statement, args)
    return collection_response(_schema.dump(pagination.items, many=True), pagination)


@api_v1.get("/admin/media/<asset_id>")
@admin_required
def get_media(asset_id):
    asset = _get_asset(asset_id)
    data = _schema.dump(asset)
    data["in_use"] = media_usage_count(asset.id)
    return item_response(data)


@api_v1.patch("/admin/media/<asset_id>")
@admin_required
def update_media(asset_id):
    asset = _get_asset(asset_id)
    data = MediaUpdateSchema().load(request.get_json(silent=True) or {})
    asset.alt_text = (data["alt_text"] or "").strip() or None
    _audit("media.updated", asset, {"fields": ["alt_text"]})
    db.session.commit()
    return item_response(_schema.dump(asset))


@api_v1.delete("/admin/media/<asset_id>")
@admin_required
def delete_media(asset_id):
    asset = _get_asset(asset_id)
    if media_usage_count(asset.id):
        return error_response(
            409, "CONFLICT", "This file is still in use. Remove it from those records first.",
        )
    key = asset.storage_key
    _audit("media.deleted", asset, {"kind": asset.kind})
    db.session.delete(asset)
    db.session.commit()
    delete_stored(key)
    return "", 204
