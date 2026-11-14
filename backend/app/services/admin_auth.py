"""Signed, short-lived tokens for administrative API access."""

from flask import current_app
from itsdangerous import URLSafeTimedSerializer


ADMIN_TOKEN_SALT = "soea-admin-access-v1"


def _serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"],
        salt=ADMIN_TOKEN_SALT,
    )


def generate_admin_access_token(user) -> str:
    """Create a token tied to the user's current token version."""
    return _serializer().dumps({
        "user_id": str(user.id),
        "token_version": user.token_version,
    })


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
