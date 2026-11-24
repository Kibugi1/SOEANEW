import pytest

from app.extensions import db
from app.models import Subscriber
from app.services.auth_tokens import generate_newsletter_token


@pytest.fixture()
def newsletter_client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def subscribe(client, email="reader@example.com", consent=True):
    return client.post(
        "/api/v1/newsletter-subscriptions",
        json={"email": email, "consent": consent},
    )


def test_newsletter_subscription_creates_pending_record(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append((email, token)),
    )

    response = subscribe(newsletter_client)

    assert response.status_code == 202
    assert len(sent) == 1
    assert sent[0][0] == "reader@example.com"

    with app.app_context():
        subscriber = db.session.execute(
            db.select(Subscriber).where(
                Subscriber.email == "reader@example.com"
            )
        ).scalar_one()
        assert subscriber.status == "pending"
        assert subscriber.consent_text_version == "v1"


def test_newsletter_subscription_normalizes_email(
    newsletter_client, monkeypatch
):
    from app.api.v1 import forms

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append(email),
    )

    response = subscribe(newsletter_client, "  READER@EXAMPLE.COM  ")

    assert response.status_code == 202
    assert sent == ["reader@example.com"]


def test_newsletter_subscription_requires_consent(newsletter_client):
    response = subscribe(newsletter_client, consent=False)

    assert response.status_code == 400


def test_newsletter_subscription_rejects_invalid_email(newsletter_client):
    response = subscribe(newsletter_client, "not-an-email")

    assert response.status_code == 400


def test_newsletter_subscription_resends_pending_confirmation(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append(email),
    )

    first = subscribe(newsletter_client)
    second = subscribe(newsletter_client)

    assert first.status_code == 202
    assert second.status_code == 202
    assert sent == ["reader@example.com", "reader@example.com"]

    with app.app_context():
        assert db.session.query(Subscriber).count() == 1


def test_newsletter_subscription_does_not_resend_to_active_address(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    with app.app_context():
        db.session.add(Subscriber(
            email="reader@example.com",
            status="active",
            consent_text_version="v1",
        ))
        db.session.commit()

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append(email),
    )

    response = subscribe(newsletter_client)

    assert response.status_code == 202
    assert sent == []


def test_newsletter_email_failure_returns_503_and_keeps_pending_record(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    def fail_delivery(email, token):
        raise RuntimeError("SMTP unavailable")

    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        fail_delivery,
    )

    response = subscribe(newsletter_client)

    assert response.status_code == 503

    with app.app_context():
        subscriber = db.session.execute(
            db.select(Subscriber).where(
                Subscriber.email == "reader@example.com"
            )
        ).scalar_one()
        assert subscriber.status == "pending"


def test_confirmation_activates_pending_subscription(
    newsletter_client, app
):
    with app.app_context():
        db.session.add(Subscriber(
            email="reader@example.com",
            status="pending",
            consent_text_version="v1",
        ))
        db.session.commit()
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        token = generate_newsletter_token(
            "reader@example.com",
            "confirm",
            subscriber.token_nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": token},
    )

    assert response.status_code == 200

    with app.app_context():
        subscriber = db.session.execute(
            db.select(Subscriber).where(
                Subscriber.email == "reader@example.com"
            )
        ).scalar_one()
        assert subscriber.status == "active"


def test_confirmation_rejects_invalid_token(newsletter_client):
    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": "invalid-token"},
    )

    assert response.status_code == 400


def test_confirmation_rejects_missing_token(newsletter_client):
    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={},
    )

    assert response.status_code == 400


def test_confirmation_is_idempotent_for_active_subscriber(
    newsletter_client, app
):
    with app.app_context():
        db.session.add(Subscriber(
            email="reader@example.com",
            status="active",
            consent_text_version="v1",
        ))
        db.session.commit()
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        token = generate_newsletter_token(
            "reader@example.com",
            "confirm",
            subscriber.token_nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": token},
    )

    assert response.status_code == 200
from app.extensions import db
from app.models import Subscriber
from app.services.auth_tokens import generate_newsletter_token


def create_subscriber(app, email, status):
    with app.app_context():
        subscriber = Subscriber(
            email=email,
            status=status,
            consent_text_version="v1",
        )
        db.session.add(subscriber)
        db.session.commit()
        return subscriber.token_nonce


