import pytest

from app.extensions import db
from app.models import Partner, PartnershipArea


@pytest.fixture()
def client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()


def make_area(slug, **kw):
    base = dict(
        slug=slug,
        name=slug.title(),
        summary="Demo area",
        publication_status="published",
    )
    base.update(kw)
    return PartnershipArea(**base)


def make_partner(slug, **kw):
    base = dict(
        slug=slug,
        name=slug.title(),
        partner_type="community_organization",
        summary="Demo partner",
        publication_status="published",
    )
    base.update(kw)
    return Partner(**base)


def slugs(response):
    return [item["slug"] for item in response.get_json()["data"]]


def test_list_returns_only_published_partners_in_order(client):
    db.session.add_all([
        make_partner("partner-b", sort_order=2),
        make_partner("partner-a", sort_order=1),
        make_partner("partner-draft", publication_status="draft"),
        make_partner("partner-archived", publication_status="archived"),
    ])
    db.session.commit()

    resp = client.get("/api/v1/partners")

    assert resp.status_code == 200
    assert slugs(resp) == ["partner-a", "partner-b"]
    assert resp.get_json()["meta"]["pagination"] == {
        "page": 1,
        "per_page": 12,
        "total": 2,
        "pages": 1,
    }


def test_list_items_expose_only_allowlisted_fields(client):
    db.session.add(make_partner("demo-partner"))
    db.session.commit()

    item = client.get("/api/v1/partners").get_json()["data"][0]

    assert set(item) == {
        "id",
        "slug",
        "name",
        "partner_type",
        "summary",
        "website_url",
        "logo",
        "areas",
        "url",
    }
    assert item["url"] == "/partners/demo-partner"
    assert item["website_url"] is None
    assert item["logo"] is None
    assert item["areas"] == []


def test_list_filters_by_partner_type(client):
    db.session.add_all([
        make_partner("community-partner"),
        make_partner("business-partner", partner_type="business"),
        make_partner("research-partner", partner_type="researcher"),
    ])
    db.session.commit()

    assert slugs(
        client.get("/api/v1/partners?type=business")
    ) == ["business-partner"]

    assert slugs(
        client.get("/api/v1/partners?type=researcher")
    ) == ["research-partner"]


def test_list_rejects_invalid_partner_type(client):
    resp = client.get("/api/v1/partners?type=invalid")

    assert resp.status_code == 400
    error = resp.get_json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert "type" in error["details"]


def test_list_pagination(client):
    db.session.add_all([
        make_partner("partner-a", sort_order=1),
        make_partner("partner-b", sort_order=2),
        make_partner("partner-c", sort_order=3),
    ])
    db.session.commit()

    first = client.get("/api/v1/partners?per_page=2&page=1").get_json()
    second = client.get("/api/v1/partners?per_page=2&page=2")

    assert first["meta"]["pagination"] == {
        "page": 1,
        "per_page": 2,
        "total": 3,
        "pages": 2,
    }
    assert slugs(second) == ["partner-c"]

    beyond = client.get("/api/v1/partners?page=99")
    assert beyond.status_code == 200
    assert beyond.get_json()["data"] == []


@pytest.mark.parametrize("query, field", [
    ("per_page=1000", "per_page"),
    ("per_page=0", "per_page"),
    ("page=0", "page"),
    ("page=abc", "page"),
])
def test_list_rejects_invalid_pagination(client, query, field):
    resp = client.get(f"/api/v1/partners?{query}")

    assert resp.status_code == 400
    error = resp.get_json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert field in error["details"]


def test_list_excludes_unpublished_partnership_areas(client):
    published_area = make_area("education")
    draft_area = make_area("finance", publication_status="draft")

    partner = make_partner("area-partner")
    partner.areas.extend([published_area, draft_area])

    db.session.add(partner)
    db.session.commit()

    item = client.get("/api/v1/partners").get_json()["data"][0]

    assert item["areas"] == [{
        "slug": "education",
        "name": "Education",
        "summary": "Demo area",
    }]


def test_unsafe_partner_website_url_is_not_exposed(client):
    db.session.add_all([
        make_partner("unsafe-partner", website_url="javascript:alert(1)"),
        make_partner("safe-partner", website_url="https://example.org"),
    ])
    db.session.commit()

    items = client.get("/api/v1/partners").get_json()["data"]
    by_slug = {item["slug"]: item for item in items}

    assert by_slug["unsafe-partner"]["website_url"] is None
    assert by_slug["safe-partner"]["website_url"] == "https://example.org"