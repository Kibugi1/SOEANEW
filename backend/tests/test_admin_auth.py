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

def test_expired_access_token_is_rejected(app, auth_client):
    with app.app_context():
        create_user()

    token = login(auth_client).get_json()["data"]["access_token"]
    app.config["ADMIN_ACCESS_TOKEN_MAX_AGE"] = -1

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_tampered_access_token_is_rejected(app, auth_client):
    with app.app_context():
        create_user()

    token = login(auth_client).get_json()["data"]["access_token"]
    # Change the signature (always the last segment; the payload may be compressed
    # and then begins with an empty segment).
    parts = token.split(".")
    parts[-1] = ("A" if parts[-1][0] != "A" else "B") + parts[-1][1:]
    tampered_token = ".".join(parts)

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )

    assert response.status_code == 401


def test_malformed_access_token_is_rejected(auth_client):
    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert response.status_code == 401


def test_access_token_with_invalid_claims_is_rejected(app, auth_client):
    from itsdangerous import URLSafeTimedSerializer

    with app.app_context():
        create_user()

        serializer = URLSafeTimedSerializer(
            app.config["SECRET_KEY"],
            salt="soea-admin-access-v1",
        )
        invalid_token = serializer.dumps({
            "user_id": "00000000-0000-0000-0000-000000000001",
            "token_version": True,
        })

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {invalid_token}"},
    )

    assert response.status_code == 401



def test_invalid_login_error_includes_request_id(app, auth_client):
    request_id = "auth-error-test-123"

    response = auth_client.post(
        "/api/v1/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "WrongPassword123!",
        },
        headers={"X-Request-ID": request_id},
    )

    assert response.status_code == 401
    assert response.headers["X-Request-ID"] == request_id
    assert response.get_json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert response.get_json()["error"]["request_id"] == request_id
