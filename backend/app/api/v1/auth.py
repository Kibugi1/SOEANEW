"""Administrative authentication endpoints."""

from datetime import datetime, timezone

from flask import current_app, g, request
from sqlalchemy import select

from app.api.decorators import admin_required
from app.api.helpers import item_response
from app.extensions import db, limiter
from app.errors import error_response
from app.models import AuditEvent, User
from app.schemas.admin_auth import AdminLoginSchema
from app.services.admin_auth import generate_admin_access_token

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
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
        },
    })


@api_v1.get("/auth/me")
@admin_required
def admin_me():
    user = g.current_user

    return item_response({
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
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
