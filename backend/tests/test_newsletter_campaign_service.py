import pytest
from datetime import datetime, timedelta, timezone
from app.extensions import db
from app.models import (
    AuditEvent,
    NewsletterCampaign,
    NewsletterDelivery,
    Subscriber,
    User,
)
from app.services import newsletter_campaigns


@pytest.fixture()
def campaign_client(app):
    with app.app_context():
        db.create_all()

        user = User(
            email="admin@example.com",
            role="admin",
        )
        user.set_password("secure-test-password")
        db.session.add(user)

        subscribers = [
            Subscriber(
                email="active@example.com",
                status="active",
                consent_text_version="v1",
            ),
            Subscriber(
                email="pending@example.com",
                status="pending",
                consent_text_version="v1",
            ),
            Subscriber(
                email="unsubscribed@example.com",
                status="unsubscribed",
                consent_text_version="v1",
            ),
        ]

        campaign = NewsletterCampaign(
            subject="SOEA updates",
            body_text="Latest news from SOEA.",
            body_html="<h1>Latest news</h1>",
            status="draft",
        )

        db.session.add_all(subscribers + [campaign])
        db.session.commit()

        yield {
            "campaign_id": campaign.id,
            "user_id": user.id,
            "active_id": subscribers[0].id,
            "pending_id": subscribers[1].id,
            "unsubscribed_id": subscribers[2].id,
        }

        db.session.remove()
        db.drop_all()


def test_campaign_sends_only_to_active_subscribers(
    app, campaign_client, monkeypatch
):
    sent_emails = []

    def fake_send(**kwargs):
        sent_emails.append(kwargs)

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        fake_send,
    )

    with app.app_context():
        result = newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        assert result["status"] == "sent"
        assert result["attempted"] == 1
        assert result["sent"] == 1
        assert result["failed"] == 0

        assert [item["email"] for item in sent_emails] == [
            "active@example.com"
        ]
        assert sent_emails[0]["unsubscribe_token"]

        deliveries = db.session.query(
            NewsletterDelivery
        ).all()
        assert len(deliveries) == 1
        assert deliveries[0].status == "sent"

        audit = db.session.query(AuditEvent).filter_by(
            action="newsletter.campaign_sent"
        ).one()
        assert audit.actor_user_id == campaign_client["user_id"]
        assert audit.details["sent"] == 1


def test_campaign_generates_recipient_specific_unsubscribe_tokens(
    app, campaign_client, monkeypatch
):
    from app.models import Subscriber

    with app.app_context():
        second = Subscriber(
            email="second@example.com",
            status="active",
            consent_text_version="v1",
        )
        db.session.add(second)
        db.session.commit()

    sent = []
    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        lambda **kwargs: sent.append(kwargs),
    )

    with app.app_context():
        newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

    assert len(sent) == 2
    assert len({item["unsubscribe_token"] for item in sent}) == 2


def test_failed_delivery_can_be_retried_without_resending_successes(
    app, campaign_client, monkeypatch
):
    with app.app_context():
        second = Subscriber(
            email="second@example.com",
            status="active",
            consent_text_version="v1",
        )
        db.session.add(second)
        db.session.commit()

    attempts = []

    def send_with_one_failure(**kwargs):
        attempts.append(kwargs["email"])
        if kwargs["email"] == "second@example.com" and attempts.count(
            "second@example.com"
        ) == 1:
            raise RuntimeError("Temporary SMTP failure")

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        send_with_one_failure,
    )

    with app.app_context():
        first_result = newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        assert first_result["status"] == "failed"
        assert first_result["sent"] == 1
        assert first_result["failed"] == 1

        second_result = newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        assert second_result["status"] == "sent"
        assert second_result["sent"] == 1
        assert second_result["failed"] == 0

        assert attempts.count("active@example.com") == 1
        assert attempts.count("second@example.com") == 2

        deliveries = db.session.query(
            NewsletterDelivery
        ).all()
        assert all(item.status == "sent" for item in deliveries)


