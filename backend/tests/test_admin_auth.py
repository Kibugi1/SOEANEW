import pytest

from app.api.decorators import roles_required
from app.extensions import db
from app.models import AuditEvent, User, UserRole


@pytest.fixture()
def auth_client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def create_user(email="editor@example.com", role=UserRole.EDITOR, active=True):
    user = User(
        email=email,
        role=role,
        is_active=active,
    )
    user.set_password("StrongPassword123!")
    db.session.add(user)
    db.session.commit()
    return user


def login(client, email="editor@example.com"):
    return client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "StrongPassword123!",
        },
    )


def test_admin_login_returns_access_token(app, auth_client):
    with app.app_context():
        create_user()

    response = login(auth_client)

    assert response.status_code == 200
    payload = response.get_json()["data"]
    assert payload["token_type"] == "Bearer"
    assert payload["expires_in"] == 900
    assert payload["user"]["role"] == UserRole.EDITOR
    assert payload["access_token"]


def test_login_rejects_wrong_password(app, auth_client):
    with app.app_context():
        create_user()

    response = auth_client.post(
        "/api/v1/auth/login",
        json={
            "email": "editor@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_rejects_inactive_account(app, auth_client):
    with app.app_context():
        create_user(active=False)

    response = login(auth_client)

    assert response.status_code == 401


def test_me_requires_authentication(auth_client):
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_authenticated_user(app, auth_client):
    with app.app_context():
        create_user()

    token = login(auth_client).get_json()["data"]["access_token"]

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["email"] == "editor@example.com"


def test_logout_revokes_existing_access_token(app, auth_client):
    with app.app_context():
        create_user()

    token = login(auth_client).get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_response = auth_client.post(
        "/api/v1/auth/logout",
        headers=headers,
    )
    assert logout_response.status_code == 200

    me_response = auth_client.get(
        "/api/v1/auth/me",
        headers=headers,
    )
    assert me_response.status_code == 401


def test_inactive_account_cannot_use_existing_token(app, auth_client):
    with app.app_context():
        user = create_user()
        user_id = user.id

    token = login(auth_client).get_json()["data"]["access_token"]

    with app.app_context():
        user = db.session.get(User, user_id)
        user.is_active = False
        db.session.commit()

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_editor_cannot_access_admin_only_route(app, auth_client):
    with app.app_context():
        create_user(role=UserRole.EDITOR)

    protected_view = roles_required(UserRole.ADMIN)(
        lambda: {"data": "admin only"}
    )
    app.add_url_rule(
        "/api/v1/test-admin-only",
        view_func=protected_view,
    )

    token = login(auth_client).get_json()["data"]["access_token"]

    response = auth_client.get(
        "/api/v1/test-admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_successful_login_is_audited(app, auth_client):
    with app.app_context():
        create_user()

    response = login(auth_client)
    assert response.status_code == 200

    with app.app_context():
        event = db.session.query(AuditEvent).filter_by(
            action="admin.login"
        ).one()
        assert event.target_type == "user"
        assert event.details["role"] == UserRole.EDITOR
