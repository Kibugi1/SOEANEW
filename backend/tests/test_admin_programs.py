import pytest

from app.content_seed import JEET_SLUG, seed_jeet
from app.extensions import db
from app.models import (
    AuditEvent,
    Location,
    Partner,
    Program,
    Story,
    TeamProfile,
    ThematicArea,
    UserRole,
    program_themes,
)

from admin_helpers import auth, make_profile, make_user, token_for

BASE = "/api/v1/admin/programs"


@pytest.fixture()
def program_client(app):
    with app.app_context():
        db.create_all()
        make_user("rozalia@example.org", UserRole.ADMIN)
        make_user("editor@example.org", UserRole.EDITOR)
        make_user("author@example.org", UserRole.AUTHOR)
        db.session.add_all([
            Program(slug="ceci", title="Community Environmental Champions Initiative", short_name="CECI",
                    summary="CECI summary.", status="in_progress", publication_status="published"),
            ThematicArea(slug="renewable-energy-clean-cooking", name="Renewable Energy & Clean Cooking",
                         summary="s", publication_status="published"),
            ThematicArea(slug="rural-urban", name="Rural-Urban Sustainable Development",
                         summary="s", publication_status="published"),
            Location(slug="nairobi", name="Nairobi", location_type="county", publication_status="published"),
            Location(slug="kajiado", name="Kajiado", location_type="county", publication_status="published"),
            Location(slug="isiolo", name="Isiolo", location_type="county", publication_status="published"),
            Partner(slug="mr-green", name="Mr. Green", partner_type="business", publication_status="published"),
        ])
        db.session.commit()
        make_profile("chika-atueyi", "Chika Atueyi")
        yield app.test_client()
        db.session.rollback()
        _drop_all()


def _drop_all():
    # SQLite empties a table while dropping it; JEET -> CECI (RESTRICT) would block that.
    db.session.query(Program).update({"parent_id": None})
    db.session.commit()
    db.session.remove()
    db.drop_all()


@pytest.fixture()
def admin(program_client):
    return token_for(program_client, "rozalia@example.org")


@pytest.fixture()
def editor(program_client):
    return token_for(program_client, "editor@example.org")


def jeet_payload(**overrides):
    payload = {
        "title": "JEET Champions: Green Mobility Champions Pathway",
        "short_name": "JEET",
        "summary": "Clean energy and e-mobility opportunities for women and youth.",
        "status": "in_development",
        "parent_slug": "ceci",
        "lead_profile_slug": "chika-atueyi",
        "contact_email": "C.Atueyi@sq1ecoafrica.org",
        "cta_label": "Help shape the first JEET Champions cohort",
        "cta_pending": True,
        "theme_slugs": ["renewable-energy-clean-cooking", "rural-urban"],
        "primary_theme_slug": "renewable-energy-clean-cooking",
        "location_slugs": ["nairobi", "kajiado", "isiolo"],
        "partner_slugs": ["mr-green"],
    }
    payload.update(overrides)
    return payload


# --- Creating ------------------------------------------------------------------------------------

def test_editor_creates_draft_sub_program(program_client, editor):
    response = program_client.post(BASE, json=jeet_payload(), headers=auth(editor))

    assert response.status_code == 201, response.get_json()
    data = response.get_json()["data"]
    assert data["slug"] == "jeet"  # from the short name
    assert data["status"] == "in_development"
    assert data["publication_status"] == "draft"
    assert data["parent"]["slug"] == "ceci"
    assert data["lead"]["slug"] == "chika-atueyi"
    assert data["contact_email"] == "c.atueyi@sq1ecoafrica.org"
    assert data["cta_pending"] is True
    assert data["primary_theme"] == "renewable-energy-clean-cooking"
    assert [l["slug"] for l in data["locations"]] == ["nairobi", "kajiado", "isiolo"] or \
        {l["slug"] for l in data["locations"]} == {"nairobi", "kajiado", "isiolo"}
    assert [p["slug"] for p in data["partners"]] == ["mr-green"]

    ceci = program_client.get(f"{BASE}?q=ceci", headers=auth(editor)).get_json()["data"][0]
    assert [c["slug"] for c in ceci["sub_programs"]] == ["jeet"]


