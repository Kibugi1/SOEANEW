"""Secure command-line provisioning for administrative accounts."""

import click
from flask.cli import with_appcontext
from marshmallow import ValidationError, validate
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import AuditEvent, User, UserRole


@click.command("create-admin")
@with_appcontext
def create_admin_command():
    """Interactively create an administrator or editor account."""
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

    if not isinstance(password, str) or not 12 <= len(password) <= 256:
        raise click.ClickException(
            "Password must contain between 12 and 256 characters."
        )

    if not click.confirm(
        f"Create {role} account for {email}?",
        default=False,
    ):
        click.echo("Account creation cancelled.")
        return

    user = User(email=email, role=role)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.flush()

        db.session.add(AuditEvent(
            actor_user_id=None,
            action="admin.account_created",
            target_type="user",
            target_id=str(user.id),
            details={"role": role},
        ))

        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise click.ClickException(
            "Account creation failed. The email may already be registered."
        ) from None

    click.echo(f"Successfully created {role} account: {email}")
