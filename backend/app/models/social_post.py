from sqlalchemy import CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from .constants import PUBLICATION_STATUSES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

SOCIAL_PLATFORMS = (
    "facebook",
    "instagram",
    "linkedin",
    "youtube",
    "tiktok",
    "x",
    "other",
)


class SocialPost(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A social media post managed by SOEA."""

    __tablename__ = "social_post"

    __table_args__ = (
        CheckConstraint(
            f"platform IN {SOCIAL_PLATFORMS}",
            name="platform",
        ),
        CheckConstraint(
            f"publication_status IN {PUBLICATION_STATUSES}",
            name="publication_status",
        ),
        Index(
            "ix_social_post_publication_status_sort_order",
            "publication_status",
            "sort_order",
        ),
    )

    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(Text)
    post_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000))
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)
    publication_status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        nullable=False,
    )
