from uuid import UUID

from sqlalchemy import ForeignKey, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AuditEvent(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Append-only record of privileged account and administration actions."""

    __tablename__ = "audit_event"

    actor_user_id: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("user_account.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )
    target_type: Mapped[str] = mapped_column(
        String(80), nullable=False
    )
    target_id: Mapped[str | None] = mapped_column(
        String(80), nullable=True
    )
    details: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
