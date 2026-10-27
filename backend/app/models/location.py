import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db

from .constants import ENGAGEMENT_STATUSES, LOCATION_TYPES, PUBLICATION_STATUSES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Location(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Kenya, a county, or a community area, as a tree (Kenya > Nairobi > Dandora).

    engagement_status separates places where SOEA works ("active") from counties that are
    only geographic areas of focus ("focus_only"). It defaults to focus_only so nothing is
    presented as active work until someone confirms it.
    """

    __tablename__ = "location"
    __table_args__ = (
        CheckConstraint(f"location_type IN {LOCATION_TYPES}", name="location_type"),
        CheckConstraint(f"engagement_status IN {ENGAGEMENT_STATUSES}", name="engagement_status"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        CheckConstraint("parent_id IS NULL OR parent_id <> id", name="no_self_parent"),
        Index("ix_location_parent_id", "parent_id"),
        Index("ix_location_publication_status_sort_order", "publication_status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    location_type: Mapped[str] = mapped_column(String(20))
    # RESTRICT: a place that still has child places cannot be deleted.
    parent_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("location.id", ondelete="RESTRICT"))
    summary: Mapped[str | None] = mapped_column(Text)
    engagement_status: Mapped[str] = mapped_column(String(20), default="focus_only")
    is_coordination_hub: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    parent = relationship("Location", remote_side="Location.id", back_populates="children")
    # passive_deletes="all": the ORM must not null out children's parent_id on delete,
    # so the database's RESTRICT rule is what protects a place that has children.
    children = relationship(
        "Location",
        back_populates="parent",
        passive_deletes="all",
        order_by="(Location.sort_order, Location.name)",
    )
