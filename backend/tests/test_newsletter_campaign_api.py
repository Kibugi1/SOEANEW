from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest

from app.extensions import db
from app.models import (
    NewsletterCampaign,
    NewsletterDelivery,
    Subscriber,
    User,
    UserRole,
)


@pytest.fixture()
def campaign_api(app):
    with app.app_context():
        db.create_all()

        admin = User(
            email="admin@example.com",
            role=UserRole.ADMIN,
        )
        admin.set_password("StrongPassword123!")

        editor = User(
            email="editor@example.com",
            role=UserRole.EDITOR,
        )
        editor.set_password("StrongPassword123!")

        db.session.add_all([admin, editor])
        db.session.commit()

        admin_id = admin.id
        editor_id = editor.id

    client = app.test_client()

    def get_token(email):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": email,
                "password": "StrongPassword123!",
            },
        )
        assert response.status_code == 200
        return response.get_json()["data"]["access_token"]

    admin_token = get_token("admin@example.com")
    editor_token = get_token("editor@example.com")

    yield {
        "client": client,
        "admin_token": admin_token,
        "editor_token": editor_token,
        "admin_id": admin_id,
        "editor_id": editor_id,
    }

    with app.app_context():
        db.session.remove()
        db.drop_all()


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def create_campaign(client, token, **overrides):
    payload = {
        "subject": "SOEA newsletter",
        "body_text": "Updates from Square One Eco Africa.",
        "body_html": "<h1>SOEA updates</h1>",
    }
    payload.update(overrides)

    return client.post(
        "/api/v1/admin/newsletter-campaigns",
        json=payload,
        headers=auth(token),
    )


def test_campaign_creation_requires_authentication(campaign_api):
    response = create_campaign(
        campaign_api["client"],
        "invalid-token",
    )
    assert response.status_code == 401


def test_editor_can_create_campaign(campaign_api):
    response = create_campaign(
        campaign_api["client"],
        campaign_api["editor_token"],
    )

    assert response.status_code == 201
    data = response.get_json()["data"]

    assert data["subject"] == "SOEA newsletter"
    assert data["status"] == "draft"
    assert data["created_by_user_id"] == str(campaign_api["editor_id"])
    assert data["delivery_counts"] == {
        "pending": 0,
        "sent": 0,
        "failed": 0,
    }


def test_admin_can_create_campaign(campaign_api):
    response = create_campaign(
        campaign_api["client"],
        campaign_api["admin_token"],
    )
    assert response.status_code == 201


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"subject": "", "body_text": "Text"},
        {"subject": "Subject", "body_text": ""},
        {"subject": "x" * 256, "body_text": "Text"},
    ],
)
def test_campaign_creation_rejects_invalid_payloads(
    campaign_api,
    payload,
):
    response = campaign_api["client"].post(
        "/api/v1/admin/newsletter-campaigns",
        json=payload,
        headers=auth(campaign_api["admin_token"]),
    )
    assert response.status_code == 400


def test_campaign_list_and_detail(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    listing = client.get(
        "/api/v1/admin/newsletter-campaigns",
        headers=auth(token),
    )

    assert listing.status_code == 200
    assert listing.get_json()["meta"]["pagination"]["total"] == 1
    assert listing.get_json()["data"][0]["id"] == campaign_id

    detail = client.get(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}",
        headers=auth(token),
    )

    assert detail.status_code == 200
    assert detail.get_json()["data"]["id"] == campaign_id


def test_campaign_detail_returns_delivery_counts(campaign_api, app):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    with app.app_context():
        subscriber = Subscriber(
            email="recipient@example.com",
            status="active",
            consent_text_version="v1",
        )
        db.session.add(subscriber)
        db.session.flush()

        db.session.add(NewsletterDelivery(
            campaign_id=UUID(campaign_id),
            subscriber_id=subscriber.id,
            status="failed",
        ))
        db.session.commit()

    response = client.get(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}",
        headers=auth(token),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["delivery_counts"]["failed"] == 1


def test_campaign_not_found(campaign_api):
    response = campaign_api["client"].get(
        f"/api/v1/admin/newsletter-campaigns/{uuid4()}",
        headers=auth(campaign_api["admin_token"]),
    )
    assert response.status_code == 404


