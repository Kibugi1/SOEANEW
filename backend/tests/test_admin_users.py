import pytest

from app.extensions import db
from app.models import AuditEvent, User, UserRole

from admin_helpers import PASSWORD, auth, make_profile, make_user, token_for

NEW_PASSWORD = "AnotherStrongPass456!"


@pytest.fixture()
def admin_client(app):
    with app.app_context():
        db.create_all()
        make_user("rozalia@example.org", UserRole.ADMIN)
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def admin_token(admin_client):
    return token_for(admin_client, "rozalia@example.org")


def create_payload(**overrides):
    payload = {
        "email": "Stephanie@Example.org",
        "full_name": "Stephanie Ndiritu",
        "role": "author",
        "temporary_password": "TemporaryPass123!",
    }
    payload.update(overrides)
    return payload


# --- Creating accounts ---------------------------------------------------------------

def test_admin_creates_author_linked_to_profile(admin_client, admin_token):
    make_profile("stephanie-ndiritu", "Stephanie Ndiritu")

    response = admin_client.post(
        "/api/v1/admin/users",
        json=create_payload(team_profile_slug="stephanie-ndiritu"),
        headers=auth(admin_token),
    )

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["email"] == "stephanie@example.org"
    assert data["role"] == "author"
    assert data["must_change_password"] is True
    assert data["team_profile"]["slug"] == "stephanie-ndiritu"
    assert "password_hash" not in data and "temporary_password" not in data
    assert db.session.query(AuditEvent).filter_by(action="admin.account_created").count() == 1


def test_create_rejects_duplicate_email(admin_client, admin_token):
    response = admin_client.post(
        "/api/v1/admin/users",
        json=create_payload(email="ROZALIA@example.org"),
        headers=auth(admin_token),
    )
    assert response.status_code == 409


def test_create_rejects_unknown_profile_and_profile_already_linked(admin_client, admin_token):
    unknown = admin_client.post(
        "/api/v1/admin/users",
        json=create_payload(team_profile_slug="nobody"),
        headers=auth(admin_token),
    )
    assert unknown.status_code == 400
    assert "team_profile_slug" in unknown.get_json()["error"]["details"]

    profile = make_profile("chika-atueyi")
    make_user("chika@example.org", UserRole.AUTHOR, profile=profile)
    taken = admin_client.post(
        "/api/v1/admin/users",
        json=create_payload(team_profile_slug="chika-atueyi"),
        headers=auth(admin_token),
    )
    assert taken.status_code == 409


@pytest.mark.parametrize("overrides, field", [
    ({"role": "superuser"}, "role"),
    ({"temporary_password": "short"}, "temporary_password"),
    ({"email": "not-an-email"}, "email"),
    ({"full_name": ""}, "full_name"),
])
def test_create_validates_fields(admin_client, admin_token, overrides, field):
    response = admin_client.post(
        "/api/v1/admin/users", json=create_payload(**overrides), headers=auth(admin_token)
    )
    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]


@pytest.mark.parametrize("role", [UserRole.EDITOR, UserRole.AUTHOR])
def test_only_admins_manage_accounts(admin_client, role):
    make_user("staff@example.org", role)
    token = token_for(admin_client, "staff@example.org")

    assert admin_client.get("/api/v1/admin/users", headers=auth(token)).status_code == 403
    assert admin_client.post(
        "/api/v1/admin/users", json=create_payload(), headers=auth(token)
    ).status_code == 403


def test_account_endpoints_require_login(admin_client):
    assert admin_client.get("/api/v1/admin/users").status_code == 401


# --- First login and password changes --------------------------------------------------

