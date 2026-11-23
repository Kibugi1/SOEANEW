import io

import pytest
from PIL import Image

from app.content_seed import import_past_events
from app.data.past_events import PAST_EVENTS
from app.extensions import db
from app.models import Location, Program, Story, TeamProfile, ThematicArea, UserRole
from app.site_import import import_site_content

from admin_helpers import auth, drop_everything, make_user, token_for


def site_content():
    """A small slice shaped exactly like scripts/export-content.mjs output."""
    return {
        "volunteers": [{
            "slug": "stephanie-ndiritu", "name": "Stephanie Ndiritu", "firstName": "Stephanie",
            "role": "Volunteer Program Officer & Project Lead: CECI", "shortRole": "CECI Lead",
            "bio": "Stephanie coordinates CECI.", "programmeIds": ["ceci-001"],
            "photo": {"src": "/assets/images/team/volunteers/stephanie.jpg", "alt": "Portrait of Stephanie Ndiritu"},
            "education": [], "email": None, "funFact": None,
        }, {
            "slug": "wairimu-maina", "name": "Wairimu Maina", "firstName": "Wairimu", "role": "Volunteer",
            "shortRole": "Volunteer", "bio": "Bio.", "programmeIds": [],
            "photo": {"src": "/assets/images/team/volunteers/wairimu.svg", "alt": "Portrait"},
            "education": [], "email": None, "funFact": None,
        }],
        "boardMembers": [{
            "id": "rozalia-wangui-karanja", "name": "Rozalia Wangui Karanja",
            "title": "Board Chairperson & Founder", "bio": "Founder.", "photo": None,
        }],
        "programmes": [{
            "id": "ceci-001", "slug": "ceci", "title": "Community Environmental Champions Initiative",
            "shortName": "CECI", "summary": "Developing community champions.", "description": "d",
            "status": "in_development", "visibility": "published", "startDate": "2026-10-01",
            "endDate": None, "location": ["Dandora", "Mathare"],
            "thematicAreas": ["Circular Economy & Waste Management"], "featured": True,
        }],
        "ceci": {
            "programme": {"introduction": "Intro.", "purpose": "Purpose."},
            "learningAreas": ["Community leadership"],
            "pathways": [{"title": "Glass Recovery & Upcycling", "description": "Glass."}],
            "phases": [
                {"number": "00", "title": "Community Grounding & Mobilisation", "period": "Completed",
                 "status": "completed", "description": "Grounding.", "evidence": "Super Day."},
                {"number": "01", "title": "Curriculum Development & Partnerships",
                 "period": "October 2026 – March 2027", "status": "current", "description": "Curriculum.",
                 "evidence": "30 champions."},
            ],
            "leadership": {"name": "Stephanie Ndiritu"},
        },
        "focusAreas": [{"slug": "circular-economy", "title": "Circular Economy & Waste Management",
                        "description": "Waste.", "peopleServed": ["Waste pickers"]}],
        "focusAnchor": {"title": "Rural to Urban Sustainable Development", "description": "Anchor."},
        "whereWeWork": {
            "coordinationHub": {"name": "Nairobi County", "description": "Hub."},
            "communityLocations": [{"id": "dandora", "name": "Dandora", "description": "D."},
                                   {"id": "mathare", "name": "Mathare", "description": "M."}],
            "geographicFocus": ["Tana River", "Isiolo"],
        },
        "stories": [{
            "slug": "ceci-community-grounding", "title": "Community grounding", "date": None,
            "programmeId": "ceci-001", "community": ["Dandora", "Mathare"],
            "phase": "Community Grounding & Mobilisation", "linkedTeamIds": [],
            "summary": "Baseline in Dandora and Mathare.", "nextStep": "Publish the report.", "socialUrl": None,
        }],
    }


@pytest.fixture()
def ctx(app, tmp_path):
    app.config["UPLOAD_DIR"] = str(tmp_path / "uploads")
    public = tmp_path / "public"
    (public / "assets/images/team/volunteers").mkdir(parents=True)
    photo = io.BytesIO()
    Image.new("RGB", (30, 40), (100, 50, 20)).save(photo, "JPEG")
    (public / "assets/images/team/volunteers/stephanie.jpg").write_bytes(photo.getvalue())
    (public / "assets/images/team/volunteers/wairimu.svg").write_text("<svg/>")
    with app.app_context():
        db.create_all()
        yield public
        drop_everything()


