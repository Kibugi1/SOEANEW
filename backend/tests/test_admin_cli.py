import pytest

from app.extensions import db
from app.models import AuditEvent, User, UserRole


@pytest.fixture()
def cli_runner(app):
    with app.app_context():
        db.create_all()
        yield app.test_cli_runner()
        db.session.remove()
        db.drop_all()


def test_create_admin_success_creates_account_and_audit_event(
    app, cli_runner
):
    result = cli_runner.invoke(
        args=["create-admin"],
        input=(
            "admin@example.com\n"
            "admin\n"
            "StrongPassword123!\n"
            "StrongPassword123!\n"
            "y\n"
        ),
    )

    assert result.exit_code == 0, result.output
    assert "Successfully created admin account" in result.output

    with app.app_context():
        user = db.session.query(User).filter_by(
            email="admin@example.com"
        ).one()

        assert user.role == UserRole.ADMIN
        assert user.is_active is True
        assert user.check_password("StrongPassword123!")
        assert user.password_hash != "StrongPassword123!"

        event = db.session.query(AuditEvent).filter_by(
            action="admin.account_created"
        ).one()

        assert event.actor_user_id is None
        assert event.target_type == "user"
        assert event.target_id == str(user.id)
        assert event.details["role"] == UserRole.ADMIN


def test_create_admin_can_create_editor(app, cli_runner):
    result = cli_runner.invoke(
        args=["create-admin"],
        input=(
            "editor@example.com\n"
            "editor\n"
            "StrongPassword123!\n"
            "StrongPassword123!\n"
            "y\n"
        ),
    )

    assert result.exit_code == 0, result.output

    with app.app_context():
        user = db.session.query(User).filter_by(
            email="editor@example.com"
        ).one()

        assert user.role == UserRole.EDITOR


def test_create_admin_cancellation_does_not_create_account(
    app, cli_runner
):
    result = cli_runner.invoke(
        args=["create-admin"],
        input=(
            "cancel@example.com\n"
            "admin\n"
            "StrongPassword123!\n"
            "StrongPassword123!\n"
            "n\n"
        ),
    )

    assert result.exit_code == 0, result.output
    assert "Account creation cancelled." in result.output

    with app.app_context():
        user = db.session.query(User).filter_by(
            email="cancel@example.com"
        ).first()

        assert user is None


def test_create_admin_rejects_duplicate_email(app, cli_runner):
    with app.app_context():
        user = User(
            email="existing@example.com",
            role=UserRole.ADMIN,
        )
        user.set_password("ExistingPassword123!")
        db.session.add(user)
        db.session.commit()

    result = cli_runner.invoke(
        args=["create-admin"],
        input="existing@example.com\n",
    )

    assert result.exit_code != 0
    assert "already exists" in result.output

    with app.app_context():
        users = db.session.query(User).filter_by(
            email="existing@example.com"
        ).all()

        assert len(users) == 1


def test_create_admin_rejects_short_password(app, cli_runner):
    result = cli_runner.invoke(
        args=["create-admin"],
        input=(
            "short@example.com\n"
            "admin\n"
            "short\n"
            "short\n"
        ),
    )

    assert result.exit_code != 0
    assert "between 12 and 256 characters" in result.output

    with app.app_context():
        user = db.session.query(User).filter_by(
            email="short@example.com"
        ).first()

        assert user is None


def test_create_admin_rejects_invalid_email(cli_runner):
    result = cli_runner.invoke(
        args=["create-admin"],
        input="not-an-email\n",
    )

    assert result.exit_code != 0
    assert "Enter a valid email address." in result.output


def test_create_admin_rejects_password_over_256_characters(
    app, cli_runner
):
    long_password = "A" * 257

    result = cli_runner.invoke(
        args=["create-admin"],
        input=(
            "longpassword@example.com\n"
            "admin\n"
            f"{long_password}\n"
            f"{long_password}\n"
        ),
    )

    assert result.exit_code != 0
    assert "between 12 and 256 characters" in result.output

    with app.app_context():
        user = db.session.query(User).filter_by(
            email="longpassword@example.com"
        ).first()

        assert user is None
