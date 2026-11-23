import uuid
from datetime import date

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db

from .constants import PROGRESS_STATUSES, PUBLICATION_STATUSES, TRACK_TYPES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

# Association tables. The program/track side CASCADEs (deleting a program removes its
# links); the theme/location side RESTRICTs (a theme or place in use cannot be deleted).
program_themes = db.Table(
    "program_themes",
    Column("program_id", Uuid, ForeignKey("program.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Uuid, ForeignKey("thematic_area.id", ondelete="RESTRICT"), primary_key=True),
    # CECI is cross-thematic but "anchored within" one area: at most one primary theme.
    Column("is_primary", Boolean, nullable=False, default=False),
    Index(
        "uq_program_themes_one_primary_per_program",
        "program_id",
        unique=True,
        postgresql_where=text("is_primary"),
        sqlite_where=text("is_primary"),
    ),
    Index("ix_program_themes_theme_id", "theme_id"),
)

program_locations = db.Table(
    "program_locations",
    Column("program_id", Uuid, ForeignKey("program.id", ondelete="CASCADE"), primary_key=True),
    Column("location_id", Uuid, ForeignKey("location.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_program_locations_location_id", "location_id"),
)

track_themes = db.Table(
    "track_themes",
    Column("track_id", Uuid, ForeignKey("training_track.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Uuid, ForeignKey("thematic_area.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_track_themes_theme_id", "theme_id"),
)


class Program(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A SOEA program or initiative (CECI is the first and featured one)."""

    __tablename__ = "program"
    __table_args__ = (
        CheckConstraint(f"status IN {PROGRESS_STATUSES}", name="status"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        CheckConstraint("start_date IS NULL OR end_date IS NULL OR end_date >= start_date", name="date_order"),
        Index("ix_program_publication_status_sort_order", "publication_status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    short_name: Mapped[str | None] = mapped_column(String(30))  # e.g. "CECI"
    summary: Mapped[str] = mapped_column(String(500))  # one-sentence card text
    body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="planned")  # public badge
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    # A project that sits under a larger program (JEET Champions under CECI). RESTRICT:
    # a program with sub-programs cannot be deleted.
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("program.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    lead_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("team_profile.id", ondelete="SET NULL"), nullable=True
    )
    # Approved public contact for this program only (e.g. the project lead's work email).
    contact_email: Mapped[str | None] = mapped_column(String(254))
    # Call to action. While cta_pending is true the button is shown without a link
    # ("contact route to be confirmed"), so it can be announced before it is approved.
    cta_label: Mapped[str | None] = mapped_column(String(120))
    cta_url: Mapped[str | None] = mapped_column(String(500))
    cta_pending: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    parent = relationship("Program", remote_side="Program.id", back_populates="children")
    children = relationship("Program", back_populates="parent", order_by="Program.sort_order")
    lead = relationship("TeamProfile")
    # WARNING: these relationships are unfiltered. Public code uses app.models.queries.
    themes = relationship("ThematicArea", secondary=program_themes, order_by="ThematicArea.sort_order")
    partners = relationship(
        "Partner", secondary="program_partners", back_populates="programs", order_by="Partner.sort_order",
    )
    locations = relationship("Location", secondary=program_locations, order_by="Location.sort_order")
    phases = relationship(
        "Phase",
        back_populates="program",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Phase.sequence",
    )
    tracks = relationship(
        "TrainingTrack",
        back_populates="program",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TrainingTrack.sort_order",
    )


class Phase(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A program phase (CECI: Phase 0 completed, Phase 1 in progress, Phase 2 planned)."""

    __tablename__ = "phase"
    __table_args__ = (
        UniqueConstraint("program_id", "sequence", name="uq_phase_program_id_sequence"),
        UniqueConstraint("program_id", "slug", name="uq_phase_program_id_slug"),
        CheckConstraint("sequence >= 0", name="sequence_non_negative"),
        CheckConstraint(f"status IN {PROGRESS_STATUSES}", name="status"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        CheckConstraint("start_date IS NULL OR end_date IS NULL OR end_date >= start_date", name="date_order"),
    )

    program_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("program.id", ondelete="CASCADE"))
    sequence: Mapped[int]  # phase number: 0, 1, 2 ...
    slug: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(Text)
    # The guide gives months only ("October 2026 to March 2027"), so the label is free text
    # and real dates stay empty until they are verified.
    period_label: Mapped[str | None] = mapped_column(String(100))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="planned")
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    program = relationship("Program", back_populates="phases")
    milestones = relationship(
        "Milestone",
        back_populates="phase",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Milestone.sort_order",
    )


class Milestone(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A verified milestone inside a phase (e.g. the Waste Pickers Super Day in Phase 0)."""

    __tablename__ = "milestone"
    __table_args__ = (
        UniqueConstraint("phase_id", "slug", name="uq_milestone_phase_id_slug"),
        CheckConstraint(f"status IN {PROGRESS_STATUSES}", name="status"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
    )

    phase_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("phase.id", ondelete="CASCADE"))
    slug: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(Text)
    occurred_on: Mapped[date | None] = mapped_column(Date)  # only a verified date
    venue: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="planned")
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    phase = relationship("Phase", back_populates="milestones")


class TrainingTrack(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A learning track: the core skills, or a specialized pathway (textiles, compost, glass)."""

    __tablename__ = "training_track"
    __table_args__ = (
        UniqueConstraint("program_id", "slug", name="uq_training_track_program_id_slug"),
        CheckConstraint(f"track_type IN {TRACK_TYPES}", name="track_type"),
        CheckConstraint(f"status IN {PROGRESS_STATUSES}", name="status"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
    )

    program_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("program.id", ondelete="CASCADE"))
    slug: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(200))
    track_type: Mapped[str] = mapped_column(String(20), default="specialized")
    summary: Mapped[str | None] = mapped_column(Text)
    intended_skills: Mapped[str | None] = mapped_column(Text)
    practical_activity: Mapped[str | None] = mapped_column(Text)
    safety_requirements: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="planned")  # current stage
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")

    program = relationship("Program", back_populates="tracks")
    themes = relationship("ThematicArea", secondary=track_themes, order_by="ThematicArea.sort_order")
