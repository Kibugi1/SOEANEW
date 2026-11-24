import io
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from PIL import Image

from app.extensions import db
from app.models import AuditEvent, Location, Program, Story, User, UserRole

from admin_helpers import auth, make_profile, make_user, token_for

BASE = "/api/v1/admin/stories"


@pytest.fixture()
def story_client(app, tmp_path):
    app.config["UPLOAD_DIR"] = str(tmp_path)
    with app.app_context():
        db.create_all()
        rozalia_profile = make_profile("rozalia-wangui-karanja", "Rozalia Wangui Karanja")
        stephanie_profile = make_profile("stephanie-ndiritu", "Stephanie Ndiritu")
        make_profile("nahshon-omollo", "Nahshon Omollo")
        make_user("rozalia@example.org", UserRole.ADMIN, profile=rozalia_profile, name="Rozalia")
        make_user("editor@example.org", UserRole.EDITOR, name="Editor")
        make_user("stephanie@example.org", UserRole.AUTHOR, profile=stephanie_profile, name="Stephanie")
        make_user("other@example.org", UserRole.AUTHOR, name="Other")
        db.session.add_all([
            Program(slug="ceci", title="CECI", short_name="CECI", summary="s", publication_status="published"),
            Location(slug="dandora", name="Dandora", location_type="community", publication_status="published"),
        ])
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def sent(monkeypatch):
    outbox = []

    def fake_send(to, subject, body, reply_to=None):
        outbox.append({"to": to if isinstance(to, list) else [to], "subject": subject})
        return True

    monkeypatch.setattr("app.services.notifications.send_email", fake_send)
    return outbox


def tokens(client):
    return {name: token_for(client, f"{name}@example.org")
            for name in ("rozalia", "editor", "stephanie", "other")}


def ready_story(**overrides):
    payload = {
        "title": "What waste pickers told us at ICPAC",
        "summary": "Lessons from the ICPAC workshop for CECI.",
        "body": "Stephanie shares three lessons from the workshop.",
        "consent_status": "not_required",
        "program_slugs": ["ceci"],
        "location_slugs": ["dandora"],
    }
    payload.update(overrides)
    return payload


def upload_photo(client, token, alt="Participants at the workshop"):
    buffer = io.BytesIO()
    Image.new("RGB", (40, 30), (10, 90, 40)).save(buffer, "JPEG")
    data = {"file": (io.BytesIO(buffer.getvalue()), "photo.jpg")}
    if alt is not None:
        data["alt_text"] = alt
    response = client.post("/api/v1/admin/media", data=data, headers=auth(token),
                           content_type="multipart/form-data")
    return response.get_json()["data"]["id"]


def create(client, token, **overrides):
    response = client.post(BASE, json=ready_story(**overrides), headers=auth(token))
    assert response.status_code == 201, response.get_json()
    return response.get_json()["data"]


# --- Writing ------------------------------------------------------------------------------------

def test_author_writes_draft_bylined_to_their_profile(story_client):
    t = tokens(story_client)
    data = create(story_client, t["stephanie"])

    assert data["status"] == "DRAFT"
    assert data["slug"] == "what-waste-pickers-told-us-at-icpac"
    assert [a["slug"] for a in data["authors"]] == ["stephanie-ndiritu"]
    assert data["created_by"]["full_name"] == "Stephanie"
    assert data["permissions"] == {
        "edit": True, "submit": True, "approve": False, "request_changes": False,
        "unpublish": False, "delete": True,
    }
    # Drafts never reach the public site.
    assert story_client.get("/api/v1/stories").get_json()["data"] == []


def test_authors_only_see_their_own_stories(story_client):
    t = tokens(story_client)
    mine = create(story_client, t["stephanie"])
    create(story_client, t["other"], title="Someone else's story")

    listed = story_client.get(BASE, headers=auth(t["stephanie"])).get_json()["data"]
    assert [s["id"] for s in listed] == [mine["id"]]
    assert story_client.get(f"{BASE}/{mine['id']}", headers=auth(t["other"])).status_code == 404
    assert story_client.patch(f"{BASE}/{mine['id']}", json={"title": "x"},
                              headers=auth(t["other"])).status_code == 404

    everything = story_client.get(BASE, headers=auth(t["editor"])).get_json()
    assert everything["meta"]["pagination"]["total"] == 2
    only_mine = story_client.get(f"{BASE}?mine=true", headers=auth(t["rozalia"])).get_json()
    assert only_mine["meta"]["pagination"]["total"] == 0


def test_authors_cannot_set_byline_or_confidentiality(story_client):
    t = tokens(story_client)
    for field, value in (("author_slugs", ["nahshon-omollo"]), ("is_confidential", True)):
        response = story_client.post(BASE, json=ready_story(**{field: value}), headers=auth(t["stephanie"]))
        assert response.status_code == 400
        assert field in response.get_json()["error"]["details"]


