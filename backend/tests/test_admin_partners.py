import io
import uuid

import pytest
from PIL import Image

from app.extensions import db
from app.models import AuditEvent, MediaAsset, Partner, PartnershipArea, Program, Story, UserRole

from admin_helpers import auth, make_user, token_for

BASE = "/api/v1/admin/partners"


@pytest.fixture()
def partner_client(app, tmp_path):
    app.config["UPLOAD_DIR"] = str(tmp_path)
    with app.app_context():
        db.create_all()
        make_user("rozalia@example.org", UserRole.ADMIN)
        make_user("editor@example.org", UserRole.EDITOR)
        make_user("author@example.org", UserRole.AUTHOR)
        db.session.add_all([
            PartnershipArea(slug="curriculum", name="Curriculum", publication_status="published"),
            PartnershipArea(slug="ppe-supply", name="PPE supply", publication_status="draft"),
            Program(slug="ceci", title="CECI", summary="Community Environmental Champions Initiative",
                    publication_status="published"),
        ])
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def admin(partner_client):
    return token_for(partner_client, "rozalia@example.org")


@pytest.fixture()
def editor(partner_client):
    return token_for(partner_client, "editor@example.org")


def upload_logo(client, token, fmt="PNG"):
    buffer = io.BytesIO()
    Image.new("RGBA", (120, 60), (0, 128, 0, 255)).save(buffer, fmt)
    response = client.post(
        "/api/v1/admin/media",
        data={"file": (io.BytesIO(buffer.getvalue()), "logo.png"), "alt_text": "Mr. Green logo"},
        headers=auth(token),
        content_type="multipart/form-data",
    )
    return response.get_json()["data"]["id"]


def new_partner(**overrides):
    payload = {
        "name": "Mr. Green Trading Africa Kenya Ltd.",
        "partner_type": "business",
        "summary": "Segregation partner for the Waste Pickers Super Day.",
        "website_url": "https://mrgreenafrica.com",
        "area_slugs": ["curriculum"],
        "program_slugs": ["ceci"],
    }
    payload.update(overrides)
    return payload


# --- Creating ---------------------------------------------------------------------------------

def test_editor_creates_draft_partner_with_logo(partner_client, editor):
    logo_id = upload_logo(partner_client, editor)
    response = partner_client.post(BASE, json=new_partner(logo_id=logo_id), headers=auth(editor))

    assert response.status_code == 201, response.get_json()
    data = response.get_json()["data"]
    assert data["slug"] == "mr-green-trading-africa-kenya-ltd"
    assert data["publication_status"] == "draft"
    assert data["logo"]["id"] == logo_id
    assert data["logo"]["alt_text"] == "Mr. Green logo"
    assert [a["slug"] for a in data["areas"]] == ["curriculum"]
    assert [p["slug"] for p in data["programs"]] == ["ceci"]
    assert db.session.query(AuditEvent).filter_by(action="partner.created").count() == 1


def test_slug_is_made_unique(partner_client, editor):
    first = partner_client.post(BASE, json=new_partner(), headers=auth(editor)).get_json()["data"]
    second = partner_client.post(BASE, json=new_partner(), headers=auth(editor)).get_json()["data"]
    assert (first["slug"], second["slug"]) == (
        "mr-green-trading-africa-kenya-ltd", "mr-green-trading-africa-kenya-ltd-2",
    )
    taken = partner_client.post(
        BASE, json=new_partner(slug="mr-green-trading-africa-kenya-ltd"), headers=auth(editor),
    )
    assert taken.status_code == 400
    assert "slug" in taken.get_json()["error"]["details"]


@pytest.mark.parametrize("overrides, field", [
    ({"partner_type": "friend"}, "partner_type"),
    ({"website_url": "javascript:alert(1)"}, "website_url"),
    ({"slug": "Not A Slug"}, "slug"),
    ({"area_slugs": ["unknown-area"]}, "area_slugs"),
    ({"program_slugs": ["jeet"]}, "program_slugs"),
    ({"logo_id": str(uuid.uuid4())}, "logo_id"),
    ({"name": ""}, "name"),
])
def test_create_validation(partner_client, editor, overrides, field):
    response = partner_client.post(BASE, json=new_partner(**overrides), headers=auth(editor))
    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(Partner).count() == 0


def test_document_cannot_be_a_logo(partner_client, editor):
    pdf = partner_client.post(
        "/api/v1/admin/media",
        data={"file": (io.BytesIO(b"%PDF-1.4\n%%EOF"), "x.pdf")},
        headers=auth(editor), content_type="multipart/form-data",
    ).get_json()["data"]["id"]
    response = partner_client.post(BASE, json=new_partner(logo_id=pdf), headers=auth(editor))
    assert response.status_code == 400


