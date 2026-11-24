"""Administrative authentication endpoints."""

from datetime import datetime, timezone

from flask import current_app, g, request
from sqlalchemy import select

from app.api.decorators import admin_required
from app.api.helpers import item_response
from app.extensions import db, limiter
from app.errors import error_response
from app.models import AuditEvent, User
from app.schemas.admin import PasswordChangeSchema
from app.schemas.admin_auth import AdminLoginSchema
from app.services.admin_auth import generate_admin_access_token, session_expired

from . import api_v1


@api_v1.post("/auth/login")
@limiter.limit("5 per minute")
def admin_login():
    data = AdminLoginSchema().load(request.get_json(silent=True) or {})
    email = data["email"].strip().lower()

    user = db.session.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if user is None or not user.check_password(data["password"]) or not user.is_active:
        return error_response(
            401,
            "INVALID_CREDENTIALS",
            "The email or password is incorrect.",
        )

    user.last_login_at = datetime.now(timezone.utc)

    db.session.add(AuditEvent(
        actor_user_id=user.id,
        action="admin.login",
        target_type="user",
        target_id=str(user.id),
        details={"role": user.role},
    ))

    token = generate_admin_access_token(user)
    db.session.commit()

    return item_response({
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": current_app.config["ADMIN_ACCESS_TOKEN_MAX_AGE"],
        "user": _user_payload(user),
    })


def _user_payload(user):
    profile = user.team_profile
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "must_change_password": user.must_change_password,
        "team_profile": (
            {"id": str(profile.id), "slug": profile.slug, "display_name": profile.display_name}
            if profile is not None else None
        ),
    }


@api_v1.get("/auth/me")
@admin_required
def admin_me():
    return item_response(_user_payload(g.current_user))


@api_v1.post("/auth/refresh")
@admin_required
@limiter.limit("30 per minute")
def admin_refresh():
    """Swap a still-valid token for a fresh one, within the session's 12-hour limit."""
    claims = g.token_claims
    if session_expired(claims):
        return error_response(401, "SESSION_EXPIRED", "Your session has ended. Please sign in again.")
    token = generate_admin_access_token(g.current_user, session_started_at=claims["session_started_at"])
    return item_response({
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": current_app.config["ADMIN_ACCESS_TOKEN_MAX_AGE"],
        "user": _user_payload(g.current_user),
    })


@api_v1.post("/auth/change-password")
@admin_required
@limiter.limit("5 per minute")
def admin_change_password():
    data = PasswordChangeSchema().load(request.get_json(silent=True) or {})
    user = g.current_user

    if not user.check_password(data["current_password"]):
        return error_response(
            400,
            "VALIDATION_ERROR",
            "Please correct the highlighted fields.",
            {"current_password": ["The current password is incorrect."]},
        )
    if data["new_password"] == data["current_password"]:
        return error_response(
            400,
            "VALIDATION_ERROR",
            "Please correct the highlighted fields.",
            {"new_password": ["Choose a password different from the current one."]},
        )

    user.set_password(data["new_password"])
    user.must_change_password = False
    # Sign out every other session, then hand this one a fresh token.
    user.token_version += 1

    db.session.add(AuditEvent(
        actor_user_id=user.id,
        action="admin.password_changed",
        target_type="user",
        target_id=str(user.id),
        details={},
    ))
    token = generate_admin_access_token(user)
    db.session.commit()

    return item_response({
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": current_app.config["ADMIN_ACCESS_TOKEN_MAX_AGE"],
        "user": _user_payload(user),
    })


@api_v1.post("/auth/logout")
@admin_required
def admin_logout():
    user = g.current_user

    db.session.add(AuditEvent(
        actor_user_id=user.id,
        action="admin.logout",
        target_type="user",
        target_id=str(user.id),
        details={},
    ))

    # Invalidates every previously issued access token for this account.
    user.token_version += 1
    db.session.commit()

    return item_response({
        "message": "You have been logged out."
    })
