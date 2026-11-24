import re

import pytest

from app.extensions import db
from app.models import AuditEvent, ContactEnquiry, User, UserRole

from admin_helpers import auth, make_user, token_for

URL = "/api/v1/contact-enquiries"


@pytest.fixture()
def inbox_client(app):
    app.config.update(
        INBOX_PARTNERSHIPS_EMAIL="partnerships@example.org",
        INBOX_VOLUNTEERS_EMAIL="volunteers@example.org",
        INBOX_INFO_EMAIL="info@example.org",
    )
    with app.app_context():
        db.create_all()
        make_user("rozalia@example.org", UserRole.ADMIN)
        make_user("editor@example.org", UserRole.EDITOR)
        make_user("author@example.org", UserRole.AUTHOR)
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def sent(monkeypatch):
    """Capture notification emails instead of sending them."""
    outbox = []

    def fake_send(to, subject, body, reply_to=None):
        outbox.append({"to": to, "subject": subject, "body": body})
        return True

    monkeypatch.setattr("app.services.notifications.send_email", fake_send)
    return outbox


def partnership(**overrides):
    payload = {
        "kind": "partnership",
        "name": "Amina Otieno",
        "organization": "Mathare Vocational College",
        "email": "amina@example.org",
        "interests": ["curriculum", "training-delivery"],
        "experience_resources": "We run accredited TVET courses.",
        "consent": True,
    }
    payload.update(overrides)
    return payload


def volunteer(**overrides):
    payload = {
        "kind": "volunteer",
        "name": "Peter Kamau",
        "email": "peter@example.org",
        "area": "communications",
        "skills": "Photography and video editing.",
        "availability": "few-hours-week",
        "motivation": "I want to tell community climate stories.",
        "consent": True,
    }
    payload.update(overrides)
    return payload


def contact(**overrides):
    payload = {
        "kind": "contact",
        "topic": "media",
        "name": "Grace Wanjiru",
        "email": "grace@example.org",
        "message": "I'd like to interview SOEA about CECI.",
        "consent": True,
    }
    payload.update(overrides)
    return payload


# --- Public submissions and routing -----------------------------------------------------

@pytest.mark.parametrize("payload, kind, inbox, prefix", [
    (partnership(), "partnership", "partnerships", "PA"),
    (volunteer(), "volunteer", "volunteers", "VO"),
    (contact(), "contact", "info", "CO"),
    (contact(topic="research"), "contact", "partnerships", "CO"),
    (contact(topic="institutional"), "contact", "partnerships", "CO"),
])
def test_messages_are_routed_by_kind_and_topic(inbox_client, sent, payload, kind, inbox, prefix):
    response = inbox_client.post(URL, json=payload)

    assert response.status_code == 201, response.get_json()
    reference = response.get_json()["data"]["reference"]
    assert re.fullmatch(rf"SOEA-{prefix}-[2-9A-HJ-NP-Z]{{6}}", reference)

    enquiry = db.session.query(ContactEnquiry).one()
    assert (enquiry.kind, enquiry.inbox, enquiry.status) == (kind, inbox, "new")
    assert enquiry.reference == reference

    assert len(sent) == 1
    assert sent[0]["to"] == f"{inbox}@example.org"
    assert reference in sent[0]["subject"]
    # The alert links to the dashboard but does not copy the message into the mailbox.
    assert f"/inbox/{enquiry.id}" in sent[0]["body"]
    assert (payload.get("message") or "never-present") not in sent[0]["body"]


def test_client_cannot_choose_the_inbox(inbox_client, sent):
    response = inbox_client.post(URL, json=contact(inbox="partnerships"))
    assert response.status_code == 400  # unknown field, rejected


def test_journey_answers_are_kept_in_details(inbox_client, sent):
    inbox_client.post(URL, json=volunteer())
    enquiry = db.session.query(ContactEnquiry).one()
    assert enquiry.details == {
        "area": "communications",
        "skills": "Photography and video editing.",
        "availability": "few-hours-week",
        "motivation": "I want to tell community climate stories.",
    }
    assert enquiry.organization is None and enquiry.message is None


