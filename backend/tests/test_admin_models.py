import pytest

from app.models import User, UserRole, AuditEvent


def test_user_model_registration():
    assert User.__tablename__ == "user_account"


def test_user_roles():
    assert UserRole.ALL == ("admin", "editor", "author")
    assert UserRole.CONTENT_MANAGERS == ("admin", "editor")


def test_user_password_hashing():
    user = User(email="admin@example.com")
    user.set_password("StrongPassword123!")
    assert user.password_hash != "StrongPassword123!"
    assert user.check_password("StrongPassword123!")
    assert not user.check_password("WrongPassword123!")


def test_user_rejects_short_password():
    user = User(email="admin@example.com")
    with pytest.raises(ValueError):
        user.set_password("short")


def test_user_accepts_maximum_password_length():
    user = User(email="admin@example.com")
    password = "A" * 256

    user.set_password(password)

    assert user.check_password(password)


def test_user_rejects_password_over_maximum_length():
    user = User(email="admin@example.com")

    with pytest.raises(ValueError):
        user.set_password("A" * 257)


@pytest.mark.parametrize("password", [None, 123, [], {}])
def test_user_rejects_non_string_password(password):
    user = User(email="admin@example.com")

    with pytest.raises(ValueError):
        user.set_password(password)


def test_user_account_fields():
    expected = {
        "email", "password_hash", "role",
        "is_active", "token_version", "last_login_at",
    }
    assert expected.issubset(User.__table__.columns.keys())


def test_audit_event_model_registration():
    assert AuditEvent.__tablename__ == "audit_event"


def test_audit_event_fields():
    expected = {
        "actor_user_id", "action",
        "target_type", "target_id", "details",
    }
    assert expected.issubset(AuditEvent.__table__.columns.keys())


def test_audit_event_actor_foreign_key():
    column = AuditEvent.__table__.columns["actor_user_id"]
    assert any(
        fk.target_fullname == "user_account.id"
        for fk in column.foreign_keys
    )


@pytest.mark.parametrize("password", [None, 123, [], {}, ""])
def test_user_check_password_rejects_invalid_input(password):
    user = User(email="admin@example.com")
    user.set_password("StrongPassword123!")

    assert user.check_password(password) is False