def test_campaign_does_not_send_twice_after_success(
    app, campaign_client, monkeypatch
):
    sent = []
    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        lambda **kwargs: sent.append(kwargs["email"]),
    )

    with app.app_context():
        newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        with pytest.raises(ValueError, match="Cannot send"):
            newsletter_campaigns.send_campaign(
                campaign_client["campaign_id"],
                campaign_client["user_id"],
            )

    assert sent == ["active@example.com"]


def test_campaign_not_found_raises_value_error(app):
    from uuid import uuid4

    with app.app_context():
        db.create_all()

        with pytest.raises(ValueError, match="not found"):
            newsletter_campaigns.send_campaign(uuid4(), None)


def test_campaign_failure_is_recorded_and_other_recipients_continue(
    app, campaign_client, monkeypatch
):
    with app.app_context():
        second = Subscriber(
            email="second@example.com",
            status="active",
            consent_text_version="v1",
        )
        db.session.add(second)
        db.session.commit()

    attempted = []

    def fail_first(**kwargs):
        attempted.append(kwargs["email"])
        if kwargs["email"] == "active@example.com":
            raise RuntimeError("SMTP rejected recipient")

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        fail_first,
    )

    with app.app_context():
        result = newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        assert result["status"] == "failed"
        assert result["attempted"] == 2
        assert result["sent"] == 1
        assert result["failed"] == 1
        assert len(attempted) == 2

        failed_delivery = db.session.query(
            NewsletterDelivery
        ).filter_by(status="failed").one()
        assert failed_delivery.error_message == "Delivery attempt failed. Consult application logs for details."

        audit = db.session.query(AuditEvent).filter_by(
            action="newsletter.campaign_failed"
        ).one()
        assert audit.details["failed"] == 1

def test_recently_active_campaign_cannot_be_restarted(
    app, campaign_client, monkeypatch
):
    with app.app_context():
        campaign = db.session.get(
            NewsletterCampaign,
            campaign_client["campaign_id"],
        )
        campaign.status = "sending"
        campaign.sending_started_at = datetime.now(timezone.utc)
        campaign.sending_heartbeat_at = datetime.now(timezone.utc)
        db.session.commit()

        with pytest.raises(ValueError, match="already being sent"):
            newsletter_campaigns.send_campaign(
                campaign_client["campaign_id"],
                campaign_client["user_id"],
            )

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        lambda **kwargs: pytest.fail("Email must not be sent"),
    )


def test_stale_campaign_can_be_recovered_without_resending_successes(
    app, campaign_client, monkeypatch
):
    sent_emails = []

    def fake_send(**kwargs):
        sent_emails.append(kwargs["email"])

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_newsletter_campaign_email",
        fake_send,
    )

    with app.app_context():
        campaign = db.session.get(
            NewsletterCampaign,
            campaign_client["campaign_id"],
        )

        campaign.status = "sending"
        campaign.sending_started_at = (
            datetime.now(timezone.utc) - timedelta(minutes=30)
        )
        campaign.sending_heartbeat_at = (
            datetime.now(timezone.utc) - timedelta(minutes=20)
        )

        successful_delivery = NewsletterDelivery(
            campaign_id=campaign.id,
            subscriber_id=campaign_client["active_id"],
            status="sent",
            sent_at=datetime.now(timezone.utc) - timedelta(minutes=25),
        )

        db.session.add(successful_delivery)
        db.session.commit()

        result = newsletter_campaigns.send_campaign(
            campaign_client["campaign_id"],
            campaign_client["user_id"],
        )

        assert result["status"] == "sent"
        assert result["attempted"] == 0
        assert result["sent"] == 0
        assert result["failed"] == 0
        assert sent_emails == []

        recovered = db.session.get(
            NewsletterCampaign,
            campaign_client["campaign_id"],
        )

        assert recovered.status == "sent"
        assert recovered.sending_started_at is not None
        assert recovered.sending_heartbeat_at is not None
