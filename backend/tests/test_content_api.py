import re

import pytest

from app.extensions import db
from app.models import Location, Program, TeamProfile, ThematicArea

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

THEME_KEYS = {"id", "slug", "name", "summary", "people_served", "is_anchor", "url"}
LOCATION_KEYS = {"id", "slug", "name", "location_type", "summary", "engagement_status",
                 "is_coordination_hub", "parent", "url"}
PROGRAM_KEYS = {"id", "slug", "title", "short_name", "summary", "status", "is_featured",
                "themes", "locations", "url", "parent", "cover_image"}
PROGRAM_DETAIL_KEYS = PROGRAM_KEYS | {"body", "start_date", "end_date", "phases", "learning_areas",
                                      "specialized_pathways", "people", "stories",
                                      "lead", "contact_email", "cta", "sub_programs", "partners"}
PHASE_KEYS = {"slug", "sequence", "title", "summary", "period_label", "start_date", "end_date", "status"}
MILESTONE_KEYS = {"slug", "title", "summary", "occurred_on", "venue", "status"}
TRACK_KEYS = {"id", "slug", "title", "track_type", "summary", "intended_skills", "practical_activity",
              "safety_requirements", "status", "themes"}
STORY_REF_KEYS = {"slug", "title", "published_at", "url"}


def data(resp):
    return resp.get_json()["data"]


def slugs(resp):
    return [item["slug"] for item in data(resp)]


def pagination(resp):
    return resp.get_json()["meta"]["pagination"]


# ---------- pagination validation (shared by every list endpoint) ----------

@pytest.mark.parametrize("path", ["/api/v1/themes", "/api/v1/locations", "/api/v1/programs", "/api/v1/stories"])
@pytest.mark.parametrize("query, field", [("per_page=1000", "per_page"), ("page=0", "page"), ("page=abc", "page")])
def test_lists_reject_bad_pagination(demo_client, path, query, field):
    resp = demo_client.get(f"{path}?{query}")
    assert resp.status_code == 400
    assert field in resp.get_json()["error"]["details"]


# ---------- /themes ----------

def test_themes_list_published_only_anchor_first(demo_client):
    resp = demo_client.get("/api/v1/themes")
    assert resp.status_code == 200
    assert slugs(resp) == ["demo-anchor-theme", "demo-circular-economy", "demo-energy"]
    assert pagination(resp) == {"page": 1, "per_page": 12, "total": 3, "pages": 1}
    first = data(resp)[0]
    assert set(first) == THEME_KEYS
    assert first["is_anchor"] is True and first["url"] == "/our-focus/demo-anchor-theme"
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_theme_detail_links_programs_tracks_and_stories(demo_client):
    resp = demo_client.get("/api/v1/themes/demo-circular-economy")
    assert resp.status_code == 200
    item = data(resp)
    assert set(item) == THEME_KEYS | {"programs", "tracks", "stories"}
    assert [p["slug"] for p in item["programs"]] == ["demo-ceci"]
    assert [t["slug"] for t in item["tracks"]] == ["demo-textiles"]       # the hidden track is excluded
    assert set(item["tracks"][0]) == TRACK_KEYS
    assert len(item["stories"]) == 4 and all(set(s) == STORY_REF_KEYS for s in item["stories"])
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_theme_without_tracks_has_an_empty_list(demo_client):
    item = data(demo_client.get("/api/v1/themes/demo-energy"))
    assert item["tracks"] == [] and [p["slug"] for p in item["programs"]] == ["demo-ceci"]


@pytest.mark.parametrize("slug", ["demo-hidden-theme", "nope"])
def test_theme_detail_404_when_not_public(demo_client, slug):
    resp = demo_client.get(f"/api/v1/themes/{slug}")
    assert resp.status_code == 404 and resp.get_json()["error"]["code"] == "NOT_FOUND"


# ---------- /locations ----------

