import re
from datetime import datetime, timedelta, timezone

import pytest

from app.extensions import db
from app.models import Story, TeamProfile
from app.seed import seed_demo_data

ISO_UTC = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")

LIST_KEYS = {"id", "slug", "display_name", "first_name", "role_title", "short_role", "role_type", "image", "url"}
DETAIL_KEYS = LIST_KEYS | {"bio", "education", "fun_fact", "email", "social_links", "programs", "stories"}
STORY_REF_KEYS = {"slug", "title", "published_at", "url"}
STORY_LIST_KEYS = {
    "id", "slug", "title", "summary", "published_at", "activity_date", "authors",
    "program", "themes", "locations", "cover_image", "url",
}


@pytest.fixture()
def client(app):
    with app.app_context():
        db.create_all()
        seed_demo_data()
        yield app.test_client()
        db.session.remove()


def slugs(response):
    return [item["slug"] for item in response.get_json()["data"]]


# ---------- GET /team ----------

def test_list_returns_only_published_profiles_in_order(client):
    resp = client.get("/api/v1/team")
    assert resp.status_code == 200
    assert slugs(resp) == ["demo-staff-one", "demo-volunteer-one", "demo-leadership-one"]
    assert resp.get_json()["meta"]["pagination"] == {"page": 1, "per_page": 12, "total": 3, "pages": 1}


def test_list_items_expose_only_allowlisted_fields(client):
    item = client.get("/api/v1/team").get_json()["data"][0]
    assert set(item) == LIST_KEYS
    assert item["url"] == "/team/demo-staff-one"
    assert item["image"] is None


def test_list_never_leaks_hidden_content(client):
    text = client.get("/api/v1/team").get_data(as_text=True)
    assert "[HIDDEN]" not in text


def test_list_pagination(client):
    first = client.get("/api/v1/team?per_page=1&page=1").get_json()
    assert first["meta"]["pagination"] == {"page": 1, "per_page": 1, "total": 3, "pages": 3}
    second = client.get("/api/v1/team?per_page=1&page=2")
    assert slugs(second) == ["demo-volunteer-one"]
    beyond = client.get("/api/v1/team?page=99")
    assert beyond.status_code == 200 and beyond.get_json()["data"] == []


@pytest.mark.parametrize("query, field", [
    ("per_page=1000", "per_page"),
    ("per_page=0", "per_page"),
    ("page=0", "page"),
    ("page=abc", "page"),
    ("role=intern", "role"),
])
def test_list_rejects_invalid_query(client, query, field):
    resp = client.get(f"/api/v1/team?{query}")
    assert resp.status_code == 400
    error = resp.get_json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert field in error["details"]


def test_list_filters_by_role_and_search(client):
    assert slugs(client.get("/api/v1/team?role=volunteer")) == ["demo-volunteer-one"]
    assert slugs(client.get("/api/v1/team?q=governance")) == ["demo-leadership-one"]
    assert slugs(client.get("/api/v1/team?q=DEMO%20STAFF")) == ["demo-staff-one"]  # case-insensitive
    assert client.get("/api/v1/team?q=%25").get_json()["data"] == []  # '%' is literal
    assert client.get("/api/v1/team?q=_").get_json()["data"] == []  # '_' is literal
    assert len(slugs(client.get("/api/v1/team?q="))) == 3  # blank search = no filter


# ---------- GET /team/{slug} ----------

def test_detail_exposes_only_allowlisted_fields(client):
    resp = client.get("/api/v1/team/demo-staff-one")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert set(data) == DETAIL_KEYS
    assert data["social_links"] == [{"platform": "linkedin", "url": "https://www.linkedin.com/in/demo-example"}]
    assert all(set(s) == STORY_REF_KEYS for s in data["stories"])
    assert all(ISO_UTC.match(s["published_at"]) for s in data["stories"])
    assert [s["slug"] for s in data["stories"]] == [
        "demo-public-newest", "demo-public-coauthored", "demo-public-hidden-coauthor",
    ]
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


@pytest.mark.parametrize("slug", ["demo-draft-profile", "demo-archived-profile", "does-not-exist"])
def test_detail_404_for_unpublished_or_unknown(client, slug):
    resp = client.get(f"/api/v1/team/{slug}")
    assert resp.status_code == 404
    assert resp.get_json()["error"]["code"] == "NOT_FOUND"


def test_detail_limits_embedded_stories(client):
    staff = db.session.scalars(db.select(TeamProfile).where(TeamProfile.slug == "demo-staff-one")).one()
    for i in range(8):
        story = Story(slug=f"demo-extra-{i}", title="extra", summary="s", body="b", status="PUBLISHED",
                      published_at=datetime.now(timezone.utc) - timedelta(minutes=i + 1),
                      consent_status="confirmed")
        story.authors.append(staff)
        db.session.add(story)
    db.session.commit()
    data = client.get("/api/v1/team/demo-staff-one").get_json()["data"]
    assert len(data["stories"]) == 5