@pytest.mark.parametrize("overrides, field", [
    ({"status": "dreaming"}, "status"),
    ({"parent_slug": "nope"}, "parent_slug"),
    ({"lead_profile_slug": "nobody"}, "lead_profile_slug"),
    ({"contact_email": "not-email"}, "contact_email"),
    ({"cta_url": "javascript:alert(1)", "cta_pending": False}, "cta_url"),
    ({"cta_pending": False}, "cta_url"),  # a live CTA needs a link
    ({"primary_theme_slug": "not-in-list"}, "primary_theme_slug"),
    ({"start_date": "2027-06-01", "end_date": "2027-01-01"}, "end_date"),
    ({"summary": "x" * 501}, "summary"),
])
def test_create_validation(program_client, editor, overrides, field):
    response = program_client.post(BASE, json=jeet_payload(**overrides), headers=auth(editor))
    assert response.status_code == 400, response.get_json()
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(Program).count() == 1  # only CECI


def test_cta_accepts_site_path(program_client, editor):
    response = program_client.post(
        BASE, json=jeet_payload(cta_pending=False, cta_url="/partner-with-us"), headers=auth(editor),
    )
    assert response.status_code == 201


def test_program_cannot_sit_under_itself(program_client, admin):
    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    jeet_id = program_client.post(BASE, json=jeet_payload(), headers=auth(admin)).get_json()["data"]["id"]

    assert program_client.patch(
        f"{BASE}/{ceci.id}", json={"parent_slug": "jeet"}, headers=auth(admin),
    ).status_code == 400
    assert program_client.patch(
        f"{BASE}/{jeet_id}", json={"parent_slug": "jeet"}, headers=auth(admin),
    ).status_code == 400


def test_primary_theme_moves_and_clears(program_client, editor):
    program_id = program_client.post(BASE, json=jeet_payload(), headers=auth(editor)).get_json()["data"]["id"]

    moved = program_client.patch(
        f"{BASE}/{program_id}", json={"primary_theme_slug": "rural-urban"}, headers=auth(editor),
    )
    assert moved.get_json()["data"]["primary_theme"] == "rural-urban"
    primaries = db.session.query(program_themes).filter(program_themes.c.is_primary.is_(True)).count()
    assert primaries == 1

    cleared = program_client.patch(
        f"{BASE}/{program_id}", json={"primary_theme_slug": None}, headers=auth(editor),
    )
    assert cleared.get_json()["data"]["primary_theme"] is None


def test_authors_cannot_manage_programs(program_client):
    token = token_for(program_client, "author@example.org")
    assert program_client.get(BASE, headers=auth(token)).status_code == 403


# --- Publishing and the public API ----------------------------------------------------------------

def test_only_admin_publishes_and_edits_live_programs(program_client, editor, admin):
    program_id = program_client.post(BASE, json=jeet_payload(), headers=auth(editor)).get_json()["data"]["id"]
    assert program_client.patch(
        f"{BASE}/{program_id}", json={"publication_status": "published"}, headers=auth(editor),
    ).status_code == 403
    assert program_client.patch(
        f"{BASE}/{program_id}", json={"publication_status": "published"}, headers=auth(admin),
    ).status_code == 200

    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    assert program_client.patch(
        f"{BASE}/{ceci.id}", json={"summary": "Changed"}, headers=auth(editor),
    ).status_code == 403


