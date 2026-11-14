import pytest
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    NewsletterCampaign,
    NewsletterDelivery,
    Subscriber,
)


@pytest.fixture()
def campaign_db(app):
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()


def test_campaign_model_registration():
    assert NewsletterCampaign.__tablename__ == "newsletter_campaign"


def test_campaign_has_required_content_and_lifecycle_fields():
    columns = NewsletterCampaign.__table__.columns

    assert {"subject", "body_text", "body_html", "status",
            "scheduled_at", "sent_at", "created_by_user_id"}.issubset(
        columns.keys()
    )


def test_campaign_has_status_constraint():
    names = {
        constraint.name
        for constraint in NewsletterCampaign.__table__.constraints
    }
    assert "ck_newsletter_campaign_status" in names


def test_delivery_model_registration():
    assert NewsletterDelivery.__tablename__ == "newsletter_delivery"


def test_delivery_prevents_duplicate_campaign_recipient(
    campaign_db,
):
    subscriber = Subscriber(
        email="reader@example.com",
        status="active",
        consent_text_version="v1",
    )
    campaign = NewsletterCampaign(
        subject="SOEA updates",
        body_text="Here are the latest updates.",
        status="sending",
    )

    db.session.add_all([subscriber, campaign])
    db.session.flush()

    first = NewsletterDelivery(
        campaign_id=campaign.id,
        subscriber_id=subscriber.id,
        status="pending",
    )
    db.session.add(first)
    db.session.commit()

    duplicate = NewsletterDelivery(
        campaign_id=campaign.id,
        subscriber_id=subscriber.id,
        status="pending",
    )
    db.session.add(duplicate)

    with pytest.raises(IntegrityError):
        db.session.commit()

    db.session.rollback()


def test_delivery_has_status_constraint():
    names = {
        constraint.name
        for constraint in NewsletterDelivery.__table__.constraints
    }
    assert "ck_newsletter_delivery_status" in names