@pytest.mark.parametrize("overrides, field", [
    ({"program_slugs": ["nope"]}, "program_slugs"),
    ({"phase_refs": ["ceci/phase-9"]}, "phase_refs"),
    ({"team": [{"slug": "nobody", "role": "lead"}]}, "team"),
    ({"story_type": "rumour"}, "story_type"),
    ({"video_url": "javascript:alert(1)"}, "video_url"),
    ({"story_type": "event", "activity_date": "2026-10-07", "event_end_date": "2026-10-05"}, "event_end_date"),
])
def test_write_validation(story_client, overrides, field):
    t = tokens(story_client)
    response = story_client.post(BASE, json=ready_story(**overrides), headers=auth(t["editor"]))
    assert response.status_code == 400
    assert field in response.get_json()["error"]["details"]
    assert db.session.query(Story).count() == 0


def test_gallery_uses_only_own_uploads_for_authors(story_client):
    t = tokens(story_client)
    theirs = upload_photo(story_client, t["other"])
    mine = upload_photo(story_client, t["stephanie"])

    rejected = story_client.post(BASE, json=ready_story(gallery=[{"media_id": theirs}]),
                                 headers=auth(t["stephanie"]))
    assert rejected.status_code == 400

    data = create(story_client, t["stephanie"], gallery=[{"media_id": mine, "caption": "Day one"}],
                  cover_image_id=mine)
    assert data["gallery"][0]["caption"] == "Day one"
    assert data["cover_image"]["id"] == mine


# --- Review -------------------------------------------------------------------------------------

def test_full_review_cycle(story_client, sent):
    t = tokens(story_client)
    story_id = create(story_client, t["stephanie"])["id"]

    submitted = story_client.post(f"{BASE}/{story_id}/submit", headers=auth(t["stephanie"]))
    assert submitted.status_code == 200
    assert submitted.get_json()["data"]["status"] == "IN_REVIEW"
    assert sent[-1]["to"] == ["rozalia@example.org"]
    assert "waiting for review" in sent[-1]["subject"]

    # While in review, the author can no longer edit it.
    assert story_client.patch(f"{BASE}/{story_id}", json={"title": "x"},
                              headers=auth(t["stephanie"])).status_code == 403
    # Editors cannot approve.
    assert story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["editor"])).status_code == 403

    sent_back = story_client.post(f"{BASE}/{story_id}/request-changes",
                                  json={"notes": "Please add the workshop dates."}, headers=auth(t["rozalia"]))
    assert sent_back.get_json()["data"]["status"] == "CHANGES_REQUESTED"
    assert sent_back.get_json()["data"]["review_notes"] == "Please add the workshop dates."
    assert sent[-1]["to"] == ["stephanie@example.org"]

    assert story_client.patch(f"{BASE}/{story_id}", json={"activity_date": "2026-10-05"},
                              headers=auth(t["stephanie"])).status_code == 200
    story_client.post(f"{BASE}/{story_id}/submit", headers=auth(t["stephanie"]))

    approved = story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"]))
    data = approved.get_json()["data"]
    assert data["status"] == "PUBLISHED"
    assert data["reviewed_by"]["full_name"] == "Rozalia"
    assert "is live" in sent[-1]["subject"]

    # Public: on People & Stories, on Stephanie's profile, and on CECI.
    public = story_client.get("/api/v1/stories").get_json()["data"]
    assert [s["slug"] for s in public] == ["what-waste-pickers-told-us-at-icpac"]
    on_profile = story_client.get("/api/v1/team/stephanie-ndiritu/stories").get_json()["data"]
    assert [s["slug"] for s in on_profile] == ["what-waste-pickers-told-us-at-icpac"]
    on_program = story_client.get("/api/v1/stories?program=ceci").get_json()["data"]
    assert len(on_program) == 1

    actions = [e.action for e in db.session.query(AuditEvent).filter(AuditEvent.action.like("story.%"))]
    assert actions == ["story.created", "story.submitted", "story.changes_requested",
                       "story.updated", "story.submitted", "story.approved"]


def test_submit_requires_consent_and_event_details(story_client):
    t = tokens(story_client)
    unreviewed = create(story_client, t["stephanie"], consent_status="unreviewed")["id"]
    response = story_client.post(f"{BASE}/{unreviewed}/submit", headers=auth(t["stephanie"]))
    assert response.status_code == 400
    assert "consent_status" in response.get_json()["error"]["details"]

    event = create(story_client, t["stephanie"], title="ICPAC workshop", story_type="event")["id"]
    details = story_client.post(f"{BASE}/{event}/submit",
                                headers=auth(t["stephanie"])).get_json()["error"]["details"]
    assert {"activity_date", "event_role"} <= set(details)