def test_legacy_partnership_category_still_accepted(inbox_client, sent):
    payload = partnership(partnership_category="Training delivery")
    del payload["interests"]
    del payload["kind"]

    assert inbox_client.post(URL, json=payload).status_code == 201
    enquiry = db.session.query(ContactEnquiry).one()
    assert enquiry.kind == "partnership"
    assert enquiry.details == {"interests": ["Training delivery"]}


@pytest.mark.parametrize("payload, field", [
    (partnership(interests=None), "interests"),
    (partnership(organization=None), "organization"),
    (volunteer(skills=None), "skills"),
    (volunteer(availability=None), "availability"),
    (contact(message=None), "message"),
    (contact(topic="gossip"), "topic"),
    (contact(kind="complaint"), "kind"),
])
def test_required_fields_depend_on_kind(inbox_client, sent, payload, field):
    response = inbox_client.post(URL, json=payload)
    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0
    assert sent == []


def test_honeypot_submissions_look_accepted_but_are_dropped(inbox_client, sent):
    response = inbox_client.post(URL, json=contact(website="http://spam.example"))
    assert response.status_code == 201
    assert db.session.query(ContactEnquiry).count() == 0
    assert sent == []


def test_missing_inbox_address_still_stores_the_message(app, inbox_client, sent):
    app.config["INBOX_VOLUNTEERS_EMAIL"] = None
    assert inbox_client.post(URL, json=volunteer()).status_code == 201
    assert db.session.query(ContactEnquiry).count() == 1
    assert sent == []


def test_email_failure_never_fails_the_submission(app, inbox_client, monkeypatch):
    """With SMTP configured but unreachable, the message is still stored."""
    import smtplib

    app.config.update(SMTP_HOST="smtp.invalid", SMTP_FROM_EMAIL="no-reply@example.org")

    def broken(*args, **kwargs):
        raise smtplib.SMTPConnectError(421, "unavailable")

    monkeypatch.setattr("app.services.mailer.smtplib.SMTP", broken)
    assert inbox_client.post(URL, json=partnership()).status_code == 201
    assert db.session.query(ContactEnquiry).count() == 1


# --- Admin inbox --------------------------------------------------------------------------

@pytest.fixture()
def filled(inbox_client, sent):
    inbox_client.post(URL, json=partnership())
    inbox_client.post(URL, json=volunteer())
    inbox_client.post(URL, json=contact())
    return inbox_client


@pytest.mark.parametrize("email", ["rozalia@example.org", "editor@example.org"])
def test_admins_and_editors_see_the_inbox(filled, email):
    token = token_for(filled, email)
    response = filled.get("/api/v1/admin/enquiries", headers=auth(token))

    assert response.status_code == 200
    body = response.get_json()
    assert body["meta"]["pagination"]["total"] == 3
    first = body["data"][0]
    assert {"reference", "kind", "inbox", "status", "name", "email"} <= set(first)
    assert "internal_notes" not in first  # list view stays light


def test_authors_cannot_see_the_inbox(filled):
    token = token_for(filled, "author@example.org")
    assert filled.get("/api/v1/admin/enquiries", headers=auth(token)).status_code == 403


def test_inbox_filters_and_search(filled):
    token = token_for(filled, "editor@example.org")

    def total(query):
        response = filled.get(f"/api/v1/admin/enquiries?{query}", headers=auth(token))
        assert response.status_code == 200
        return response.get_json()["meta"]["pagination"]["total"]

    assert total("kind=volunteer") == 1
    assert total("inbox=partnerships") == 1
    assert total("status=new") == 3
    assert total("q=mathare") == 1
    assert total("q=%25") == 0  # wildcards are literal
    bad = filled.get("/api/v1/admin/enquiries?kind=spam", headers=auth(token))
    assert bad.status_code == 400


