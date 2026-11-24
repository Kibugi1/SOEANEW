"""Secure command-line provisioning for administrative accounts."""

import click
from flask.cli import with_appcontext
from marshmallow import ValidationError, validate
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import AuditEvent, TeamProfile, User, UserRole


def _check_password(password) -> None:
    """Reject passwords that cannot be typed back in at the login screen.

    Pasting into a hidden terminal prompt can add an invisible carriage return or tab,
    which then silently becomes part of the password.
    """
    if not isinstance(password, str) or not 12 <= len(password) <= 256:
        raise click.ClickException("Password must contain between 12 and 256 characters.")
    if any(ord(character) < 32 or ord(character) == 127 for character in password):
        raise click.ClickException(
            "The password contains an invisible character (often from pasting). Type it instead."
        )
    if password != password.strip():
        raise click.ClickException("The password starts or ends with a space. Remove it and try again.")


@click.command("create-admin")
@click.option("--name", "full_name", default=None, help='Display name, e.g. "Rozalia Wangui Karanja".')
@click.option(
    "--profile", "profile_slug", default=None,
    help="Slug of the team profile this person writes as, e.g. brian-kibugi.",
)
@with_appcontext
def create_admin_command(full_name, profile_slug):
    """Interactively create an admin, editor or author account."""
    profile = None
    if profile_slug:
        profile = db.session.execute(
            select(TeamProfile).where(TeamProfile.slug == profile_slug)
        ).scalar_one_or_none()
        if profile is None:
            raise click.ClickException(f"No team profile has the slug {profile_slug!r}.")
        if db.session.execute(select(User.id).where(User.team_profile_id == profile.id)).first():
            raise click.ClickException("That profile is already linked to another account.")

    email = click.prompt("Account email").strip().lower()

    try:
        validate.Email()(email)
    except ValidationError:
        raise click.ClickException("Enter a valid email address.") from None

    if len(email) > 254:
        raise click.ClickException("Email address is too long.")

    existing = db.session.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if existing is not None:
        raise click.ClickException("An account with that email already exists.")

    role = click.prompt(
        "Account role",
        type=click.Choice(UserRole.ALL, case_sensitive=False),
        default=UserRole.ADMIN,
    ).lower()

    password = click.prompt(
        "Password (12–256 characters)",
        hide_input=True,
        confirmation_prompt=True,
    )

    _check_password(password)

    if not click.confirm(
        f"Create {role} account for {email}?",
        default=False,
    ):
        click.echo("Account creation cancelled.")
        return

    user = User(
        email=email,
        role=role,
        full_name=(full_name or "").strip() or (profile.display_name if profile else None),
        team_profile_id=profile.id if profile else None,
    )
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.flush()

        db.session.add(AuditEvent(
            actor_user_id=None,
            action="admin.account_created",
            target_type="user",
            target_id=str(user.id),
            details={"role": role, "linked_profile": profile_slug},
        ))

        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise click.ClickException(
            "Account creation failed. The email may already be registered."
        ) from None

    click.echo(f"Successfully created {role} account: {email}")
    if profile:
        click.echo(f"Linked to profile: {profile.display_name} ({profile.slug})")


@click.command("set-password")
@click.argument("email")
@with_appcontext
def set_password_command(email):
    """Set a new password for an existing account and sign it out everywhere."""
    user = db.session.execute(
        select(User).where(User.email == email.strip().lower())
    ).scalar_one_or_none()
    if user is None:
        raise click.ClickException("No account has that email.")

    password = click.prompt("New password (12–256 characters)", hide_input=True, confirmation_prompt=True)
    _check_password(password)

    user.set_password(password)
    user.must_change_password = False
    user.token_version += 1
    db.session.add(AuditEvent(
        actor_user_id=None,
        action="admin.password_set_cli",
        target_type="user",
        target_id=str(user.id),
        details={},
    ))
    db.session.commit()
    click.echo(f"Password updated for {user.email}.")
