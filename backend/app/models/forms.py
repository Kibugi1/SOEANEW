import secrets

from sqlalchemy import Boolean, CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ContactEnquiry(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Private enquiry submitted through the SOEA contact form."""

    __tablename__ = "contact_enquiry"

    __table_args__ = (
        Index("ix_contact_enquiry_created_at", "created_at"),
    )

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    organization: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(40))
    partnership_category: Mapped[str] = mapped_column(String(120), nullable=False)
    experience_resources: Mapped[str | None] = mapped_column(Text)
    message: Mapped[str] = mapped_column(Text)

    # No default: the form must explicitly provide consent.
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Private internal workflow status; never expose in public responses.
    status: Mapped[str] = mapped_column(
        String(20),
        default="new",
        nullable=False,
    )


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