def test_photos_need_alt_text_before_review(story_client):
    t = tokens(story_client)
    photo = upload_photo(story_client, t["stephanie"], alt=None)
    story_id = create(story_client, t["stephanie"], gallery=[{"media_id": photo}])["id"]
    response = story_client.post(f"{BASE}/{story_id}/submit", headers=auth(t["stephanie"]))
    assert response.status_code == 400
    assert "gallery" in response.get_json()["error"]["details"]


def test_admin_publishes_own_story_directly(story_client, sent):
    t = tokens(story_client)
    story_id = create(story_client, t["rozalia"], title="A note from the founder")["id"]

    response = story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"]))
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "PUBLISHED"
    assert sent == []  # nobody to notify about her own story
    on_profile = story_client.get("/api/v1/team/rozalia-wangui-karanja/stories").get_json()["data"]
    assert len(on_profile) == 1


def test_admin_cannot_skip_review_for_someone_elses_draft(story_client):
    t = tokens(story_client)
    story_id = create(story_client, t["stephanie"])["id"]
    assert story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"])).status_code == 409


def test_scheduled_publication(story_client, sent):
    t = tokens(story_client)
    story_id = create(story_client, t["stephanie"])["id"]
    story_client.post(f"{BASE}/{story_id}/submit", headers=auth(t["stephanie"]))

    later = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    response = story_client.post(f"{BASE}/{story_id}/approve", json={"publish_at": later},
                                 headers=auth(t["rozalia"]))
    assert response.get_json()["data"]["status"] == "PUBLISHED"
    assert "scheduled" in sent[-1]["subject"]
    assert story_client.get("/api/v1/stories").get_json()["data"] == []  # not yet

    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    other = create(story_client, t["rozalia"], title="Past")["id"]
    assert story_client.post(f"{BASE}/{other}/approve", json={"publish_at": past},
                             headers=auth(t["rozalia"])).status_code == 400


def test_unpublish_reopen_and_delete_rules(story_client):
    t = tokens(story_client)
    story_id = create(story_client, t["rozalia"])["id"]
    story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"]))

    assert story_client.delete(f"{BASE}/{story_id}", headers=auth(t["rozalia"])).status_code == 403
    unpublished = story_client.post(f"{BASE}/{story_id}/unpublish", headers=auth(t["rozalia"]))
    assert unpublished.get_json()["data"]["status"] == "ARCHIVED"
    assert story_client.get("/api/v1/stories").get_json()["data"] == []

    reopened = story_client.post(f"{BASE}/{story_id}/reopen", headers=auth(t["rozalia"]))
    assert reopened.get_json()["data"]["status"] == "DRAFT"
    assert story_client.delete(f"{BASE}/{story_id}", headers=auth(t["rozalia"])).status_code == 204

    draft = create(story_client, t["stephanie"])["id"]
    story_client.post(f"{BASE}/{draft}/submit", headers=auth(t["stephanie"]))
    assert story_client.delete(f"{BASE}/{draft}", headers=auth(t["stephanie"])).status_code == 403


def test_admin_edits_live_story_but_must_keep_it_publishable(story_client):
    t = tokens(story_client)
    story_id = create(story_client, t["rozalia"])["id"]
    story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"]))

    assert story_client.patch(f"{BASE}/{story_id}", json={"title": "Better title"},
                              headers=auth(t["rozalia"])).status_code == 200
    assert story_client.patch(f"{BASE}/{story_id}", json={"consent_status": "withdrawn"},
                              headers=auth(t["rozalia"])).status_code == 400
    assert story_client.patch(f"{BASE}/{story_id}", json={"title": "x"},
                              headers=auth(t["editor"])).status_code == 403


# --- Events and the public API -------------------------------------------------------------------

def test_published_event_shows_event_fields_gallery_and_team(story_client):
    t = tokens(story_client)
    photo = upload_photo(story_client, t["rozalia"])
    story_id = create(
        story_client, t["rozalia"],
        title="ICPAC workshop on climate vulnerability",
        story_type="event", activity_date="2026-10-05", event_end_date="2026-10-07",
        venue="Nairobi", organiser="IGAD ICPAC", event_role="participated",
        team=[{"slug": "stephanie-ndiritu", "role": "lead"}],
        gallery=[{"media_id": photo, "caption": "Workshop session"}],
    )["id"]
    story_client.post(f"{BASE}/{story_id}/approve", headers=auth(t["rozalia"]))

    events = story_client.get("/api/v1/stories?type=event").get_json()["data"]
    assert events[0]["story_type"] == "event"
    assert events[0]["event"] == {"start_date": "2026-10-05", "end_date": "2026-10-07",
                                  "venue": "Nairobi", "organiser": "IGAD ICPAC", "role": "participated"}
    assert story_client.get("/api/v1/stories?type=story").get_json()["data"] == []

    detail = story_client.get(f"/api/v1/stories/{events[0]['slug']}").get_json()["data"]
    assert detail["gallery"][0]["caption"] == "Workshop session"
    assert detail["gallery"][0]["alt_text"] == "Participants at the workshop"
    assert [m["slug"] for m in detail["team"]] == ["stephanie-ndiritu"]
    # She led it, so it shows on her profile even though Rozalia wrote it.
    on_profile = story_client.get("/api/v1/team/stephanie-ndiritu/stories").get_json()["data"]
    assert len(on_profile) == 1


