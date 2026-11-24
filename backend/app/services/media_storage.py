"""Store uploaded images and documents on local disk.

Security rules:
- The file type is decided by reading the content, never by the filename or the
  browser-supplied content type.
- Images are decoded and re-encoded with Pillow. This proves they are real images and
  strips metadata (EXIF, including GPS location from phone photos).
- SVG is refused: it can carry scripts. Logos should be uploaded as PNG or WebP.
- Stored names are random; the original filename is kept only as metadata.
"""

import io
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError

# Decoding is refused above this many pixels (decompression-bomb guard).
Image.MAX_IMAGE_PIXELS = 50_000_000

_IMAGE_FORMATS = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
    "WEBP": ("image/webp", "webp"),
}


class UploadError(ValueError):
    """A file that cannot be accepted; the message is safe to show the uploader."""


@dataclass
class StoredFile:
    kind: str
    storage_key: str
    mime_type: str
    file_size: int
    width: int | None = None
    height: int | None = None


def _upload_root() -> Path:
    return Path(current_app.config["UPLOAD_DIR"])


def _new_key(extension: str) -> str:
    now = datetime.now(timezone.utc)
    return f"{now:%Y}/{now:%m}/{secrets.token_hex(16)}.{extension}"


def _write(key: str, data: bytes) -> None:
    path = _upload_root() / key
    path.parent.mkdir(parents=True, exist_ok=True)
    # "x": never overwrite an existing file.
    with open(path, "xb") as handle:
        handle.write(data)


def _store_image(raw: bytes) -> StoredFile:
    config = current_app.config
    if len(raw) > config["MAX_IMAGE_BYTES"]:
        raise UploadError(f"Images can be at most {config['MAX_IMAGE_BYTES'] // (1024 * 1024)} MB.")

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            probe.verify()
        image = Image.open(io.BytesIO(raw))
        source_format = image.format
        image.load()
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError):
        raise UploadError("The file is not a readable JPEG, PNG or WebP image.") from None

    if source_format not in _IMAGE_FORMATS:
        raise UploadError("Upload images as JPEG, PNG or WebP.")

    # Apply the camera's rotation flag before the metadata is dropped.
    image = ImageOps.exif_transpose(image)
    limit = config["MAX_IMAGE_DIMENSION"]
    if max(image.size) > limit:
        image.thumbnail((limit, limit), Image.Resampling.LANCZOS)

    mime_type, extension = _IMAGE_FORMATS[source_format]
    output = io.BytesIO()
    if source_format == "JPEG":
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        image.save(output, "JPEG", quality=85, optimize=True)
    elif source_format == "PNG":
        image.save(output, "PNG", optimize=True)
    else:
        image.save(output, "WEBP", quality=85)

    data = output.getvalue()
    key = _new_key(extension)
    _write(key, data)
    return StoredFile("image", key, mime_type, len(data), image.width, image.height)


def _store_document(raw: bytes) -> StoredFile:
    config = current_app.config
    if len(raw) > config["MAX_DOCUMENT_BYTES"]:
        raise UploadError(f"Documents can be at most {config['MAX_DOCUMENT_BYTES'] // (1024 * 1024)} MB.")
    key = _new_key("pdf")
    _write(key, raw)
    return StoredFile("document", key, "application/pdf", len(raw))


def store_upload(raw: bytes) -> StoredFile:
    """Validate and store one uploaded file; raises UploadError if it is not acceptable."""
    if not raw:
        raise UploadError("The file is empty.")
    if raw.startswith(b"%PDF-"):
        return _store_document(raw)
    return _store_image(raw)


def public_url_for(key: str) -> str:
    return f"{current_app.config['MEDIA_BASE_URL'].rstrip('/')}/{key}"


def delete_stored(key: str) -> None:
    path = (_upload_root() / key).resolve()
    root = _upload_root().resolve()
    if root in path.parents and path.is_file():
        os.remove(path)