def test_unsubscribe_changes_active_subscriber_to_unsubscribed(
    newsletter_client, app
):
    nonce = create_subscriber(app, "reader@example.com", "active")

    with app.app_context():
        token = generate_newsletter_token(
            "reader@example.com",
            "unsubscribe",
            nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": token},
    )

    assert response.status_code == 200

    with app.app_context():
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        assert subscriber.status == "unsubscribed"


def test_unsubscribe_can_cancel_pending_subscription(
    newsletter_client, app
):
    nonce = create_subscriber(app, "reader@example.com", "pending")

    with app.app_context():
        token = generate_newsletter_token(
            "reader@example.com",
            "unsubscribe",
            nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": token},
    )

    assert response.status_code == 200

    with app.app_context():
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        assert subscriber.status == "unsubscribed"


def test_unsubscribe_is_idempotent(newsletter_client, app):
    nonce = create_subscriber(app, "reader@example.com", "unsubscribed")

    with app.app_context():
        token = generate_newsletter_token(
            "reader@example.com",
            "unsubscribe",
            nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": token},
    )

    assert response.status_code == 200


def test_unsubscribe_rejects_confirmation_token(
    newsletter_client, app
):
    nonce = create_subscriber(app, "reader@example.com", "active")

    with app.app_context():
        token = generate_newsletter_token(
            "reader@example.com",
            "confirm",
            nonce,
        )

    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": token},
    )

    assert response.status_code == 400


def test_unsubscribe_rejects_invalid_token(newsletter_client):
    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": "invalid-token"},
    )

    assert response.status_code == 400


def test_unsubscribed_person_cannot_be_reactivated_by_old_confirmation(
    newsletter_client, app
):
    nonce = create_subscriber(app, "reader@example.com", "pending")

    with app.app_context():
        confirmation_token = generate_newsletter_token(
            "reader@example.com",
            "confirm",
            nonce,
        )
        unsubscribe_token = generate_newsletter_token(
            "reader@example.com",
            "unsubscribe",
            nonce,
        )

    unsubscribe_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": unsubscribe_token},
    )
    assert unsubscribe_response.status_code == 200

    confirmation_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": confirmation_token},
    )
    assert confirmation_response.status_code == 409

    with app.app_context():
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        assert subscriber.status == "unsubscribed"


def test_unsubscribe_rejects_missing_token(newsletter_client):
    response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={},
    )

    assert response.status_code == 400



def test_old_confirmation_token_is_invalidated_by_resend(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append(token),
    )

    first = subscribe(newsletter_client)
    second = subscribe(newsletter_client)

    assert first.status_code == 202
    assert second.status_code == 202
    assert len(sent) == 2
    assert sent[0] != sent[1]

    old_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": sent[0]},
    )
    current_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/confirm",
        json={"token": sent[1]},
    )

    assert old_response.status_code == 400
    assert current_response.status_code == 200

    with app.app_context():
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        assert subscriber.status == "active"


def test_old_unsubscribe_token_is_invalidated_after_resubscription(
    newsletter_client, app, monkeypatch
):
    from app.api.v1 import forms

    nonce = create_subscriber(app, "reader@example.com", "active")

    with app.app_context():
        old_unsubscribe_token = generate_newsletter_token(
            "reader@example.com",
            "unsubscribe",
            nonce,
        )

    unsubscribe_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": old_unsubscribe_token},
    )
    assert unsubscribe_response.status_code == 200

    sent = []
    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        lambda email, token: sent.append(token),
    )

    resubscribe_response = subscribe(newsletter_client)
    assert resubscribe_response.status_code == 202

    stale_unsubscribe_response = newsletter_client.post(
        "/api/v1/newsletter-subscriptions/unsubscribe",
        json={"token": old_unsubscribe_token},
    )
    assert stale_unsubscribe_response.status_code == 400

    with app.app_context():
        subscriber = db.session.query(Subscriber).filter_by(
            email="reader@example.com"
        ).one()
        assert subscriber.status == "pending"
        assert len(sent) == 1

