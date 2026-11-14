import pytest
from uuid import UUID

from app.extensions import db
from app.models import ContactEnquiry


@pytest.fixture()
def contact_client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def valid_payload(**overrides):
    payload = {
        "name": "Jane Doe",
        "organization": "Example Organization",
        "email": "JANE@EXAMPLE.COM",
        "phone": "+254700000000",
        "partnership_category": "Environmental partnership",
        "experience_resources": "Community outreach",
        "message": "I would like to discuss a possible partnership with SOEA.",
        "consent": True,
    }
    payload.update(overrides)
    return payload


def test_contact_enquiry_is_created(contact_client):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(),
    )

    assert response.status_code == 201
    body = response.get_json()["data"]
    assert body["message"] == "Your enquiry has been received."
    assert "id" in body

    enquiry = db.session.get(ContactEnquiry, UUID(body["id"]))
    assert enquiry is not None
    assert enquiry.email == "jane@example.com"
    assert enquiry.consent is True
    assert enquiry.status == "new"


def test_contact_enquiry_requires_explicit_consent(contact_client):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(consent=False),
    )

    assert response.status_code == 400
    assert "consent" in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0


@pytest.mark.parametrize(
    "overrides, field",
    [
        ({"name": ""}, "name"),
        ({"email": "not-an-email"}, "email"),
        ({"message": "Short"}, "message"),
        ({"organization": ""}, "organization"),
        ({"partnership_category": ""}, "partnership_category"),
        ({"consent": None}, "consent"),
    ],
)
def test_contact_enquiry_rejects_invalid_fields(
    contact_client, overrides, field
):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(**overrides),
    )

    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0


def test_contact_enquiry_rejects_missing_json(contact_client):
    response = contact_client.post("/api/v1/contact-enquiries")

    assert response.status_code == 400
    assert db.session.query(ContactEnquiry).count() == 0


def test_contact_enquiry_does_not_expose_private_fields(contact_client):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(),
    )

    body = response.get_json()["data"]

    assert set(body) == {"id", "message"}
    assert "email" not in body
    assert "consent" not in body
    assert "status" not in body
    assert "message" not in body or body["message"] != valid_payload()["message"]

def test_contact_enquiry_rejects_oversized_experience_resources(
    contact_client,
):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(experience_resources="x" * 5001),
    )

    assert response.status_code == 400
    assert "experience_resources" in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0


def test_contact_enquiry_rejects_unexpected_fields(contact_client):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(unexpected_field="unexpected data"),
    )

    assert response.status_code == 400
    assert "unexpected_field" in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0


def test_contact_enquiry_accepts_maximum_experience_resources_length(
    contact_client,
):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(experience_resources="x" * 5000),
    )

    assert response.status_code == 201

@pytest.mark.parametrize(
    "overrides, field",
    [
        ({"name": "   "}, "name"),
        ({"organization": "   "}, "organization"),
        ({"partnership_category": "   "}, "partnership_category"),
        ({"experience_resources": "x" * 5001}, "experience_resources"),
    ],
)
def test_contact_enquiry_rejects_blank_or_oversized_text(
    contact_client, overrides, field
):
    response = contact_client.post(
        "/api/v1/contact-enquiries",
        json=valid_payload(**overrides),
    )

    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(ContactEnquiry).count() == 0
