"""Public contact and newsletter endpoints."""

import secrets

from flask import current_app, request
from itsdangerous import BadData, SignatureExpired
from sqlalchemy import select

from app.api.helpers import item_response
from app.extensions import db, limiter
from app.errors import error_response
from app.models import ContactEnquiry, Subscriber
from app.schemas.forms import (
    ContactEnquiryCreateSchema,
    NewsletterSubscriptionCreateSchema,
)
from app.services.auth_tokens import (
    generate_newsletter_token,
    verify_newsletter_token_claims,
)
from app.services.newsletter_email import send_newsletter_confirmation

from . import api_v1

MAX_NEWSLETTER_TOKEN_LENGTH = 4096


@api_v1.post("/contact-enquiries")
@limiter.limit("5 per hour")
def create_contact_enquiry():
    data = ContactEnquiryCreateSchema().load(request.get_json(silent=True) or {})
    data["email"] = data["email"].strip().lower()

    enquiry = ContactEnquiry(**data)
    db.session.add(enquiry)
    db.session.commit()

    return item_response({
        "id": str(enquiry.id),
        "message": "Your enquiry has been received.",
    }), 201


@api_v1.post("/newsletter-subscriptions")
@limiter.limit("5 per hour")
def create_newsletter_subscription():
    data = NewsletterSubscriptionCreateSchema().load(
        request.get_json(silent=True) or {}
    )
    email = data["email"].strip().lower()

    subscriber = db.session.execute(
        select(Subscriber).where(Subscriber.email == email)
    ).scalar_one_or_none()

    if subscriber is not None and subscriber.status == "active":
        return item_response({
            "message": "If the address can be subscribed, a confirmation email will be sent."
        }), 202

    if subscriber is None:
        subscriber = Subscriber(
            email=email,
            status="pending",
            consent_text_version=current_app.config[
                "NEWSLETTER_CONSENT_TEXT_VERSION"
            ],
            token_nonce=secrets.token_urlsafe(32),
        )
        db.session.add(subscriber)
    else:
        subscriber.status = "pending"
        subscriber.consent_text_version = current_app.config[
            "NEWSLETTER_CONSENT_TEXT_VERSION"
        ]
        subscriber.token_nonce = secrets.token_urlsafe(32)

    db.session.commit()

    token = generate_newsletter_token(
        email,
        "confirm",
        subscriber.token_nonce,
    )

    try:
        send_newsletter_confirmation(email, token)
    except Exception:
        current_app.logger.exception(
            "Newsletter confirmation email delivery failed."
        )
        return error_response(
            503,
            "EMAIL_DELIVERY_FAILED",
            "We could not send a confirmation email. Please try again later.",
        )

    return item_response({
        "message": "If the address can be subscribed, a confirmation email will be sent."
    }), 202


@api_v1.post("/newsletter-subscriptions/confirm")
@limiter.limit("10 per hour")
def confirm_newsletter_subscription():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token") if isinstance(payload, dict) else None

    if not isinstance(token, str) or not token or len(token) > MAX_NEWSLETTER_TOKEN_LENGTH:
        return error_response(
            400,
            "INVALID_CONFIRMATION_TOKEN",
            "A valid confirmation token is required.",
        )


    try:
        claims = verify_newsletter_token_claims(token, "confirm")
    except (BadData, SignatureExpired, ValueError):
        return error_response(
            400,
            "INVALID_CONFIRMATION_TOKEN",
            "The confirmation link is invalid or expired.",
        )

    email = claims["email"].strip().lower()
    subscriber = db.session.execute(
        select(Subscriber).where(Subscriber.email == email)
    ).scalar_one_or_none()

    if subscriber is None or claims.get("nonce") != subscriber.token_nonce:
        return error_response(
            400,
            "INVALID_CONFIRMATION_TOKEN",
            "The confirmation link is invalid or expired.",
        )

    if subscriber.status == "unsubscribed":
        return error_response(
            409,
            "SUBSCRIPTION_CANCELLED",
            "This subscription has been cancelled. Please subscribe again.",
        )

    if subscriber.status == "pending":
        subscriber.status = "active"
        db.session.commit()

    return item_response({
        "message": "Your newsletter subscription is confirmed."
    })


@api_v1.post("/newsletter-subscriptions/unsubscribe")
@limiter.limit("10 per hour")
def unsubscribe_newsletter():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token") if isinstance(payload, dict) else None

    if not isinstance(token, str) or not token or len(token) > MAX_NEWSLETTER_TOKEN_LENGTH:
        return error_response(
            400,
            "INVALID_UNSUBSCRIBE_TOKEN",
            "A valid unsubscribe token is required.",
        )


    try:
        claims = verify_newsletter_token_claims(token, "unsubscribe")
    except (BadData, SignatureExpired, ValueError):
        return error_response(
            400,
            "INVALID_UNSUBSCRIBE_TOKEN",
            "The unsubscribe link is invalid or expired.",
        )

    email = claims["email"].strip().lower()
    subscriber = db.session.execute(
        select(Subscriber).where(Subscriber.email == email)
    ).scalar_one_or_none()

    if subscriber is None or claims.get("nonce") != subscriber.token_nonce:
        return error_response(
            400,
            "INVALID_UNSUBSCRIBE_TOKEN",
            "The unsubscribe link is invalid or expired.",
        )

    if subscriber.status != "unsubscribed":
        subscriber.status = "unsubscribed"
        db.session.commit()

    return item_response({
        "message": "Your newsletter subscription has been cancelled."
    })
