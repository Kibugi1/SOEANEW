import secrets
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


ENQUIRY_KINDS = ("partnership", "volunteer", "contact")
ENQUIRY_INBOXES = ("partnerships", "volunteers", "info")
ENQUIRY_STATUSES = ("new", "in_review", "contacted", "closed")

# Contact-journey topics that belong with the partnerships team; every other topic goes
# to the general inbox. Decided on the server so a client cannot pick its own inbox.
PARTNERSHIP_CONTACT_TOPICS = ("partnerships", "research", "institutional")
CONTACT_TOPICS = (
    "general", "partnerships", "community", "research", "media", "institutional",
)


def inbox_for(kind: str, topic: str | None = None) -> str:
    if kind == "partnership":
        return "partnerships"
    if kind == "volunteer":
        return "volunteers"
    return "partnerships" if topic in PARTNERSHIP_CONTACT_TOPICS else "info"


class ContactEnquiry(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """A private message sent through the website: a partnership enquiry, a volunteer
    application or a general contact message. Together these make the admin inbox.
    """

    __tablename__ = "contact_enquiry"

    __table_args__ = (
        Index("ix_contact_enquiry_created_at", "created_at"),
        Index("ix_contact_enquiry_inbox_status", "inbox", "status"),
        CheckConstraint(f"kind IN {ENQUIRY_KINDS}", name="kind"),
        CheckConstraint(f"inbox IN {ENQUIRY_INBOXES}", name="inbox"),
        CheckConstraint(f"status IN {ENQUIRY_STATUSES}", name="status"),
    )

    kind: Mapped[str] = mapped_column(
        String(20), nullable=False, default="partnership", server_default="partnership"
    )
    inbox: Mapped[str] = mapped_column(
        String(20), nullable=False, default="partnerships", server_default="partnerships"
    )
    # Short reference shown to the sender and quoted in replies, e.g. SOEA-PA-7K3F9Q.
    reference: Mapped[str | None] = mapped_column(String(24), unique=True)
    topic: Mapped[str | None] = mapped_column(String(40))  # contact journey only

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    organization: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    partnership_category: Mapped[str | None] = mapped_column(String(120))  # legacy single value
    experience_resources: Mapped[str | None] = mapped_column(Text)
    message: Mapped[str | None] = mapped_column(Text)
    # Journey-specific answers, e.g. {"interests": [...]} or
    # {"area": ..., "skills": ..., "availability": ..., "motivation": ...}.
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    source_page: Mapped[str | None] = mapped_column(String(200))

    # No default: the form must explicitly provide consent.
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Private internal workflow; never exposed in public responses.
    status: Mapped[str] = mapped_column(
        String(20),
        default="new",
        nullable=False,
    )
    internal_notes: Mapped[str | None] = mapped_column(Text)
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user_account.id", ondelete="SET NULL"), nullable=True
    )
    status_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assigned_to = relationship("User")


class Subscriber(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Newsletter subscriber and consent record."""

    __tablename__ = "subscriber"

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'unsubscribed')",
            name="status",
        ),
        Index("ix_subscriber_status", "status"),
    )

    email: Mapped[str] = mapped_column(
        String(254),
        unique=True,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )

    consent_text_version: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    # Rotated whenever a new subscription confirmation is requested.
    token_nonce: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=lambda: secrets.token_urlsafe(32),
    )
