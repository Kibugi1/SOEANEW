from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from .mixins import TimestampMixin, UUIDPrimaryKeyMixin


class UserRole:
    ADMIN = "admin"
    EDITOR = "editor"
    ALL = (ADMIN, EDITOR)


class User(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    """Administrative identity; never exposed by public content endpoints."""

    __tablename__ = "user_account"

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'editor')",
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