def test_event_fields_are_cleared_on_ordinary_stories(story_client):
    t = tokens(story_client)
    data = create(story_client, t["editor"], venue="Somewhere", event_role="hosted")
    assert data["venue"] is None and data["event_role"] is None


def test_photo_in_a_gallery_cannot_be_deleted(story_client):
    t = tokens(story_client)
    photo = upload_photo(story_client, t["stephanie"])
    create(story_client, t["stephanie"], gallery=[{"media_id": photo}])
    assert story_client.delete(f"/api/v1/admin/media/{photo}", headers=auth(t["stephanie"])).status_code == 409


def test_dashboard_counts_stories_for_author_and_admin(story_client):
    t = tokens(story_client)
    story_id = create(story_client, t["stephanie"])["id"]
    story_client.post(f"{BASE}/{story_id}/submit", headers=auth(t["stephanie"]))
    create(story_client, t["other"])  # no linked profile; still counted for its writer

    mine = story_client.get("/api/v1/admin/dashboard", headers=auth(t["stephanie"])).get_json()["data"]
    assert mine["my_stories"]["IN_REVIEW"] == 1
    other = story_client.get("/api/v1/admin/dashboard", headers=auth(t["other"])).get_json()["data"]
    assert other["my_stories"]["DRAFT"] == 1
    admin = story_client.get("/api/v1/admin/dashboard", headers=auth(t["rozalia"])).get_json()["data"]
    assert admin["stories_awaiting_review"] == 1


def test_options_for_pickers_are_available_to_authors(story_client):
    t = tokens(story_client)
    db.session.add(Program(slug="jeet", title="JEET Champions", short_name="JEET", summary="s",
                           publication_status="draft"))
    db.session.commit()
    data = story_client.get("/api/v1/admin/options", headers=auth(t["stephanie"])).get_json()["data"]

    assert {p["slug"] for p in data["programs"]} == {"ceci", "jeet"}  # drafts included
    assert "stephanie-ndiritu" in {p["slug"] for p in data["profiles"]}
    assert [p["slug"] for p in data["places"]] == ["dandora"]
    assert set(data) == {"profiles", "programs", "themes", "places"}
    assert story_client.get("/api/v1/admin/options").status_code == 401


def test_dashboard_editor_payload_shapes(story_client):
    """The exact shapes StoryEditor.tsx sends: empty optional text as null, empty
    summary/body omitted, event fields null on stories, approve with no schedule."""
    t = tokens(story_client)
    first_save = {
        "story_type": "story", "title": "Quick draft", "activity_date": None, "event_end_date": None,
        "venue": None, "organiser": None, "event_role": None, "lessons": None, "next_step": None,
        "outcomes": None, "video_url": None, "social_url": None, "consent_status": "unreviewed",
        "team": [], "program_slugs": [], "phase_refs": [], "theme_slugs": [], "location_slugs": [],
        "gallery": [], "cover_image_id": None,
    }
    created = story_client.post(BASE, json=first_save, headers=auth(t["stephanie"]))
    assert created.status_code == 201, created.get_json()
    story_id = created.get_json()["data"]["id"]

    later_save = {**first_save, "summary": "Short summary.", "body": "Full text.",
                  "consent_status": "not_required", "team": [{"slug": "stephanie-ndiritu", "role": "lead"}]}
    assert story_client.patch(f"{BASE}/{story_id}", json=later_save, headers=auth(t["stephanie"])).status_code == 200
    assert story_client.post(f"{BASE}/{story_id}/submit", json={}, headers=auth(t["stephanie"])).status_code == 200

    approved = story_client.post(f"{BASE}/{story_id}/approve", json={"publish_at": None, "notes": None},
                                 headers=auth(t["rozalia"]))
    assert approved.status_code == 200, approved.get_json()

    manager_save = {**later_save, "is_confidential": False, "author_slugs": ["stephanie-ndiritu"]}
    assert story_client.patch(f"{BASE}/{story_id}", json=manager_save, headers=auth(t["rozalia"])).status_code == 200
