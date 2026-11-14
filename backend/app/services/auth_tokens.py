"""Secure, purpose-specific tokens for newsletter actions."""

from flask import current_app
from itsdangerous import URLSafeTimedSerializer


NEWSLETTER_TOKEN_PURPOSES = {
    "confirm": "soea-newsletter-confirm",
    "unsubscribe": "soea-newsletter-unsubscribe",
}


def _serializer(purpose: str) -> URLSafeTimedSerializer:
    salt = NEWSLETTER_TOKEN_PURPOSES.get(purpose)
    if salt is None:
        raise ValueError("Unsupported newsletter token purpose.")

    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"],
        salt=salt,
    )


def generate_newsletter_token(
    email: str,
    purpose: str,
    nonce: str | None = None,
) -> str:
    """Generate a signed token for one newsletter action."""
    if not isinstance(email, str) or not email:
        raise ValueError("A valid email address is required.")

    if nonce is not None and (not isinstance(nonce, str) or not nonce):
        raise ValueError("A valid subscription nonce is required.")

    payload = {"email": email}
    if nonce is not None:
        payload["nonce"] = nonce

    return _serializer(purpose).dumps(payload)


def verify_newsletter_token_claims(
    token: str,
    purpose: str,
    max_age: int | None = None,
) -> dict:
    """Verify a token and return its signed claims."""
    if max_age is None:
        max_age = current_app.config.get(
            "NEWSLETTER_TOKEN_MAX_AGE",
            60 * 60 * 24,
        )

    payload = _serializer(purpose).loads(token, max_age=max_age)

    if not isinstance(payload, dict):
        raise ValueError("Invalid newsletter token payload.")

    email = payload.get("email")
    if not isinstance(email, str) or not email:
        raise ValueError("Invalid newsletter token email.")

    return payload


def verify_newsletter_token(
    token: str,
    purpose: str,
    max_age: int | None = None,
) -> str:
    """Verify a token and return its email address."""
    return verify_newsletter_token_claims(token, purpose, max_age)["email"]
