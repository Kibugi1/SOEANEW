import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

RESOURCE_TYPES = (
    "report", "guide", "toolkit", "policy",
    "research", "news", "other",
)

resource_stories = db.Table(
    "resource_stories",
    Column("resource_id", Uuid, ForeignKey("resource.id", ondelete="CASCADE"), primary_key=True),
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_resource_stories_story_id", "story_id"),
)


class Resource(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A public-facing report, guide, toolkit or other SOEA resource."""

    __tablename__ = "resource"

    __table_args__ = (
        CheckConstraint(
            "resource_type IN ('report','guide','toolkit','policy','research','news','other')",
            name="resource_type",
        ),
        CheckConstraint(
            "publication_status IN ('draft','published','archived')",
            name="publication_status",
        ),
        Index("ix_resource_publication_date", "publication_status", "published_on"),
    )

    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(20), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    plain_language_summary: Mapped[str | None] = mapped_column(Text)
    published_on: Mapped[date | None] = mapped_column(Date)
    document_url: Mapped[str | None] = mapped_column(String(1000))

    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("media_asset.id", ondelete="SET NULL")
    )
    program_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("program.id", ondelete="SET NULL")
    )
    location_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("location.id", ondelete="SET NULL")
    )
    phase_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("phase.id", ondelete="SET NULL")
    )

    publication_status: Mapped[str] = mapped_column(
        String(20), default="draft", nullable=False
    )

    cover_image = relationship("MediaAsset")
    program = relationship("Program")
    location = relationship("Location")
    phase = relationship("Phase")
    stories = relationship(
        "Story",
        secondary=resource_stories,
        order_by="Story.published_at.desc()",
    )