def test_temporary_password_must_be_changed_before_anything_else(admin_client, admin_token):
    admin_client.post("/api/v1/admin/users", json=create_payload(), headers=auth(admin_token))
    token = token_for(admin_client, "stephanie@example.org", "TemporaryPass123!")

    me = admin_client.get("/api/v1/auth/me", headers=auth(token))
    assert me.status_code == 200
    assert me.get_json()["data"]["must_change_password"] is True

    blocked = admin_client.get("/api/v1/admin/dashboard", headers=auth(token))
    assert blocked.status_code == 403
    assert blocked.get_json()["error"]["code"] == "PASSWORD_CHANGE_REQUIRED"

    changed = admin_client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "TemporaryPass123!", "new_password": NEW_PASSWORD},
        headers=auth(token),
    )
    assert changed.status_code == 200
    new_token = changed.get_json()["data"]["access_token"]
    assert changed.get_json()["data"]["user"]["must_change_password"] is False

    # The old token is revoked; the new one works everywhere.
    assert admin_client.get("/api/v1/auth/me", headers=auth(token)).status_code == 401
    assert admin_client.get("/api/v1/admin/dashboard", headers=auth(new_token)).status_code == 200


def test_change_password_checks_current_password(admin_client, admin_token):
    wrong = admin_client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "WrongPassword123!", "new_password": NEW_PASSWORD},
        headers=auth(admin_token),
    )
    assert wrong.status_code == 400
    assert "current_password" in wrong.get_json()["error"]["details"]

    same = admin_client.post(
        "/api/v1/auth/change-password",
        json={"current_password": PASSWORD, "new_password": PASSWORD},
        headers=auth(admin_token),
    )
    assert same.status_code == 400
    assert "new_password" in same.get_json()["error"]["details"]


