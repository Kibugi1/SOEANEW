import uuid
from sqlalchemy import JSON, CheckConstraint, Column, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db

from .mixins import TimestampMixin, UUIDPrimaryKeyMixin
from .story import story_authors

ROLE_TYPES = ("staff", "volunteer", "leadership")
PROFILE_STATUSES = ("draft", "published", "archived")

# "Programs supported" on a profile. The profile side CASCADEs; the program side RESTRICTs.
profile_programs = db.Table(
    "profile_programs",
    Column("profile_id", Uuid, ForeignKey("team_profile.id", ondelete="CASCADE"), primary_key=True),
    Column("program_id", Uuid, ForeignKey("program.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_profile_programs_program_id", "program_id"),
)


class TeamProfile(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Public-facing profile. Kept separate from any private login account."""

    __tablename__ = "team_profile"
    __table_args__ = (
        CheckConstraint(f"role_type IN {ROLE_TYPES}", name="role_type"),
        CheckConstraint(f"status IN {PROFILE_STATUSES}", name="status"),
        Index("ix_team_profile_status_sort_order", "status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)  # stable once published
    display_name: Mapped[str] = mapped_column(String(150))
    first_name: Mapped[str | None] = mapped_column(String(80))  # shown in the photo grid
    role_title: Mapped[str] = mapped_column(String(200))
    short_role: Mapped[str | None] = mapped_column(String(120))  # shown in the photo grid
    role_type: Mapped[str] = mapped_column(String(20))
    bio: Mapped[str | None] = mapped_column(Text)  # approved public biography (70-100 words)
    education: Mapped[str | None] = mapped_column(Text)  # only once approved
    fun_fact: Mapped[str | None] = mapped_column(String(300))  # one line, supplied by the person
    # Approved, publishable work email ONLY. Never a login address (that stays on the future
    # private User record). Leave empty until the person and SOEA have approved it.
    public_email: Mapped[str | None] = mapped_column(String(254))
    social_links: Mapped[list] = mapped_column(JSON, default=list)  # validate URLs in the schema
    image_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("media_asset.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="draft")
    sort_order: Mapped[int] = mapped_column(default=0)
    image = relationship("MediaAsset")
    # WARNING: unfiltered. Public code must use app.models.queries.
    # passive_deletes="all" stops the ORM from silently removing story_authors rows,
    # so the database's RESTRICT rule is what protects a profile that has stories.
    stories = relationship(
        "Story",
        secondary=story_authors,
        back_populates="authors",
        passive_deletes="all",
    )
    programs = relationship("Program", secondary=profile_programs, order_by="Program.sort_order")