@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/v1/newsletter-subscriptions/confirm",
        "/api/v1/newsletter-subscriptions/unsubscribe",
    ],
)
@pytest.mark.parametrize(
    "token",
    [
        "not-a-valid-token",
        "x" * 5000,
    ],
)
def test_newsletter_token_endpoints_reject_malformed_or_oversized_tokens(
    newsletter_client, endpoint, token
):
    response = newsletter_client.post(
        endpoint,
        json={"token": token},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()



@pytest.mark.parametrize(
    ("endpoint", "error_code"),
    [
        (
            "/api/v1/newsletter-subscriptions/confirm",
            "INVALID_CONFIRMATION_TOKEN",
        ),
        (
            "/api/v1/newsletter-subscriptions/unsubscribe",
            "INVALID_UNSUBSCRIBE_TOKEN",
        ),
    ],
)
def test_invalid_newsletter_token_errors_include_request_id(
    newsletter_client, endpoint, error_code
):
    request_id = "newsletter-error-test-123"

    response = newsletter_client.post(
        endpoint,
        json={"token": "invalid-token"},
        headers={"X-Request-ID": request_id},
    )

    assert response.status_code == 400
    assert response.headers["X-Request-ID"] == request_id
    assert response.get_json()["error"]["code"] == error_code
    assert response.get_json()["error"]["request_id"] == request_id


def test_newsletter_email_failure_error_includes_request_id(
    newsletter_client, monkeypatch
):
    from app.api.v1 import forms

    def fail_delivery(email, token):
        raise RuntimeError("SMTP unavailable")

    monkeypatch.setattr(
        forms,
        "send_newsletter_confirmation",
        fail_delivery,
    )

    request_id = "newsletter-email-error-123"
    response = subscribe(
        newsletter_client
    )

    assert response.status_code == 503
    assert response.headers["X-Request-ID"]
    assert response.get_json()["error"]["code"] == "EMAIL_DELIVERY_FAILED"
    assert response.get_json()["error"]["request_id"] == response.headers["X-Request-ID"]


def _status(app, email="reader@example.com"):
    with app.app_context():
        return db.session.query(Subscriber).filter_by(email=email).one().status


def _unsubscribe_token(app, nonce, email="reader@example.com"):
    with app.app_context():
        return generate_newsletter_token(email, "unsubscribe", nonce)


def test_unsubscribe_links_keep_working_after_confirmation_links_expire(newsletter_client, app):
    nonce = create_subscriber(app, "reader@example.com", "active")
    token = _unsubscribe_token(app, nonce)
    app.config["NEWSLETTER_TOKEN_MAX_AGE"] = -1  # every confirmation link is now expired

    response = newsletter_client.post("/api/v1/newsletter-subscriptions/unsubscribe", json={"token": token})

    assert response.status_code == 200
    assert _status(app) == "unsubscribed"


def test_one_click_unsubscribe(newsletter_client, app):
    nonce = create_subscriber(app, "reader@example.com", "active")
    token = _unsubscribe_token(app, nonce)

    response = newsletter_client.post(
        f"/api/v1/newsletter-subscriptions/one-click?token={token}",
        data={"List-Unsubscribe": "One-Click"},
    )

    assert response.status_code == 200
    assert _status(app) == "unsubscribed"
    # Repeating it is harmless.
    again = newsletter_client.post(
        f"/api/v1/newsletter-subscriptions/one-click?token={token}",
        data={"List-Unsubscribe": "One-Click"},
    )
    assert again.status_code == 200


def test_one_click_needs_post_with_the_one_click_body(newsletter_client, app):
    nonce = create_subscriber(app, "reader@example.com", "active")
    token = _unsubscribe_token(app, nonce)
    url = f"/api/v1/newsletter-subscriptions/one-click?token={token}"

    assert newsletter_client.get(url).status_code == 405  # link scanners only open (GET) links
    assert newsletter_client.post(url).status_code == 400
    assert newsletter_client.post(url, data={"List-Unsubscribe": "yes"}).status_code == 400
    assert _status(app) == "active"


def test_one_click_rejects_bad_or_missing_tokens(newsletter_client, app):
    create_subscriber(app, "reader@example.com", "active")
    body = {"List-Unsubscribe": "One-Click"}

    assert newsletter_client.post("/api/v1/newsletter-subscriptions/one-click", data=body).status_code == 400
    assert newsletter_client.post(
        "/api/v1/newsletter-subscriptions/one-click?token=forged", data=body
    ).status_code == 400
    assert _status(app) == "active"
