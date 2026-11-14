from app.models import ContactEnquiry, Subscriber


def test_contact_enquiry_model_registration():
    assert ContactEnquiry.__tablename__ == "contact_enquiry"


def test_contact_enquiry_required_fields():
    required = {
        "name", "organization", "email",
        "partnership_category", "message", "consent",
    }
    assert required.issubset(ContactEnquiry.__table__.columns.keys())


def test_contact_enquiry_consent_is_explicit():
    column = ContactEnquiry.__table__.columns["consent"]
    assert column.nullable is False
    assert column.default is None


def test_subscriber_model_registration():
    assert Subscriber.__tablename__ == "subscriber"


def test_subscriber_email_is_unique():
    assert Subscriber.__table__.columns["email"].unique is True


def test_subscriber_has_consent_version():
    assert "consent_text_version" in Subscriber.__table__.columns


def test_subscriber_has_status_constraint():
    constraints = [
        constraint.name
        for constraint in Subscriber.__table__.constraints
    ]
    assert "ck_subscriber_status" in constraints
