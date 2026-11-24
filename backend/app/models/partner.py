import uuid

from sqlalchemy import CheckConstraint, Column, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db

from .constants import PARTNER_TYPES, PUBLICATION_STATUSES
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin

# The owner side (partner, program, track, story) CASCADEs; the partner / area side
# RESTRICTs, so a partner or partnership area that is in use cannot be deleted. Archive it.
partner_areas = db.Table(
    "partner_areas",
    Column("partner_id", Uuid, ForeignKey("partner.id", ondelete="CASCADE"), primary_key=True),
    Column("area_id", Uuid, ForeignKey("partnership_area.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_partner_areas_area_id", "area_id"),
)

program_partners = db.Table(
    "program_partners",
    Column("program_id", Uuid, ForeignKey("program.id", ondelete="CASCADE"), primary_key=True),
    Column("partner_id", Uuid, ForeignKey("partner.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_program_partners_partner_id", "partner_id"),
)

track_partners = db.Table(
    "track_partners",
    Column("track_id", Uuid, ForeignKey("training_track.id", ondelete="CASCADE"), primary_key=True),
    Column("partner_id", Uuid, ForeignKey("partner.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_track_partners_partner_id", "partner_id"),
)

story_partners = db.Table(
    "story_partners",
    Column("story_id", Uuid, ForeignKey("story.id", ondelete="CASCADE"), primary_key=True),
    Column("partner_id", Uuid, ForeignKey("partner.id", ondelete="RESTRICT"), primary_key=True),
    Index("ix_story_partners_partner_id", "partner_id"),
)


class PartnershipArea(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A category of partnership (for example curriculum, legal awareness, finance).

    The content guide words these differently on the CECI Phase 1 page and the Partner With Us
    page, so no list is hard-coded: the content owner decides the canonical set, and the same
    rows can later feed the contact-form dropdown.
    """

    __tablename__ = "partnership_area"
    __table_args__ = (
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        Index("ix_partnership_area_publication_status_sort_order", "publication_status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    summary: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")


class Partner(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """An APPROVED partner organization. Draft by default.

    Never invent partner relationships, and never store negotiation details here: only
    publish a partner once SOEA has approved showing it. There is deliberately no contact
    email; enquiries go through the partnerships inbox.
    """

    __tablename__ = "partner"
    __table_args__ = (
        CheckConstraint(f"partner_type IN {PARTNER_TYPES}", name="partner_type"),
        CheckConstraint(f"publication_status IN {PUBLICATION_STATUSES}", name="publication_status"),
        Index("ix_partner_publication_status_sort_order", "publication_status", "sort_order"),
    )

    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    partner_type: Mapped[str] = mapped_column(String(30))
    summary: Mapped[str | None] = mapped_column(Text)  # what they contribute, in approved wording
    website_url: Mapped[str | None] = mapped_column(String(500))  # validated as http(s) when serialized
    sort_order: Mapped[int] = mapped_column(default=0)
    publication_status: Mapped[str] = mapped_column(String(20), default="draft")
    logo_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("media_asset.id", ondelete="SET NULL"), nullable=True
    )

    logo = relationship("MediaAsset")
    # WARNING: unfiltered. Public code must use app.models.queries.
    areas = relationship("PartnershipArea", secondary=partner_areas, order_by="PartnershipArea.sort_order")
    # passive_deletes="all": the ORM must not quietly remove program links, so the
    # database's RESTRICT rule stops a partner in use from being deleted (archive it).
    programs = relationship(
        "Program",
        secondary=program_partners,
        back_populates="partners",
        order_by="Program.sort_order",
        passive_deletes="all",
    )
