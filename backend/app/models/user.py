from datetime import datetime

import uuid

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class UserRole:
    """Account roles.

    admin   The founder / executive lead. Approves and publishes stories, publishes
            programs and partners, manages accounts. Sees everything.
    editor  Communications / program staff. Manages content drafts, the inbox and
            newsletters, but cannot publish stories or manage accounts.
    author  Staff and volunteers who write stories. Sees and edits only their own
            stories and submits them for review.
    """
    ADMIN = "admin"
    EDITOR = "editor"
    AUTHOR = "author"
    ALL = (ADMIN, EDITOR, AUTHOR)
    # Roles that may manage shared content and see the inbox.
    CONTENT_MANAGERS = (ADMIN, EDITOR)


class User(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Administrative identity; never exposed by public content endpoints."""

    __tablename__ = "user_account"

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'editor', 'author')",
            name="role",
        ),
        CheckConstraint(
            "length(email) >= 5",
            name="email_min_length",
        ),
    )

    email: Mapped[str] = mapped_column(
        String(254), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(512), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserRole.EDITOR
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    token_version: Mapped[int] = mapped_column(
        nullable=False, default=1, server_default="1"
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    # Set when an administrator creates the account or resets its password, so the
    # person picks their own password at first login.
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    # The public profile this login writes as. A story an author creates is bylined to
    # this profile, so it appears on their profile page once published.
    team_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("team_profile.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )

    team_profile = relationship("TeamProfile")

    def set_password(self, password: str) -> None:
        if not isinstance(password, str) or not 12 <= len(password) <= 256:
            raise ValueError(
                "Password must contain between 12 and 256 characters."
            )

        self.password_hash = generate_password_hash(
            password, method="scrypt"
        )

    def check_password(self, password: str) -> bool:
        if not isinstance(password, str):
            return False

        try:
            return check_password_hash(self.password_hash, password)
        except (ValueError, TypeError):
            return False