def test_update_status_notes_and_assignee(filled):
    token = token_for(filled, "rozalia@example.org")
    enquiry = db.session.query(ContactEnquiry).filter_by(kind="partnership").one()
    editor_user = db.session.query(User).filter_by(email="editor@example.org").one()

    response = filled.patch(
        f"/api/v1/admin/enquiries/{enquiry.id}",
        json={
            "status": "contacted",
            "internal_notes": "Call booked for Thursday.",
            "assigned_to_user_id": str(editor_user.id),
        },
        headers=auth(token),
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "contacted"
    assert data["internal_notes"] == "Call booked for Thursday."
    assert data["assigned_to"]["email"] == "editor@example.org"
    assert data["status_changed_at"] is not None
    assert data["details"] == {"interests": ["curriculum", "training-delivery"]}

    event = db.session.query(AuditEvent).filter_by(action="inbox.enquiry_updated").one()
    assert "Call booked" not in str(event.details)


def test_cannot_assign_to_author_or_unknown_account(filled):
    token = token_for(filled, "rozalia@example.org")
    enquiry = db.session.query(ContactEnquiry).first()
    author = db.session.query(User).filter_by(email="author@example.org").one()

    response = filled.patch(
        f"/api/v1/admin/enquiries/{enquiry.id}",
        json={"assigned_to_user_id": str(author.id)},
        headers=auth(token),
    )
    assert response.status_code == 400
    assert filled.patch(
        f"/api/v1/admin/enquiries/{enquiry.id}", json={"status": "archived"}, headers=auth(token)
    ).status_code == 400


def test_editors_can_list_who_to_assign_to(inbox_client):
    make_user("left@example.org", UserRole.EDITOR, active=False)
    token = token_for(inbox_client, "editor@example.org")

    response = inbox_client.get("/api/v1/admin/enquiries/assignees", headers=auth(token))

    assert response.status_code == 200
    emails = {person["email"] for person in response.get_json()["data"]}
    assert emails == {"rozalia@example.org", "editor@example.org"}  # no authors, no inactive


def test_authors_cannot_list_assignees(inbox_client):
    token = token_for(inbox_client, "author@example.org")
    response = inbox_client.get("/api/v1/admin/enquiries/assignees", headers=auth(token))
    assert response.status_code == 403


def test_only_admin_can_erase_a_message(filled):
    enquiry = db.session.query(ContactEnquiry).first()
    editor = token_for(filled, "editor@example.org")
    assert filled.delete(f"/api/v1/admin/enquiries/{enquiry.id}", headers=auth(editor)).status_code == 403

    admin = token_for(filled, "rozalia@example.org")
    assert filled.delete(f"/api/v1/admin/enquiries/{enquiry.id}", headers=auth(admin)).status_code == 204
    assert db.session.query(ContactEnquiry).count() == 2
    assert filled.get(f"/api/v1/admin/enquiries/{enquiry.id}", headers=auth(admin)).status_code == 404


# --- Dashboard ------------------------------------------------------------------------------

def test_dashboard_counts_for_admin(filled):
    token = token_for(filled, "rozalia@example.org")
    data = filled.get("/api/v1/admin/dashboard", headers=auth(token)).get_json()["data"]

    assert data["enquiries"]["by_status"]["new"] == 3
    assert data["enquiries"]["open_by_inbox"] == {
        "partnerships": 1, "volunteers": 1, "info": 1, "total": 3,
    }
    assert data["programs"]["total"] == 0
    assert data["stories_awaiting_review"] == 0
    assert set(data["stories"]) >= {"DRAFT", "IN_REVIEW", "PUBLISHED", "total"}


def test_dashboard_for_author_shows_only_their_own_work(filled):
    token = token_for(filled, "author@example.org")
    data = filled.get("/api/v1/admin/dashboard", headers=auth(token)).get_json()["data"]

    assert data["role"] == "author"
    assert data["my_stories"]["total"] == 0
    assert "enquiries" not in data and "programs" not in data