def test_public_detail_shows_lead_cta_and_family(program_client, admin):
    program_client.post(BASE, json=jeet_payload(publication_status="published"), headers=auth(admin))

    jeet = program_client.get("/api/v1/programs/jeet").get_json()["data"]
    assert jeet["status"] == "in_development"
    assert jeet["parent"]["slug"] == "ceci"
    assert jeet["lead"]["display_name"] == "Chika Atueyi"
    assert jeet["contact_email"] == "c.atueyi@sq1ecoafrica.org"
    assert jeet["cta"] == {
        "label": "Help shape the first JEET Champions cohort", "url": None, "pending": True,
    }

    ceci = program_client.get("/api/v1/programs/ceci").get_json()["data"]
    assert [p["slug"] for p in ceci["sub_programs"]] == ["jeet"]
    assert ceci["cta"] is None and ceci["lead"] is None


def test_public_hides_unpublished_lead_parent_and_children(program_client, admin):
    program_client.post(BASE, json=jeet_payload(), headers=auth(admin))  # JEET stays a draft
    ceci = program_client.get("/api/v1/programs/ceci").get_json()["data"]
    assert ceci["sub_programs"] == []
    assert program_client.get("/api/v1/programs/jeet").status_code == 404

    jeet = db.session.query(Program).filter_by(slug="jeet").one()
    jeet.publication_status = "published"
    db.session.query(TeamProfile).filter_by(slug="chika-atueyi").update({"status": "draft"})
    db.session.query(Program).filter_by(slug="ceci").update({"publication_status": "draft"})
    db.session.commit()

    data = program_client.get("/api/v1/programs/jeet").get_json()["data"]
    assert data["lead"] is None and data["parent"] is None


def test_live_cta_link_is_public(program_client, admin):
    program_client.post(
        BASE,
        json=jeet_payload(cta_pending=False, cta_url="https://example.org/apply", publication_status="published"),
        headers=auth(admin),
    )
    cta = program_client.get("/api/v1/programs/jeet").get_json()["data"]["cta"]
    assert cta == {"label": "Help shape the first JEET Champions cohort",
                   "url": "https://example.org/apply", "pending": False}


# --- Listing and deleting --------------------------------------------------------------------------

def test_list_filters(program_client, admin):
    program_client.post(BASE, json=jeet_payload(), headers=auth(admin))

    def total(query):
        return program_client.get(f"{BASE}?{query}", headers=auth(admin)).get_json()["meta"]["pagination"]["total"]

    assert total("") == 2
    assert total("status=draft") == 1
    assert total("progress=in_development") == 1
    assert total("q=jeet") == 1


def test_delete_rules(program_client, editor, admin):
    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    jeet_id = program_client.post(BASE, json=jeet_payload(), headers=auth(editor)).get_json()["data"]["id"]

    assert program_client.delete(f"{BASE}/{jeet_id}", headers=auth(editor)).status_code == 403
    assert program_client.delete(f"{BASE}/{ceci.id}", headers=auth(admin)).status_code == 409  # has JEET

    story = Story(slug="s", title="S", summary="S", body="B")
    story.programs.append(db.session.get(Program, __import__("uuid").UUID(jeet_id)))
    db.session.add(story)
    db.session.commit()
    assert program_client.delete(f"{BASE}/{jeet_id}", headers=auth(admin)).status_code == 409

    db.session.delete(story)
    db.session.commit()
    assert program_client.delete(f"{BASE}/{jeet_id}", headers=auth(admin)).status_code == 204


def test_dashboard_counts_programs(program_client, admin):
    program_client.post(BASE, json=jeet_payload(), headers=auth(admin))
    data = program_client.get("/api/v1/admin/dashboard", headers=auth(admin)).get_json()["data"]
    assert data["programs"] == {"draft": 1, "published": 1, "archived": 0, "total": 2}


# --- JEET seed ------------------------------------------------------------------------------------

