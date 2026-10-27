from sqlalchemy import Boolean, CheckConstraint, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db

from .constants import PUBLICATION_STATUSES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ThematicArea(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """The anchor area plus the six connected thematic areas (content guide, "Our Focus").

    The anchor (Rural to Urban Sustainable Development) is one row with is_anchor = true;
    the database allows at most one.
    """

    __tablename__ = "thematic_area"
    __table_args__ = (
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        Index(
            "uq_thematic_area_single_anchor",
            "is_anchor",
            unique=True,
            postgresql_where=text("is_anchor"),
            sqlite_where=text("is_anchor"),
        ),
        Index("ix_thematic_area_publication_status_sort_order", "publication_status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    summary: Mapped[str] = mapped_column(Text)
    people_served: Mapped[str | None] = mapped_column(Text)
    is_anchor: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    # Deliberately no relationship back to programs/tracks: that keeps the database's
    # RESTRICT rule effective (a theme that is in use cannot be deleted; archive it).