def test_locations_list_published_only_in_order(demo_client):
    resp = demo_client.get("/api/v1/locations")
    assert slugs(resp) == ["demo-kenya", "demo-nairobi", "demo-dandora", "demo-mathare", "demo-focus-county"]
    assert all(set(item) == LOCATION_KEYS for item in data(resp))
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_locations_show_parent_and_activity_status(demo_client):
    by_slug = {i["slug"]: i for i in data(demo_client.get("/api/v1/locations"))}
    assert by_slug["demo-kenya"]["parent"] is None
    assert by_slug["demo-dandora"]["parent"] == {
        "slug": "demo-nairobi", "name": "Demo Nairobi County", "url": "/where-we-work/demo-nairobi"}
    assert by_slug["demo-nairobi"]["is_coordination_hub"] is True
    assert by_slug["demo-dandora"]["engagement_status"] == "active"
    assert by_slug["demo-focus-county"]["engagement_status"] == "focus_only"  # no activity claim


def test_locations_filter_by_type(demo_client):
    assert slugs(demo_client.get("/api/v1/locations?type=community")) == ["demo-dandora", "demo-mathare"]
    assert slugs(demo_client.get("/api/v1/locations?type=country")) == ["demo-kenya"]
    resp = demo_client.get("/api/v1/locations?type=village")
    assert resp.status_code == 400 and "type" in resp.get_json()["error"]["details"]


def test_location_detail_children_programs_and_stories(demo_client):
    nairobi = data(demo_client.get("/api/v1/locations/demo-nairobi"))
    assert set(nairobi) == LOCATION_KEYS | {"children", "programs", "stories"}
    assert [c["slug"] for c in nairobi["children"]] == ["demo-dandora", "demo-mathare"]
    assert [p["slug"] for p in nairobi["programs"]] == ["demo-ceci"]

    dandora = data(demo_client.get("/api/v1/locations/demo-dandora"))
    assert len(dandora["stories"]) == 4 and dandora["children"] == []

    kenya = data(demo_client.get("/api/v1/locations/demo-kenya"))
    assert [c["slug"] for c in kenya["children"]] == ["demo-nairobi", "demo-focus-county"]  # hidden one excluded


def test_a_focus_only_place_has_no_programs_or_stories(demo_client):
    focus = data(demo_client.get("/api/v1/locations/demo-focus-county"))
    assert focus["programs"] == [] and focus["stories"] == []


def test_unpublished_parent_is_hidden_from_children(demo_client):
    nairobi = db.session.scalars(db.select(Location).where(Location.slug == "demo-nairobi")).one()
    nairobi.publication_status = "draft"
    db.session.commit()
    assert "demo-nairobi" not in slugs(demo_client.get("/api/v1/locations"))
    assert demo_client.get("/api/v1/locations/demo-nairobi").status_code == 404
    dandora = data(demo_client.get("/api/v1/locations/demo-dandora"))
    assert dandora["parent"] is None  # the unpublished parent is not revealed
    kenya = data(demo_client.get("/api/v1/locations/demo-kenya"))
    assert [c["slug"] for c in kenya["children"]] == ["demo-focus-county"]


@pytest.mark.parametrize("slug", ["demo-hidden-location", "nope"])
def test_location_detail_404_when_not_public(demo_client, slug):
    assert demo_client.get(f"/api/v1/locations/{slug}").status_code == 404


# ---------- /programs ----------

def test_programs_list_published_only_with_published_links_only(demo_client):
    resp = demo_client.get("/api/v1/programs")
    assert slugs(resp) == ["demo-ceci"]
    item = data(resp)[0]
    assert set(item) == PROGRAM_KEYS
    assert item["status"] == "in_progress" and item["is_featured"] is True and item["short_name"] == "DEMO"
    assert [t["slug"] for t in item["themes"]] == ["demo-circular-economy", "demo-energy"]  # hidden theme excluded
    assert [l["slug"] for l in item["locations"]] == ["demo-nairobi", "demo-dandora", "demo-mathare"]
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


