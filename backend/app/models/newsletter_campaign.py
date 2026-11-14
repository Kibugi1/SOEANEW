from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


CAMPAIGN_STATUSES = (
    "draft",
    "scheduled",
    "sending",
    "sent",
    "failed",
)

DELIVERY_STATUSES = (
    "pending",
    "sent",
    "failed",
)


class NewsletterCampaign(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """An administrative newsletter campaign."""

    __tablename__ = "newsletter_campaign"

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')",
            name="status",
        ),
        Index("ix_newsletter_campaign_status", "status"),
        Index("ix_newsletter_campaign_scheduled_at", "scheduled_at"),
    )

    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    body_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    sending_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    sending_heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_user_id: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("user_account.id", ondelete="SET NULL"),
        nullable=True,
    )


class NewsletterDelivery(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Delivery record for one subscriber and one newsletter campaign."""

    __tablename__ = "newsletter_delivery"

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'sent', 'failed')",
            name="status",
        ),
        UniqueConstraint(
            "campaign_id",
            "subscriber_id",
            name="uq_newsletter_delivery_campaign_subscriber",
        ),
        Index("ix_newsletter_delivery_status", "status"),
        Index("ix_newsletter_delivery_campaign_status", "campaign_id", "status"),
    )

    campaign_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("newsletter_campaign.id", ondelete="CASCADE"),
        nullable=False,
    )
    subscriber_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("subscriber.id", ondelete="RESTRICT"),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
