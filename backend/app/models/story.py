import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db

from .constants import TEAM_ROLES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

# Workflow from the handoff guide. Kept as strings + CHECK constraints (not native
# database enums) so the workflow can change with a simple migration.
STORY_STATUSES = ("DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED")
CONSENT_STATUSES = ("unreviewed", "not_required", "confirmed", "withdrawn")
# "story": an update written by a team member. "event": something SOEA hosted, took part
# in, spoke at on air, or a partner meeting, with the event fields filled in.
STORY_TYPES = ("story", "event")
EVENT_ROLES = ("hosted", "participated", "media", "meeting")
PUBLIC_CONSENT_STATUSES = ("confirmed", "not_required")

# Byline: the public profiles a story is attributed to (many-to-many, ordered).
# This is NOT the workflow "created by / reviewed by" user (those come with the admin phase).
story_authors = db.Table(
    "story_authors",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    # RESTRICT: a profile with stories can't be deleted. Archive it instead.
    Column("profile_id", Uuid, ForeignKey("team_profile.id", ondelete="RESTRICT"), primary_key=True),
    Column("sort_order", Integer, nullable=False, default=0),
    Index("ix_story_authors_profile_id", "profile_id"),  # "stories for this profile"
)

# "One update, many views": a story is tagged with the program, phase, place and theme it
# belongs to and then shows up on each of those pages. The story side CASCADEs (deleting a
# story removes its tags); the other side RESTRICTs (something in use cannot be deleted).
story_programs = db.Table(
    "story_programs",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    Column("program_id", Uuid, ForeignKey("program.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_story_programs_program_id", "program_id"),
)

story_phases = db.Table(
    "story_phases",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    Column("phase_id", Uuid, ForeignKey("phase.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_story_phases_phase_id", "phase_id"),
)

story_locations = db.Table(
    "story_locations",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    Column("location_id", Uuid, ForeignKey("location.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_story_locations_location_id", "location_id"),
)

story_themes = db.Table(
    "story_themes",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Uuid, ForeignKey("thematic_area.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_story_themes_theme_id", "theme_id"),
)


class StoryMedia(db.Model):
    """A photo in a story's gallery, in order, with an optional caption."""

    __tablename__ = "story_media"
    __table_args__ = (Index("ix_story_media_media_id", "media_id"),)

    story_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True)
    # RESTRICT: an image in a gallery cannot be deleted until it is removed from the gallery.
    media_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("media_asset.id", ondelete="RESTRICT"), primary_key=True
    )
    sort_order: Mapped[int] = mapped_column(default=0)
    caption: Mapped[str | None] = mapped_column(String(300))

    story = relationship("Story", back_populates="gallery")
    media = relationship("MediaAsset")


class StoryTeamMember(db.Model):
    """The lead / supporting team on a story (content guide: "lead/support team").

    Separate from the byline (story_authors): someone can lead or support an update
    without being its named author. The story shows on that person's profile either way.
    """

    __tablename__ = "story_team"
    __table_args__ = (
        CheckConstraint(f"role IN {TEAM_ROLES}", name="role"),
        Index("ix_story_team_profile_id", "profile_id"),
    )

    story_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("team_profile.id", ondelete="RESTRICT"), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(20))
    sort_order: Mapped[int] = mapped_column(default=0)

    story = relationship("Story", back_populates="team_members")
    # No backref on TeamProfile, so the database's RESTRICT rule stays in force.
    profile = relationship("TeamProfile")


class Story(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "story"
    __table_args__ = (
        CheckConstraint(f"status IN {STORY_STATUSES}", name="status"),
        CheckConstraint(f"consent_status IN {CONSENT_STATUSES}", name="consent_status"),
        CheckConstraint("status <> 'PUBLISHED' OR published_at IS NOT NULL", name="published_has_date"),
        CheckConstraint(f"story_type IN {STORY_TYPES}", name="story_type"),
        CheckConstraint(f"event_role IS NULL OR event_role IN {EVENT_ROLES}", name="event_role"),
        CheckConstraint(
            "event_end_date IS NULL OR activity_date IS NULL OR event_end_date >= activity_date",
            name="event_date_order",
        ),
        Index("ix_story_status_published_at", "status", "published_at"),
    )

    slug: Mapped[str] = mapped_column(String(160), unique=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(String(1000))  # the guide asks for a ~100-word summary
    body: Mapped[str] = mapped_column(Text)

    # When the activity actually happened. Different from published_at (when it went public).
    activity_date: Mapped[date | None] = mapped_column(Date)
    next_step: Mapped[str | None] = mapped_column(Text)
    lessons: Mapped[str | None] = mapped_column(Text)
    outcomes: Mapped[str | None] = mapped_column(Text)  # only if independently substantiated
    video_url: Mapped[str | None] = mapped_column(String(500))  # validate http(s) in the schema
    social_url: Mapped[str | None] = mapped_column(String(500))  # validate http(s) in the schema
    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("media_asset.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Workflow status is separate from published_at (guide requirement).
    status: Mapped[str] = mapped_column(String(20), default="DRAFT")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    consent_status: Mapped[str] = mapped_column(String(20), default="unreviewed")
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    review_notes: Mapped[str | None] = mapped_column(Text)  # internal only; never in public schemas

    story_type: Mapped[str] = mapped_column(String(20), default="story", server_default="story")
    # Event fields (story_type == "event"). activity_date is the (first) day of the event.
    event_end_date: Mapped[date | None] = mapped_column(Date)
    venue: Mapped[str | None] = mapped_column(String(200))
    organiser: Mapped[str | None] = mapped_column(String(300))
    event_role: Mapped[str | None] = mapped_column(String(20))

    # Workflow: who wrote it, when it was sent for review, who reviewed it and when.
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user_account.id", ondelete="SET NULL"), nullable=True, index=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user_account.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_by = relationship("User", foreign_keys=[created_by_user_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_user_id])
    gallery = relationship(
        "StoryMedia",
        back_populates="story",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="StoryMedia.sort_order",
    )

    cover_image = relationship("MediaAsset")

    # WARNING: none of these relationships is filtered by publication rules. Public code
    # must start from app.models.queries, never from story.authors / profile.stories etc.
    authors = relationship(
        "TeamProfile",
        secondary=story_authors,
        back_populates="stories",
        order_by=lambda: _author_order(),
    )
    team_members = relationship(
        "StoryTeamMember",
        back_populates="story",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="StoryTeamMember.sort_order",
    )
    programs = relationship("Program", secondary=story_programs, order_by="Program.sort_order")
    phases = relationship("Phase", secondary=story_phases, order_by="Phase.sequence")
    locations = relationship("Location", secondary=story_locations, order_by="Location.sort_order")
    themes = relationship("ThematicArea", secondary=story_themes, order_by="ThematicArea.sort_order")


def _author_order():
    """Byline order: explicit sort_order first, then a deterministic tie-break.

    Plain ORM appends (story.authors.append(...)) leave sort_order at 0, so without a
    tie-break the byline order of co-authors would be arbitrary.
    """
    from .team_profile import TeamProfile

    return (story_authors.c.sort_order, TeamProfile.display_name, TeamProfile.id)
