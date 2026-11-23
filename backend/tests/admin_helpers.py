"""Shared helpers for admin API tests."""

from app.extensions import db
from app.models import TeamProfile, User, UserRole

PASSWORD = "StrongPassword123!"


def make_user(email, role=UserRole.ADMIN, active=True, must_change=False, profile=None, name=None):
    user = User(
        email=email,
        role=role,
        is_active=active,
        must_change_password=must_change,
        full_name=name or email.split("@")[0].title(),
    )
    user.set_password(PASSWORD)
    if profile is not None:
        user.team_profile_id = profile.id
    db.session.add(user)
    db.session.commit()
    return user


def make_profile(slug, name=None, status="published"):
    profile = TeamProfile(
        slug=slug,
        display_name=name or slug.replace("-", " ").title(),
        role_title="Volunteer",
        role_type="volunteer",
        status=status,
    )
    db.session.add(profile)
    db.session.commit()
    return profile


def token_for(client, email, password=PASSWORD):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.get_json()
    return response.get_json()["data"]["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def drop_everything():
    """Drop all tables in tests, even with self-referencing rows (program/place trees).

    SQLite empties a table while dropping it, so RESTRICT links between rows of the same
    table (JEET -> CECI, Dandora -> Nairobi) would block the drop.
    """
    from sqlalchemy import text

    db.session.rollback()
    db.session.remove()
    with db.engine.connect() as connection:
        connection.execute(text("PRAGMA foreign_keys=OFF"))
        db.metadata.drop_all(bind=connection)
        connection.commit()
