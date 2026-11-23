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


def test_create_admin_with_name_and_linked_profile(app, cli_runner):
    from app.models import TeamProfile

    with app.app_context():
        db.session.add(TeamProfile(slug="brian-kibugi", display_name="Brian Kibugi",
                                   role_title="ICT Volunteer", role_type="volunteer", status="published"))
        db.session.commit()

    result = cli_runner.invoke(
        args=["create-admin", "--profile", "brian-kibugi"],
        input="brian@example.com\nauthor\nStrongPassword123!\nStrongPassword123!\ny\n",
    )
    assert result.exit_code == 0, result.output
    assert "Linked to profile: Brian Kibugi (brian-kibugi)" in result.output

    with app.app_context():
        user = db.session.query(User).filter_by(email="brian@example.com").one()
        assert user.role == UserRole.AUTHOR
        assert user.full_name == "Brian Kibugi"  # taken from the profile when --name is omitted
        assert user.team_profile.slug == "brian-kibugi"

    again = cli_runner.invoke(
        args=["create-admin", "--profile", "brian-kibugi"],
        input="other@example.com\nauthor\nStrongPassword123!\nStrongPassword123!\ny\n",
    )
    assert again.exit_code != 0
    assert "already linked" in again.output


def test_create_admin_rejects_unknown_profile(cli_runner):
    result = cli_runner.invoke(args=["create-admin", "--profile", "nobody"], input="")
    assert result.exit_code != 0
    assert "No team profile" in result.output


@pytest.mark.parametrize("password, message", [
    ("Strong\tPassword123!", "invisible character"),
    (" StrongPassword123!", "space"),
    ("StrongPassword123! ", "space"),
])
def test_create_admin_rejects_passwords_that_cannot_be_typed_back(cli_runner, password, message):
    result = cli_runner.invoke(
        args=["create-admin"],
        input=f"paste@example.com\nadmin\n{password}\n{password}\ny\n",
    )
    assert result.exit_code != 0
    assert message in result.output
    assert db.session.query(User).filter_by(email="paste@example.com").count() == 0


def test_set_password_resets_and_signs_out(app, cli_runner):
    with app.app_context():
        user = User(email="reset@example.com", role=UserRole.ADMIN)
        user.set_password("OldPassword12345!")
        db.session.add(user)
        db.session.commit()
        version = user.token_version

    result = cli_runner.invoke(
        args=["set-password", "RESET@example.com"],
        input="NewPassword12345!\nNewPassword12345!\n",
    )
    assert result.exit_code == 0, result.output
    with app.app_context():
        user = db.session.query(User).filter_by(email="reset@example.com").one()
        assert user.check_password("NewPassword12345!")
        assert user.token_version == version + 1

    missing = cli_runner.invoke(args=["set-password", "nobody@example.com"], input="")
    assert missing.exit_code != 0
