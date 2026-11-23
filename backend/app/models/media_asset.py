import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

MEDIA_KINDS = ("image", "document")


class MediaAsset(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Metadata and storage reference for an uploaded media file."""

    __tablename__ = "media_asset"
    __table_args__ = (
        CheckConstraint(f"kind IN {MEDIA_KINDS}", name="kind"),
    )

    kind: Mapped[str] = mapped_column(String(20), nullable=False, default="image", server_default="image")
    storage_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)

    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)

    alt_text: Mapped[str | None] = mapped_column(String(500))
    public_url: Mapped[str | None] = mapped_column(String(1000))

    uploaded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        # use_alter: user_account -> team_profile -> media_asset -> user_account is a
        # cycle, so this key is added after the tables exist (and dropped first).
        ForeignKey(
            "user_account.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_media_asset_uploaded_by_user_id_user_account",
        ),
        nullable=True,
    )
    uploaded_by = relationship("User")