def test_reset_password_forces_change_and_signs_out(admin_client, admin_token):
    user = make_user("nahshon@example.org", UserRole.EDITOR)
    old_token = token_for(admin_client, "nahshon@example.org")

    response = admin_client.post(
        f"/api/v1/admin/users/{user.id}/reset-password",
        json={"temporary_password": "ResetTemporary123!"},
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["must_change_password"] is True
    assert admin_client.get("/api/v1/auth/me", headers=auth(old_token)).status_code == 401
    token_for(admin_client, "nahshon@example.org", "ResetTemporary123!")


# --- Updating accounts -----------------------------------------------------------------

def test_role_change_and_deactivation_take_effect_immediately(admin_client, admin_token):
    user = make_user("editor@example.org", UserRole.EDITOR)
    editor_token = token_for(admin_client, "editor@example.org")

    response = admin_client.patch(
        f"/api/v1/admin/users/{user.id}", json={"role": "author"}, headers=auth(admin_token)
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["role"] == "author"
    assert admin_client.get("/api/v1/auth/me", headers=auth(editor_token)).status_code == 401

    admin_client.patch(
        f"/api/v1/admin/users/{user.id}", json={"is_active": False}, headers=auth(admin_token)
    )
    login = admin_client.post(
        "/api/v1/auth/login", json={"email": "editor@example.org", "password": PASSWORD}
    )
    assert login.status_code == 401


def test_link_and_unlink_profile(admin_client, admin_token):
    user = make_user("wairimu@example.org", UserRole.AUTHOR)
    make_profile("wairimu-maina")

    linked = admin_client.patch(
        f"/api/v1/admin/users/{user.id}",
        json={"team_profile_slug": "wairimu-maina"},
        headers=auth(admin_token),
    )
    assert linked.get_json()["data"]["team_profile"]["slug"] == "wairimu-maina"

    unlinked = admin_client.patch(
        f"/api/v1/admin/users/{user.id}", json={"team_profile_slug": None}, headers=auth(admin_token)
    )
    assert unlinked.get_json()["data"]["team_profile"] is None


def test_cannot_remove_last_admin_or_demote_self(admin_client, admin_token):
    me = db.session.query(User).filter_by(email="rozalia@example.org").one()

    for payload in ({"role": "editor"}, {"is_active": False}):
        response = admin_client.patch(
            f"/api/v1/admin/users/{me.id}", json=payload, headers=auth(admin_token)
        )
        assert response.status_code == 409

    # With a second admin, one admin may demote the other but still not themselves.
    other = make_user("second-admin@example.org", UserRole.ADMIN)
    assert admin_client.patch(
        f"/api/v1/admin/users/{other.id}", json={"role": "editor"}, headers=auth(admin_token)
    ).status_code == 200
    assert admin_client.patch(
        f"/api/v1/admin/users/{me.id}", json={"role": "editor"}, headers=auth(admin_token)
    ).status_code == 409


def test_update_requires_a_field_and_unknown_user_is_404(admin_client, admin_token):
    me = db.session.query(User).filter_by(email="rozalia@example.org").one()
    assert admin_client.patch(
        f"/api/v1/admin/users/{me.id}", json={}, headers=auth(admin_token)
    ).status_code == 400
    assert admin_client.get(
        "/api/v1/admin/users/not-a-uuid", headers=auth(admin_token)
    ).status_code == 404


def test_list_users_and_profile_options(admin_client, admin_token):
    make_profile("draft-person", status="draft")
    users = admin_client.get("/api/v1/admin/users", headers=auth(admin_token))
    assert users.status_code == 200
    assert users.get_json()["meta"]["pagination"]["total"] == 1

    options = admin_client.get("/api/v1/admin/team-profiles", headers=auth(admin_token))
    assert [p["slug"] for p in options.get_json()["data"]] == ["draft-person"]


def test_login_and_me_return_profile_and_name(admin_client):
    profile = make_profile("chika-atueyi", "Chika Atueyi")
    make_user("c.atueyi@example.org", UserRole.AUTHOR, profile=profile, name="Chika Atueyi")

    login = admin_client.post(
        "/api/v1/auth/login", json={"email": "c.atueyi@example.org", "password": PASSWORD}
    )
    user = login.get_json()["data"]["user"]
    assert user["full_name"] == "Chika Atueyi"
    assert user["team_profile"]["slug"] == "chika-atueyi"


# --- Session refresh -----------------------------------------------------------------------------

def test_refresh_issues_new_token_within_session_limit(admin_client, admin_token, app, monkeypatch):
    response = admin_client.post("/api/v1/auth/refresh", headers=auth(admin_token))
    assert response.status_code == 200
    new_token = response.get_json()["data"]["access_token"]
    assert admin_client.get("/api/v1/auth/me", headers=auth(new_token)).status_code == 200

    # After the 12-hour session limit, refresh refuses and the person signs in again.
    import time
    real_time = time.time
    monkeypatch.setattr("app.services.admin_auth.time.time", lambda: real_time() + 13 * 60 * 60)
    app.config["ADMIN_ACCESS_TOKEN_MAX_AGE"] = 14 * 60 * 60  # keep the token itself valid
    expired = admin_client.post("/api/v1/auth/refresh", headers=auth(new_token))
    assert expired.status_code == 401
    assert expired.get_json()["error"]["code"] == "SESSION_EXPIRED"


def test_refresh_requires_a_valid_token_and_respects_logout(admin_client, admin_token):
    assert admin_client.post("/api/v1/auth/refresh").status_code == 401
    admin_client.post("/api/v1/auth/logout", headers=auth(admin_token))
    assert admin_client.post("/api/v1/auth/refresh", headers=auth(admin_token)).status_code == 401


def test_profile_options_show_which_account_is_linked(admin_client, admin_token):
    linked = make_profile("chika-atueyi", "Chika Atueyi")
    make_profile("free-person")
    make_user("chika@example.org", UserRole.AUTHOR, profile=linked, name="Chika Atueyi")

    options = admin_client.get("/api/v1/admin/team-profiles", headers=auth(admin_token)).get_json()["data"]
    by_slug = {p["slug"]: p for p in options}
    assert by_slug["chika-atueyi"]["linked_account"]["email"] == "chika@example.org"
    assert by_slug["free-person"]["linked_account"] is None
