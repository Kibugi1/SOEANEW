"""Newsletter token service tests."""

import pytest
from itsdangerous import BadSignature, SignatureExpired

from app.services.auth_tokens import (
    generate_newsletter_token,
    verify_newsletter_token,
)


def test_newsletter_token_round_trip(app):
    with app.app_context():
        token = generate_newsletter_token("person@example.com", "confirm")

        assert verify_newsletter_token(token, "confirm") == "person@example.com"


def test_confirmation_token_cannot_be_used_for_unsubscribe(app):
    with app.app_context():
        token = generate_newsletter_token("person@example.com", "confirm")

        with pytest.raises(BadSignature):
            verify_newsletter_token(token, "unsubscribe")


def test_newsletter_token_rejects_tampering(app):
    with app.app_context():
        token = generate_newsletter_token("person@example.com", "confirm")
        tampered = ("A" if token[0] != "A" else "B") + token[1:]

        with pytest.raises(BadSignature):
            verify_newsletter_token(tampered, "confirm")


def test_newsletter_token_rejects_expired_token(app):
    with app.app_context():
        token = generate_newsletter_token("person@example.com", "confirm")

        with pytest.raises(SignatureExpired):
            verify_newsletter_token(token, "confirm", max_age=-1)


def test_newsletter_token_rejects_unknown_purpose(app):
    with app.app_context():
        with pytest.raises(ValueError, match="Unsupported"):
            generate_newsletter_token("person@example.com", "admin")