def test_social_links_are_sanitised_on_output(client):
    staff = db.session.scalars(db.select(TeamProfile).where(TeamProfile.slug == "demo-staff-one")).one()
    staff.social_links = [
        {"platform": "x", "url": "javascript:alert(1)"},
        {"platform": "x", "url": "data:text/html,<script>1</script>"},
        {"platform": "x", "url": "//evil.example/path"},
        {"platform": "x", "url": "https:///no-host"},
        {"platform": "x"},
        "not-a-dict",
        {"platform": "linkedin", "url": "https://www.linkedin.com/in/ok"},
    ]
    db.session.commit()
    links = client.get("/api/v1/team/demo-staff-one").get_json()["data"]["social_links"]
    assert links == [{"platform": "linkedin", "url": "https://www.linkedin.com/in/ok"}]


# ---------- GET /team/{slug}/stories ----------

def test_profile_stories_only_public_ones(client):
    resp = client.get("/api/v1/team/demo-staff-one/stories")
    assert resp.status_code == 200
    assert slugs(resp) == ["demo-public-newest", "demo-public-coauthored", "demo-public-hidden-coauthor"]
    assert resp.get_json()["meta"]["pagination"]["total"] == 3
    assert "[HIDDEN]" not in resp.get_data(as_text=True)


def test_profile_story_items_expose_only_allowlisted_fields(client):
    item = client.get("/api/v1/team/demo-staff-one/stories").get_json()["data"][0]
    assert set(item) == STORY_LIST_KEYS
    assert ISO_UTC.match(item["published_at"])
    assert item["url"] == "/people-stories/demo-public-newest"
    assert item["authors"] == [
        {"slug": "demo-staff-one", "display_name": "Demo Staff One", "profile_url": "/team/demo-staff-one"}
    ]


def test_story_authors_exclude_unpublished_profiles(client):
    items = client.get("/api/v1/team/demo-staff-one/stories").get_json()["data"]
    story = next(i for i in items if i["slug"] == "demo-public-hidden-coauthor")
    assert [a["slug"] for a in story["authors"]] == ["demo-staff-one"]


def test_coauthored_story_appears_under_each_published_author(client):
    volunteer = client.get("/api/v1/team/demo-volunteer-one/stories")
    assert slugs(volunteer) == ["demo-public-coauthored"]
    story = volunteer.get_json()["data"][0]
    # equal sort_order -> deterministic tie-break by display name
    assert [a["slug"] for a in story["authors"]] == ["demo-staff-one", "demo-volunteer-one"]


def test_profile_stories_pagination(client):
    page = client.get("/api/v1/team/demo-staff-one/stories?per_page=2&page=2")
    assert slugs(page) == ["demo-public-hidden-coauthor"]
    assert page.get_json()["meta"]["pagination"] == {"page": 2, "per_page": 2, "total": 3, "pages": 2}
    assert client.get("/api/v1/team/demo-staff-one/stories?per_page=500").status_code == 400


@pytest.mark.parametrize("slug", ["demo-draft-profile", "demo-archived-profile", "nobody"])
def test_profile_stories_404_when_profile_not_public(client, slug):
    # A draft profile has a public-looking story, but its stories must not be reachable.
    resp = client.get(f"/api/v1/team/{slug}/stories")
    assert resp.status_code == 404


def test_profile_with_no_public_stories_returns_empty_list(client):
    resp = client.get("/api/v1/team/demo-leadership-one/stories")
    assert resp.status_code == 200
    assert resp.get_json() == {
        "data": [],
        "meta": {"pagination": {"page": 1, "per_page": 12, "total": 0, "pages": 0}},
    }


def test_profile_detail_shows_the_new_profile_fields(client):
    data = client.get("/api/v1/team/demo-staff-one").get_json()["data"]
    assert (data["first_name"], data["short_role"]) == ("Demo", "Demo role")
    assert data["education"] == "DEMO education." and data["fun_fact"] == "DEMO fun fact."
    assert data["email"] == "demo.staff@example.org"
    assert data["programs"] == [{"slug": "demo-ceci", "title": "Demo Champions Program", "short_name": "DEMO",
                                 "url": "/programs/demo-ceci"}]
    empty = client.get("/api/v1/team/demo-volunteer-one").get_json()["data"]
    assert empty["email"] is None and empty["programs"] == [] and empty["first_name"] is None