def test_campaign_update_changes_draft_fields(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["editor_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    response = client.patch(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}",
        json={
            "subject": "Updated SOEA newsletter",
            "body_text": "Updated content.",
        },
        headers=auth(token),
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["subject"] == "Updated SOEA newsletter"
    assert data["body_text"] == "Updated content."
    assert data["body_html"] == "<h1>SOEA updates</h1>"


def test_campaign_update_requires_at_least_one_field(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    response = client.patch(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}",
        json={},
        headers=auth(token),
    )

    assert response.status_code == 400


def test_campaign_schedule_requires_timezone(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/schedule",
        json={"scheduled_at": "2030-01-01T12:00:00"},
        headers=auth(token),
    )

    assert response.status_code == 400


def test_campaign_can_be_scheduled_in_future(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    scheduled_at = (
        datetime.now(timezone.utc) + timedelta(days=2)
    ).isoformat()

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/schedule",
        json={"scheduled_at": scheduled_at},
        headers=auth(token),
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "scheduled"
    assert data["scheduled_at"] is not None


def test_campaign_cannot_be_scheduled_in_the_past(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    scheduled_at = (
        datetime.now(timezone.utc) - timedelta(days=1)
    ).isoformat()

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/schedule",
        json={"scheduled_at": scheduled_at},
        headers=auth(token),
    )

    assert response.status_code == 400


def test_scheduled_campaign_cannot_be_edited(campaign_api):
    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/schedule",
        json={
            "scheduled_at": (
                datetime.now(timezone.utc) + timedelta(days=2)
            ).isoformat()
        },
        headers=auth(token),
    )

    response = client.patch(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}",
        json={"subject": "Changed"},
        headers=auth(token),
    )

    assert response.status_code == 409


def test_future_scheduled_campaign_cannot_be_sent(
    campaign_api,
    monkeypatch,
):
    from app.api.v1 import newsletter_campaigns

    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/schedule",
        json={
            "scheduled_at": (
                datetime.now(timezone.utc) + timedelta(days=2)
            ).isoformat()
        },
        headers=auth(token),
    )

    def unexpected_send(*args, **kwargs):
        pytest.fail("Future scheduled campaign must not be sent.")

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_campaign",
        unexpected_send,
    )

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/send",
        headers=auth(token),
    )

    assert response.status_code == 409


def test_send_endpoint_calls_campaign_service(campaign_api, monkeypatch):
    from app.api.v1 import newsletter_campaigns

    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    calls = []

    def fake_send(received_id, actor_user_id):
        calls.append((str(received_id), str(actor_user_id)))
        return {
            "campaign_id": str(received_id),
            "status": "sent",
            "attempted": 2,
            "sent": 2,
            "failed": 0,
            "skipped": 0,
            "outstanding": 0,
        }

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_campaign",
        fake_send,
    )

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/send",
        headers=auth(token),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "sent"
    assert calls == [
        (campaign_id, str(campaign_api["admin_id"]))
    ]


def test_failed_campaign_can_be_retried(campaign_api, app, monkeypatch):
    from app.api.v1 import newsletter_campaigns

    client = campaign_api["client"]
    token = campaign_api["admin_token"]

    created = create_campaign(client, token)
    campaign_id = created.get_json()["data"]["id"]

    with app.app_context():
        campaign = db.session.get(NewsletterCampaign, __import__("uuid").UUID(campaign_id))
        campaign.status = "failed"
        db.session.commit()

    called = []

    def fake_send(received_id, actor_user_id):
        called.append(str(received_id))
        return {
            "campaign_id": str(received_id),
            "status": "sent",
            "attempted": 1,
            "sent": 1,
            "failed": 0,
            "skipped": 0,
            "outstanding": 0,
        }

    monkeypatch.setattr(
        newsletter_campaigns,
        "send_campaign",
        fake_send,
    )

    response = client.post(
        f"/api/v1/admin/newsletter-campaigns/{campaign_id}/send",
        headers=auth(token),
    )

    assert response.status_code == 200
    assert called == [campaign_id]