@pytest.mark.parametrize("query, expected", [
    ("theme=demo-circular-economy", ["demo-ceci"]),
    ("theme=demo-hidden-theme", []),          # linked, but the theme itself is unpublished
    ("theme=nope", []),
    ("location=demo-dandora", ["demo-ceci"]),
    ("location=demo-hidden-location", []),
    ("featured=true", ["demo-ceci"]),
    ("featured=false", []),
    ("theme=demo-energy&location=demo-mathare&featured=1", ["demo-ceci"]),
])
def test_programs_filters(demo_client, query, expected):
    assert slugs(demo_client.get(f"/api/v1/programs?{query}")) == expected


def test_programs_reject_bad_filter_value(demo_client):
    resp = demo_client.get("/api/v1/programs?featured=maybe")
    assert resp.status_code == 400 and "featured" in resp.get_json()["error"]["details"]


def test_program_detail_composition(demo_client):
    resp = demo_client.get("/api/v1/programs/demo-ceci")
    assert resp.status_code == 200
    item = data(resp)
    assert set(item) == PROGRAM_DETAIL_KEYS
    assert [p["slug"] for p in item["phases"]] == ["demo-phase-0", "demo-phase-1", "demo-phase-2"]
    assert [p["status"] for p in item["phases"]] == ["completed", "in_progress", "planned"]
    assert all(set(p) == PHASE_KEYS for p in item["phases"])
    assert [t["slug"] for t in item["learning_areas"]] == ["demo-core-leadership"]
    assert [t["slug"] for t in item["specialized_pathways"]] == ["demo-textiles"]  # hidden track excluded
    assert all(set(t) == TRACK_KEYS for t in item["learning_areas"] + item["specialized_pathways"])
    assert [p["slug"] for p in item["people"]] == ["demo-staff-one"]               # draft profile excluded
    assert len(item["stories"]) == 4
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_program_detail_404_when_not_public(demo_client):
    for path in ("demo-hidden-program", "nope"):
        assert demo_client.get(f"/api/v1/programs/{path}").status_code == 404
        assert demo_client.get(f"/api/v1/programs/{path}/timeline").status_code == 404


def test_program_timeline_has_phases_with_milestones(demo_client):
    resp = demo_client.get("/api/v1/programs/demo-ceci/timeline")
    assert resp.status_code == 200
    timeline = data(resp)
    assert [p["slug"] for p in timeline] == ["demo-phase-0", "demo-phase-1", "demo-phase-2"]
    assert all(set(p) == PHASE_KEYS | {"milestones"} for p in timeline)
    first = timeline[0]["milestones"]
    assert [m["slug"] for m in first] == ["demo-community-day"]                    # draft milestone excluded
    assert set(first[0]) == MILESTONE_KEYS and ISO_DATE.match(first[0]["occurred_on"])
    assert timeline[1]["milestones"] == [] and timeline[2]["milestones"] == []
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_unverified_dates_stay_null(demo_client):
    phase = data(demo_client.get("/api/v1/programs/demo-ceci/timeline"))[1]
    assert phase["start_date"] is None and phase["end_date"] is None and phase["period_label"] == "DEMO period"


def test_an_unpublished_phase_or_program_disappears(demo_client):
    program = db.session.scalars(db.select(Program).where(Program.slug == "demo-ceci")).one()
    program.phases[1].publication_status = "draft"
    db.session.commit()
    assert [p["slug"] for p in data(demo_client.get("/api/v1/programs/demo-ceci/timeline"))] == [
        "demo-phase-0", "demo-phase-2"]
    program.publication_status = "draft"
    db.session.commit()
    assert demo_client.get("/api/v1/programs").get_json()["data"] == []
    assert demo_client.get("/api/v1/programs/demo-ceci/timeline").status_code == 404
    assert demo_client.get("/api/v1/themes/demo-circular-economy").get_json()["data"]["programs"] == []
