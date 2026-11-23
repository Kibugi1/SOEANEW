import re

import pytest

from app.extensions import db
from app.models import Story, StoryTeamMember, TeamProfile

ISO_UTC = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")

STORY_LIST_KEYS = {"id", "slug", "title", "summary", "published_at", "activity_date", "authors", "program",
                   "themes", "locations", "cover_image", "url", "story_type", "event"}
STORY_DETAIL_KEYS = STORY_LIST_KEYS | {"body", "next_step", "lessons", "outcomes", "video_url", "social_url",
                                       "programs", "phases", "team", "gallery"}

PUBLIC_IN_ORDER = ["demo-public-newest", "demo-draft-profile-story", "demo-public-coauthored",
                   "demo-public-hidden-coauthor"]
HIDDEN = ["demo-hidden-draft", "demo-hidden-in-review", "demo-hidden-changes", "demo-hidden-approved",
          "demo-hidden-scheduled", "demo-hidden-confidential", "demo-hidden-unreviewed",
          "demo-hidden-withdrawn", "demo-hidden-archived"]


def data(resp):
    return resp.get_json()["data"]


def slugs(resp):
    return [item["slug"] for item in data(resp)]


def story(slug):
    return db.session.scalars(db.select(Story).where(Story.slug == slug)).one()


def profile(slug):
    return db.session.scalars(db.select(TeamProfile).where(TeamProfile.slug == slug)).one()


# ---------- GET /stories ----------

def test_story_list_has_only_public_stories_newest_first(demo_client):
    resp = demo_client.get("/api/v1/stories")
    assert resp.status_code == 200
    assert slugs(resp) == PUBLIC_IN_ORDER
    assert resp.get_json()["meta"]["pagination"] == {"page": 1, "per_page": 12, "total": 4, "pages": 1}
    text = resp.get_data(as_text=True)
    assert "[HIDDEN]" not in text and not any(h in text for h in HIDDEN)


def test_story_list_items_expose_only_allowlisted_fields(demo_client):
    item = data(demo_client.get("/api/v1/stories"))[0]
    assert set(item) == STORY_LIST_KEYS
    assert ISO_UTC.match(item["published_at"]) and item["activity_date"] is None
    assert item["program"] == {"slug": "demo-ceci", "title": "Demo Champions Program", "short_name": "DEMO",
                               "url": "/programs/demo-ceci"}
    assert [t["slug"] for t in item["themes"]] == ["demo-circular-economy"]
    assert [l["slug"] for l in item["locations"]] == ["demo-dandora"]
    assert item["cover_image"] is None and item["url"] == "/people-stories/demo-public-newest"


def test_a_story_whose_only_author_is_unpublished_shows_no_authors(demo_client):
    item = next(i for i in data(demo_client.get("/api/v1/stories")) if i["slug"] == "demo-draft-profile-story")
    assert item["authors"] == []


@pytest.mark.parametrize("query, expected", [
    ("program=demo-ceci", PUBLIC_IN_ORDER),
    ("program=demo-hidden-program", []),
    ("program=nope", []),
    ("theme=demo-circular-economy", PUBLIC_IN_ORDER),
    ("theme=demo-energy", []),
    ("theme=demo-hidden-theme", []),
    ("location=demo-dandora", PUBLIC_IN_ORDER),
    ("location=demo-mathare", []),
    ("location=demo-hidden-location", []),
    ("author=demo-staff-one", ["demo-public-newest", "demo-public-coauthored", "demo-public-hidden-coauthor"]),
    ("author=demo-volunteer-one", ["demo-public-coauthored"]),
    ("author=demo-draft-profile", []),        # an unpublished profile matches nothing, revealing nothing
    ("author=demo-archived-profile", []),
    ("author=nope", []),
    ("program=demo-ceci&author=demo-volunteer-one&theme=demo-circular-economy", ["demo-public-coauthored"]),
])
def test_story_filters(demo_client, query, expected):
    assert slugs(demo_client.get(f"/api/v1/stories?{query}")) == expected


def test_story_text_search_is_literal_and_case_insensitive(demo_client):
    assert slugs(demo_client.get("/api/v1/stories?q=CO-AUTHORED")) == ["demo-public-coauthored"]
    assert slugs(demo_client.get("/api/v1/stories?q=unpublished%20co-author")) == ["demo-public-hidden-coauthor"]
    assert data(demo_client.get("/api/v1/stories?q=%25")) == []   # '%' is literal
    assert data(demo_client.get("/api/v1/stories?q=_")) == []     # '_' is literal
    assert len(data(demo_client.get("/api/v1/stories?q="))) == 4  # blank search = no filter
    # Search covers title and summary only, and only public stories: the "[HIDDEN]" titles of
    # non-public stories can never be found this way.
    assert data(demo_client.get("/api/v1/stories?q=hidden")) == []


def test_story_sorting_and_pagination(demo_client):
    assert slugs(demo_client.get("/api/v1/stories?sort=oldest")) == list(reversed(PUBLIC_IN_ORDER))
    assert slugs(demo_client.get("/api/v1/stories?sort=newest")) == PUBLIC_IN_ORDER
    page = demo_client.get("/api/v1/stories?per_page=3&page=2")
    assert slugs(page) == ["demo-public-hidden-coauthor"]
    assert page.get_json()["meta"]["pagination"] == {"page": 2, "per_page": 3, "total": 4, "pages": 2}
    resp = demo_client.get("/api/v1/stories?sort=random")
    assert resp.status_code == 400 and "sort" in resp.get_json()["error"]["details"]


