"""Signed, short-lived tokens for administrative API access.

An access token lives ADMIN_ACCESS_TOKEN_MAX_AGE seconds (15 minutes). The dashboard
renews it through /auth/refresh while the person is active, but never beyond
ADMIN_SESSION_MAX_AGE (12 hours) after the original sign-in, so a stolen token
cannot be kept alive indefinitely. Logging out or a role change revokes everything.
"""

import time

from flask import current_app
from itsdangerous import URLSafeTimedSerializer


ADMIN_TOKEN_SALT = "soea-admin-access-v1"


def _serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"],
        salt=ADMIN_TOKEN_SALT,
    )


def generate_admin_access_token(user, session_started_at: int | None = None) -> str:
    """Create a token tied to the user's current token version and sign-in time."""
    return _serializer().dumps({
        "user_id": str(user.id),
        "token_version": user.token_version,
        "session_started_at": int(session_started_at or time.time()),
    })


def session_expired(claims: dict) -> bool:
    started = claims.get("session_started_at")
    if type(started) is not int:
        return True  # tokens from before refresh existed cannot be renewed
    limit = current_app.config.get("ADMIN_SESSION_MAX_AGE", 12 * 60 * 60)
    return time.time() - started > limit


def verify_admin_access_token(token: str) -> dict:
    """Verify signature, expiry and required token claims."""
    max_age = current_app.config.get(
        "ADMIN_ACCESS_TOKEN_MAX_AGE", 900
    )
    claims = _serializer().loads(token, max_age=max_age)

    if not isinstance(claims, dict):
        raise ValueError("Invalid access token.")

    user_id = claims.get("user_id")
    token_version = claims.get("token_version")

    if not isinstance(user_id, str) or not user_id:
        raise ValueError("Invalid access token.")

    if type(token_version) is not int or token_version < 1:
        raise ValueError("Invalid access token.")

    return claims