def test_import_creates_published_site_content(ctx, client):
    created, notes = import_site_content(site_content(), ctx)

    assert created == {"themes": 2, "places": 6, "profiles": 3, "images": 1, "programs": 1, "stories": 1}
    assert any("wairimu.svg" in note for note in notes)  # SVG portraits are refused

    ceci = db.session.query(Program).filter_by(slug="ceci").one()
    assert ceci.publication_status == "published" and ceci.status == "in_development"
    assert ceci.lead.slug == "stephanie-ndiritu"
    assert [t.slug for t in ceci.themes] == ["circular-economy"]
    assert {l.slug for l in ceci.locations} == {"dandora", "mathare"}
    assert [p.sequence for p in ceci.phases] == [0, 1]
    assert [p.status for p in ceci.phases] == ["completed", "in_progress"]
    assert ceci.phases[0].milestones[0].title == "Waste Pickers Super Day"
    assert {t.track_type for t in ceci.tracks} == {"core", "specialized"}

    stephanie = db.session.query(TeamProfile).filter_by(slug="stephanie-ndiritu").one()
    assert stephanie.image is not None and stephanie.image.alt_text == "Portrait of Stephanie Ndiritu"
    assert [p.slug for p in stephanie.programs] == ["ceci"]
    board = db.session.query(TeamProfile).filter_by(slug="rozalia-wangui-karanja").one()
    assert board.role_type == "leadership"

    nairobi = db.session.query(Location).filter_by(slug="nairobi").one()
    assert nairobi.is_coordination_hub and nairobi.engagement_status == "active"
    assert db.session.query(Location).filter_by(slug="tana-river").one().engagement_status == "focus_only"
    assert db.session.query(ThematicArea).filter_by(is_anchor=True).one().slug == "rural-urban-sustainable-development"

    # The public API serves the imported content.
    program = client.get("/api/v1/programs/ceci").get_json()["data"]
    assert program["lead"]["display_name"] == "Stephanie Ndiritu"
    story = client.get("/api/v1/stories/ceci-community-grounding").get_json()["data"]
    assert [p["title"] for p in story["phases"]] == ["Community Grounding & Mobilisation"]


def test_import_is_safe_to_rerun_and_keeps_edits(ctx):
    import_site_content(site_content(), ctx)
    db.session.query(TeamProfile).filter_by(slug="stephanie-ndiritu").update({"bio": "Edited in dashboard."})
    db.session.commit()

    created, _ = import_site_content(site_content(), ctx)
    assert created == {}
    assert db.session.query(TeamProfile).filter_by(slug="stephanie-ndiritu").one().bio == "Edited in dashboard."


# --- Past events -------------------------------------------------------------------------------

def test_past_events_arrive_in_review_queue_linked(ctx, client):
    import_site_content(site_content(), ctx)
    created, notes = import_past_events()

    assert created == len(PAST_EVENTS) == 19
    events = db.session.query(Story).filter_by(story_type="event").all()
    assert {e.status for e in events} == {"IN_REVIEW"}
    assert db.session.query(Story).filter_by(status="PUBLISHED", story_type="event").count() == 0

    super_day = db.session.query(Story).filter_by(slug="waste-pickers-super-day-2026").one()
    assert super_day.event_role == "hosted"
    assert str(super_day.activity_date) == "2026-10-10"
    assert [p.slug for p in super_day.programs] == ["ceci"]
    assert [p.slug for p in super_day.phases] == ["phase-0"]
    assert "Overlaps the existing story" in super_day.review_notes

    icpac = db.session.query(Story).filter_by(slug="icpac-climate-vulnerability-youth-advocacy-workshop").one()
    assert (str(icpac.activity_date), str(icpac.event_end_date)) == ("2026-10-05", "2026-10-07")
    assert [(m.profile.slug, m.role) for m in icpac.team_members] == [("stephanie-ndiritu", "lead")]

    # The slice has no JEET program, so links that cannot be made are reported, not invented.
    assert any("jeet-champions" in note for note in notes)
    assert import_past_events() == (0, [])


def test_imported_events_never_carry_fundraising_links_or_hashtags():
    for event in PAST_EVENTS:
        text = " ".join(str(event[k] or "") for k in ("summary", "body", "lessons", "next_step"))
        assert "lnkd.in" not in text and "M-Changa" not in text and "#" not in text, event["slug"]
        assert len(event["summary"]) <= 1000
        assert event["role"] in ("hosted", "participated", "media", "meeting")


def test_undated_event_cannot_be_approved_until_dated(ctx, app):
    import_site_content(site_content(), ctx)
    import_past_events()
    make_user("rozalia@example.org", UserRole.ADMIN)
    client = app.test_client()
    token = token_for(client, "rozalia@example.org")

    undated = db.session.query(Story).filter_by(slug="agyle-6th-cohort-berlin").one()
    assert "DATE TO CONFIRM" in undated.review_notes
    response = client.post(f"/api/v1/admin/stories/{undated.id}/approve", headers=auth(token))
    assert response.status_code == 400
    assert "activity_date" in response.get_json()["error"]["details"]

    client.patch(f"/api/v1/admin/stories/{undated.id}", json={"activity_date": "2026-09-15"}, headers=auth(token))
    assert client.post(f"/api/v1/admin/stories/{undated.id}/approve", headers=auth(token)).status_code == 200
    assert client.get("/api/v1/stories/agyle-6th-cohort-berlin").status_code == 200