def test_authors_cannot_manage_partners(partner_client):
    token = token_for(partner_client, "author@example.org")
    assert partner_client.get(BASE, headers=auth(token)).status_code == 403
    assert partner_client.post(BASE, json=new_partner(), headers=auth(token)).status_code == 403


# --- Publishing rules --------------------------------------------------------------------------

def test_only_admin_publishes(partner_client, editor, admin):
    assert partner_client.post(
        BASE, json=new_partner(publication_status="published"), headers=auth(editor),
    ).status_code == 403

    partner_id = partner_client.post(BASE, json=new_partner(), headers=auth(editor)).get_json()["data"]["id"]
    assert partner_client.patch(
        f"{BASE}/{partner_id}", json={"publication_status": "published"}, headers=auth(editor),
    ).status_code == 403

    published = partner_client.patch(
        f"{BASE}/{partner_id}", json={"publication_status": "published"}, headers=auth(admin),
    )
    assert published.status_code == 200
    assert published.get_json()["data"]["publication_status"] == "published"

    # Once public, an editor can no longer change it; the admin can.
    assert partner_client.patch(
        f"{BASE}/{partner_id}", json={"summary": "Changed"}, headers=auth(editor),
    ).status_code == 403
    assert partner_client.patch(
        f"{BASE}/{partner_id}", json={"summary": "Changed"}, headers=auth(admin),
    ).status_code == 200


def test_publishing_requires_a_summary(partner_client, admin):
    response = partner_client.post(
        BASE, json=new_partner(summary=None, publication_status="published"), headers=auth(admin),
    )
    assert response.status_code == 400
    assert "summary" in response.get_json()["error"]["details"]


def test_published_partner_and_logo_appear_on_public_api(partner_client, admin):
    logo_id = upload_logo(partner_client, admin)
    partner_client.post(
        BASE, json=new_partner(logo_id=logo_id, publication_status="published"), headers=auth(admin),
    )
    partner_client.post(BASE, json=new_partner(name="Draft Org"), headers=auth(admin))

    public = partner_client.get("/api/v1/partners").get_json()["data"]
    assert [p["name"] for p in public] == ["Mr. Green Trading Africa Kenya Ltd."]
    logo = public[0]["logo"]
    assert logo["url"].startswith("http://testserver/media/")
    assert logo["alt_text"] == "Mr. Green logo"
    assert set(logo) == {"url", "alt_text", "width", "height"}
    # Only published areas reach the public list.
    assert [a["slug"] for a in public[0]["areas"]] == ["curriculum"]


# --- Listing, updating, deleting -----------------------------------------------------------------

def test_list_filters(partner_client, admin):
    partner_client.post(BASE, json=new_partner(publication_status="published"), headers=auth(admin))
    partner_client.post(BASE, json=new_partner(name="Mathare Vocational College",
                                               partner_type="technical_institution"), headers=auth(admin))

    def total(query):
        return partner_client.get(f"{BASE}?{query}", headers=auth(admin)).get_json()["meta"]["pagination"]["total"]

    assert total("") == 2
    assert total("status=draft") == 1
    assert total("type=technical_institution") == 1
    assert total("q=mathare") == 1


def test_update_links_and_remove_logo(partner_client, editor):
    logo_id = upload_logo(partner_client, editor)
    partner_id = partner_client.post(
        BASE, json=new_partner(logo_id=logo_id), headers=auth(editor),
    ).get_json()["data"]["id"]

    response = partner_client.patch(
        f"{BASE}/{partner_id}",
        json={"logo_id": None, "area_slugs": [], "program_slugs": [], "sort_order": 5},
        headers=auth(editor),
    )
    data = response.get_json()["data"]
    assert data["logo"] is None and data["areas"] == [] and data["programs"] == []
    assert data["sort_order"] == 5
    assert partner_client.patch(f"{BASE}/{partner_id}", json={}, headers=auth(editor)).status_code == 400


def test_delete_rules(partner_client, editor, admin):
    linked_id = partner_client.post(BASE, json=new_partner(), headers=auth(editor)).get_json()["data"]["id"]
    assert partner_client.delete(f"{BASE}/{linked_id}", headers=auth(editor)).status_code == 403
    # Linked to a program: archive instead.
    assert partner_client.delete(f"{BASE}/{linked_id}", headers=auth(admin)).status_code == 409
    assert db.session.query(Partner).count() == 1

    lone_id = partner_client.post(
        BASE, json=new_partner(name="Lone", area_slugs=[], program_slugs=[]), headers=auth(editor),
    ).get_json()["data"]["id"]
    assert partner_client.delete(f"{BASE}/{lone_id}", headers=auth(admin)).status_code == 204


def test_partnership_area_options(partner_client, editor):
    data = partner_client.get("/api/v1/admin/partnership-areas", headers=auth(editor)).get_json()["data"]
    assert [a["slug"] for a in data] == ["curriculum", "ppe-supply"]
