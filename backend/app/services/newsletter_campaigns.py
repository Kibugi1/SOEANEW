
"""Newsletter campaign delivery and retry orchestration."""

from datetime import datetime, timedelta, timezone

from flask import current_app
from sqlalchemy import select

from app.extensions import db
from app.models import (
    AuditEvent,
    NewsletterCampaign,
    NewsletterDelivery,
    Subscriber,
)
from app.services.auth_tokens import generate_newsletter_token
from app.services.newsletter_email import send_newsletter_campaign_email


SENDING_STALE_AFTER = timedelta(minutes=15)


def _as_utc(value):
    """Normalize database datetimes to timezone-aware UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def send_campaign(campaign_id, actor_user_id):
    """Send or retry a campaign to currently active subscribers.

    Successful deliveries are never resent. Failed and pending deliveries
    are eligible for retry while their subscribers remain active.

    A campaign left in 'sending' can be retried after its heartbeat becomes
    older than SENDING_STALE_AFTER.
    """
    now = datetime.now(timezone.utc)

    campaign = db.session.execute(
        select(NewsletterCampaign)
        .where(NewsletterCampaign.id == campaign_id)
        .with_for_update()
    ).scalar_one_or_none()

    if campaign is None:
        raise ValueError("Newsletter campaign not found.")

    if campaign.status == "sent":
        raise ValueError(
            "Cannot send a campaign that has already been sent."
        )

    if campaign.status == "sending":
        heartbeat = campaign.sending_heartbeat_at

        if (
            heartbeat is not None
            and now - _as_utc(heartbeat) <= SENDING_STALE_AFTER
        ):
            raise ValueError(
                "This campaign is already being sent. Try again later."
            )

        current_app.logger.warning(
            "Recovering stale newsletter campaign %s",
            campaign.id,
        )

    campaign.status = "sending"
    campaign.sending_started_at = now
    campaign.sending_heartbeat_at = now

    active_subscribers = db.session.execute(
        select(Subscriber).where(Subscriber.status == "active")
    ).scalars().all()

    existing_deliveries = {
        delivery.subscriber_id: delivery
        for delivery in db.session.execute(
            select(NewsletterDelivery).where(
                NewsletterDelivery.campaign_id == campaign.id
            )
        ).scalars().all()
    }

    for subscriber in active_subscribers:
        if subscriber.id not in existing_deliveries:
            db.session.add(NewsletterDelivery(
                campaign_id=campaign.id,
                subscriber_id=subscriber.id,
                status="pending",
            ))

    db.session.commit()

    delivery_ids = db.session.execute(
        select(NewsletterDelivery.id)
        .join(
            Subscriber,
            Subscriber.id == NewsletterDelivery.subscriber_id,
        )
        .where(
            NewsletterDelivery.campaign_id == campaign.id,
            NewsletterDelivery.status.in_(("pending", "failed")),
            Subscriber.status == "active",
        )
    ).scalars().all()

    attempted = 0
    sent = 0
    failed = 0
    skipped = 0

    for delivery_id in delivery_ids:
        delivery = db.session.get(NewsletterDelivery, delivery_id)
        if delivery is None:
            continue

        subscriber = db.session.get(Subscriber, delivery.subscriber_id)

        # Recheck consent immediately before sending.
        if subscriber is None or subscriber.status != "active":
            skipped += 1
            continue

        # Persist progress before the external SMTP operation.
        campaign = db.session.get(NewsletterCampaign, campaign_id)
        campaign.sending_heartbeat_at = datetime.now(timezone.utc)
        db.session.commit()

        attempted += 1
        token = generate_newsletter_token(
            subscriber.email,
            "unsubscribe",
            subscriber.token_nonce,
        )

        try:
            send_newsletter_campaign_email(
                email=subscriber.email,
                subject=campaign.subject,
                body_text=campaign.body_text,
                body_html=campaign.body_html,
                unsubscribe_token=token,
            )

            delivery.status = "sent"
            delivery.sent_at = datetime.now(timezone.utc)
            delivery.error_message = None

            campaign = db.session.get(
                NewsletterCampaign,
                campaign_id,
            )
            campaign.sending_heartbeat_at = datetime.now(timezone.utc)

            db.session.commit()
            sent += 1

        except Exception:
            db.session.rollback()

            current_app.logger.exception(
                "Newsletter delivery failed for delivery %s",
                delivery_id,
            )

            delivery = db.session.get(
                NewsletterDelivery,
                delivery_id,
            )
            campaign = db.session.get(
                NewsletterCampaign,
                campaign_id,
            )

            if delivery is not None:
                delivery.status = "failed"
                delivery.error_message = (
                    "Delivery attempt failed. "
                    "Consult application logs for details."
                )

            if campaign is not None:
                campaign.sending_heartbeat_at = datetime.now(timezone.utc)

            db.session.commit()
            failed += 1

    # Only active subscribers' outstanding deliveries count against
    # campaign completion. Unsubscribed recipients must not be retried.
    outstanding = db.session.execute(
        select(NewsletterDelivery.id)
        .join(
            Subscriber,
            Subscriber.id == NewsletterDelivery.subscriber_id,
        )
        .where(
            NewsletterDelivery.campaign_id == campaign_id,
            NewsletterDelivery.status.in_(("pending", "failed")),
            Subscriber.status == "active",
        )
    ).scalars().all()

    campaign = db.session.get(NewsletterCampaign, campaign_id)

    if outstanding:
        campaign.status = "failed"
        campaign.sent_at = None
    else:
        campaign.status = "sent"
        campaign.sent_at = datetime.now(timezone.utc)

    campaign.sending_heartbeat_at = datetime.now(timezone.utc)

    db.session.add(AuditEvent(
        actor_user_id=actor_user_id,
        action=(
            "newsletter.campaign_sent"
            if campaign.status == "sent"
            else "newsletter.campaign_failed"
        ),
        target_type="newsletter_campaign",
        target_id=str(campaign.id),
        details={
            "attempted": attempted,
            "sent": sent,
            "failed": failed,
            "skipped": skipped,
            "status": campaign.status,
        },
    ))
    db.session.commit()

    return {
        "campaign_id": str(campaign.id),
        "status": campaign.status,
        "attempted": attempted,
        "sent": sent,
        "failed": failed,
        "skipped": skipped,
        "outstanding": len(outstanding),
    }