def test_seed_jeet_creates_linked_draft_once(program_client):
    notes = seed_jeet()
    assert notes == ["Created JEET Champions as a draft."]

    jeet = db.session.query(Program).filter_by(slug=JEET_SLUG).one()
    assert jeet.publication_status == "draft"
    assert jeet.status == "in_development"
    assert jeet.parent.slug == "ceci"
    assert jeet.lead.slug == "chika-atueyi"
    assert jeet.contact_email == "c.atueyi@sq1ecoafrica.org"
    assert jeet.cta_pending is True and jeet.cta_url is None
    assert [t.slug for t in jeet.themes] == ["renewable-energy-clean-cooking"]
    assert {l.slug for l in jeet.locations} == {"nairobi", "kajiado", "isiolo"}
    assert "+254" not in (jeet.body or "")  # personal phone number is never stored
    assert db.session.query(AuditEvent).filter_by(action="program.seeded").count() == 1

    assert seed_jeet() == ["JEET Champions already exists; nothing changed."]
    assert db.session.query(Program).filter_by(slug=JEET_SLUG).count() == 1


def test_seed_jeet_reports_what_it_could_not_link(app):
    with app.app_context():
        db.create_all()
        notes = seed_jeet()
        assert notes[0] == "Created JEET Champions as a draft."
        assert any("CECI" in n for n in notes)
        assert any("chika-atueyi" in n for n in notes)
        assert any("nairobi" in n for n in notes)
        _drop_all()


def _upload(client, token, tmp_path, kind="image"):
    import io

    from flask import current_app
    from PIL import Image

    current_app.config["UPLOAD_DIR"] = str(tmp_path)
    if kind == "image":
        buffer = io.BytesIO()
        Image.new("RGB", (400, 240), (40, 120, 60)).save(buffer, "JPEG")
        data = {"file": (io.BytesIO(buffer.getvalue()), "cover.jpg"), "alt_text": "Champions at a training session"}
    else:
        data = {"file": (io.BytesIO(b"%PDF-1.4\n%%EOF\n"), "brief.pdf")}
    response = client.post("/api/v1/admin/media", data=data, headers=auth(token), content_type="multipart/form-data")
    assert response.status_code == 201, response.get_json()
    return response.get_json()["data"]["id"]


def test_cover_image_set_shown_and_removed(program_client, admin, tmp_path):
    cover = _upload(program_client, admin, tmp_path)
    ceci = db.session.query(Program).filter_by(slug="ceci").one()

    response = program_client.patch(f"{BASE}/{ceci.id}", json={"cover_image_id": cover}, headers=auth(admin))
    assert response.status_code == 200
    assert response.get_json()["data"]["cover_image"]["id"] == cover

    listed = program_client.get("/api/v1/programs").get_json()["data"][0]
    assert listed["cover_image"]["alt_text"] == "Champions at a training session"
    detail = program_client.get("/api/v1/programs/ceci").get_json()["data"]
    assert detail["cover_image"]["url"].endswith(".jpg") or detail["cover_image"]["url"]

    removed = program_client.patch(f"{BASE}/{ceci.id}", json={"cover_image_id": None}, headers=auth(admin))
    assert removed.get_json()["data"]["cover_image"] is None
    assert program_client.get("/api/v1/programs/ceci").get_json()["data"]["cover_image"] is None


def test_document_cannot_be_a_cover(program_client, admin, tmp_path):
    document = _upload(program_client, admin, tmp_path, kind="document")
    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    response = program_client.patch(f"{BASE}/{ceci.id}", json={"cover_image_id": document}, headers=auth(admin))
    assert response.status_code == 400
    assert "cover_image_id" in response.get_json()["error"]["details"]


def test_public_detail_lists_only_published_partners(program_client, admin):
    db.session.add(Partner(slug="draft-co", name="Draft Co", partner_type="business", publication_status="draft"))
    db.session.commit()
    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    program_client.patch(f"{BASE}/{ceci.id}", json={"partner_slugs": ["mr-green", "draft-co"]}, headers=auth(admin))

    partners = program_client.get("/api/v1/programs/ceci").get_json()["data"]["partners"]
    assert [p["slug"] for p in partners] == ["mr-green"]
    assert {"name", "logo", "website_url"} <= set(partners[0])