# ---------- GET /stories/{slug} ----------

def test_story_detail_exposes_only_allowlisted_fields(demo_client):
    resp = demo_client.get("/api/v1/stories/demo-public-newest")
    assert resp.status_code == 200
    item = data(resp)
    assert set(item) == STORY_DETAIL_KEYS
    assert item["body"] == "DEMO DATA. Not a real SOEA profile or story. Safe to delete."
    assert item["next_step"] is None and item["video_url"] is None and item["team"] == []
    assert [p["slug"] for p in item["programs"]] == ["demo-ceci"]
    assert [(p["slug"], p["sequence"], p["program"]["slug"]) for p in item["phases"]] == [
        ("demo-phase-1", 1, "demo-ceci")]
    for private in ("review_notes", "consent_status", "is_confidential", "status", "created_at"):
        assert private not in item


@pytest.mark.parametrize("slug", HIDDEN + ["does-not-exist"])
def test_story_detail_404_when_not_public(demo_client, slug):
    resp = demo_client.get(f"/api/v1/stories/{slug}")
    assert resp.status_code == 404 and resp.get_json()["error"]["code"] == "NOT_FOUND"


def test_story_detail_shows_new_content_fields_and_sanitises_urls(demo_client):
    s = story("demo-public-newest")
    s.next_step, s.lessons = "Run the workshop", "Listen first"
    s.outcomes = "Only independently substantiated outcomes"
    s.video_url = "javascript:alert(1)"
    s.social_url = "https://example.org/post/1"
    db.session.commit()
    item = data(demo_client.get("/api/v1/stories/demo-public-newest"))
    assert (item["next_step"], item["lessons"]) == ("Run the workshop", "Listen first")
    assert item["video_url"] is None                          # not an http(s) link: never emitted
    assert item["social_url"] == "https://example.org/post/1"


def test_story_detail_team_lists_published_profiles_with_roles(demo_client):
    s = story("demo-public-newest")
    s.team_members.extend([
        StoryTeamMember(profile=profile("demo-volunteer-one"), role="lead", sort_order=0),
        StoryTeamMember(profile=profile("demo-draft-profile"), role="support", sort_order=1),  # unpublished
    ])
    db.session.commit()
    item = data(demo_client.get("/api/v1/stories/demo-public-newest"))
    assert item["team"] == [{"slug": "demo-volunteer-one", "display_name": "Demo Volunteer One",
                             "role": "lead", "profile_url": "/team/demo-volunteer-one"}]
    assert "[HIDDEN]" not in demo_client.get("/api/v1/stories/demo-public-newest").get_data(as_text=True)


def test_story_detail_hides_unpublished_phase_and_program(demo_client):
    story("demo-public-newest").phases[0].publication_status = "draft"
    db.session.commit()
    assert data(demo_client.get("/api/v1/stories/demo-public-newest"))["phases"] == []


# ---------- team endpoints now include lead / support stories ----------

def test_profile_stories_include_lead_and_support_roles(demo_client):
    before = data(demo_client.get("/api/v1/team/demo-volunteer-one/stories"))
    assert [i["slug"] for i in before] == ["demo-public-coauthored"]
    volunteer = profile("demo-volunteer-one")
    newest, draft = story("demo-public-newest"), story("demo-hidden-draft")  # keep references alive
    newest.team_members.append(StoryTeamMember(profile=volunteer, role="support"))
    draft.team_members.append(StoryTeamMember(profile=volunteer, role="lead"))
    db.session.commit()
    after = data(demo_client.get("/api/v1/team/demo-volunteer-one/stories"))
    assert [i["slug"] for i in after] == ["demo-public-newest", "demo-public-coauthored"]  # draft stays hidden


# ---------- the whole API, in one sweep ----------

def test_no_hidden_content_anywhere(demo_client):
    paths = ["/api/v1/team", "/api/v1/stories", "/api/v1/themes", "/api/v1/locations", "/api/v1/programs"]
    paths += [f"/api/v1/team/{s}" for s in ("demo-staff-one", "demo-volunteer-one", "demo-leadership-one")]
    paths += [f"/api/v1/team/{s}/stories" for s in ("demo-staff-one", "demo-volunteer-one")]
    paths += [f"/api/v1/themes/{s}" for s in ("demo-anchor-theme", "demo-circular-economy", "demo-energy")]
    paths += [f"/api/v1/locations/{s}" for s in ("demo-kenya", "demo-nairobi", "demo-dandora", "demo-mathare", "demo-focus-county")]
    paths += ["/api/v1/programs/demo-ceci", "/api/v1/programs/demo-ceci/timeline"]
    paths += [f"/api/v1/stories/{s}" for s in PUBLIC_IN_ORDER]
    for path in paths:
        resp = demo_client.get(path)
        assert resp.status_code == 200, path
        text = resp.get_data(as_text=True)
        assert "[HIDDEN]" not in text, path
        assert "review_notes" not in text and "consent_status" not in text, path
