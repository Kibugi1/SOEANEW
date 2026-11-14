from datetime import date, datetime, timezone

import pytest

from app.extensions import db
from app.models import Location, MediaAsset, Phase, Program, Resource, Story


@pytest.fixture()
def resource_client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def make_program(slug="demo-program", **kwargs):
    values = {
        "slug": slug,
        "title": slug.title(),
        "summary": "Demo program",
        "publication_status": "published",
    }
    values.update(kwargs)
    return Program(**values)


def make_location(slug="demo-location", **kwargs):
    values = {
        "slug": slug,
        "name": slug.title(),
        "location_type": "community",
        "publication_status": "published",
    }
    values.update(kwargs)
    return Location(**values)


def make_resource(slug, **kwargs):
    values = {
        "slug": slug,
        "title": slug.title(),
        "resource_type": "report",
        "summary": "A demo resource",
        "publication_status": "published",
        "published_on": date(2026, 10, 15),
    }
    values.update(kwargs)
    return Resource(**values)


def make_story(slug, **kwargs):
    values = {
        "slug": slug,
        "title": slug.title(),
        "summary": "A public story",
        "body": "Story content",
        "status": "PUBLISHED",
        "published_at": datetime.now(timezone.utc),
        "consent_status": "confirmed",
        "is_confidential": False,
    }
    values.update(kwargs)
    return Story(**values)


def get_items(response):
    return response.get_json()["data"]


def get_slugs(response):
    return [item["slug"] for item in get_items(response)]


def test_list_returns_only_published_resources(resource_client):
    db.session.add_all([
        make_resource("resource-a"),
        make_resource("resource-b"),
        make_resource("resource-draft", publication_status="draft"),
        make_resource("resource-archived", publication_status="archived"),
    ])
    db.session.commit()

    response = resource_client.get("/api/v1/resources")

    assert response.status_code == 200
    assert get_slugs(response) == ["resource-a", "resource-b"]
    assert response.get_json()["meta"]["pagination"] == {
        "page": 1,
        "per_page": 12,
        "total": 2,
        "pages": 1,
    }


def test_resource_exposes_only_allowlisted_fields(resource_client):
    db.session.add(make_resource("demo-report"))
    db.session.commit()

    response = resource_client.get("/api/v1/resources")
    item = get_items(response)[0]

    assert set(item) == {
        "id",
        "slug",
        "title",
        "resource_type",
        "summary",
        "plain_language_summary",
        "published_on",
        "document_url",
        "program",
        "location",
        "phase",
        "cover_image",
        "stories",
        "url",
    }
    assert item["url"] == "/resources/demo-report"
    assert item["document_url"] is None
    assert item["program"] is None
    assert item["location"] is None
    assert item["phase"] is None
    assert item["cover_image"] is None
    assert item["stories"] == []


@pytest.mark.parametrize(
    "query, expected",
    [
        ("type=report", ["report-resource"]),
        ("type=guide", ["guide-resource"]),
        ("date_from=2026-10-15", ["guide-resource", "report-resource"]),
        ("date_to=2026-10-15", ["guide-resource", "report-resource", "older-resource"]),
        ("date_from=2026-10-16", []),
    ],
)
def test_resource_type_and_date_filters(resource_client, query, expected):
    db.session.add_all([
        make_resource("report-resource", resource_type="report"),
        make_resource(
            "guide-resource",
            resource_type="guide",
            published_on=date(2026, 10, 15),
        ),
        make_resource(
            "older-resource",
            resource_type="other",
            published_on=date(2026, 10, 14),
        ),
    ])
    db.session.commit()

    assert get_slugs(
        resource_client.get(f"/api/v1/resources?{query}")
    ) == expected


def test_resource_rejects_invalid_filters_and_date_ranges(resource_client):
    for query, field in [
        ("type=invalid", "type"),
        ("date_from=2026-11-01&date_to=2026-10-01", "date_to"),
        ("date_from=not-a-date", "date_from"),
    ]:
        response = resource_client.get(f"/api/v1/resources?{query}")

        assert response.status_code == 400
        assert field in response.get_json()["error"]["details"]


def test_resource_filters_by_published_program_location_and_phase(resource_client):
    program = make_program()
    location = make_location()
    phase = Phase(
        program=program,
        sequence=1,
        slug="demo-phase",
        title="Demo Phase",
        publication_status="published",
    )

    resource = make_resource(
        "linked-resource",
        program=program,
        location=location,
        phase=phase,
    )

    db.session.add(resource)
    db.session.commit()

    for query in [
        "program=demo-program",
        "location=demo-location",
        "phase=demo-phase",
    ]:
        response = resource_client.get(f"/api/v1/resources?{query}")
        assert response.status_code == 200
        assert get_slugs(response) == ["linked-resource"]

    assert get_slugs(
        resource_client.get("/api/v1/resources?program=missing")
    ) == []


def test_resource_does_not_expose_unpublished_related_entities(resource_client):
    program = make_program(publication_status="draft")
    location = make_location(publication_status="draft")
    phase = Phase(
        program=program,
        sequence=1,
        slug="hidden-phase",
        title="Hidden Phase",
        publication_status="published",
    )

    resource = make_resource(
        "linked-resource",
        program=program,
        location=location,
        phase=phase,
    )

    db.session.add(resource)
    db.session.commit()

    response = resource_client.get("/api/v1/resources")
    item = get_items(response)[0]

    assert item["program"] is None
    assert item["location"] is None
    assert item["phase"] is None

    assert get_slugs(
        resource_client.get("/api/v1/resources?program=demo-program")
    ) == []

    assert get_slugs(
        resource_client.get("/api/v1/resources?phase=hidden-phase")
    ) == []


def test_resource_embeds_only_public_consent_cleared_stories(resource_client):
    resource = make_resource("story-resource")

    stories = [
        make_story("public-story"),
        make_story("draft-story", status="DRAFT", published_at=None),
        make_story("confidential-story", is_confidential=True),
        make_story("unreviewed-story", consent_status="unreviewed"),
        make_story("withdrawn-story", consent_status="withdrawn"),
    ]

    resource.stories.extend(stories)
    db.session.add(resource)
    db.session.commit()

    response = resource_client.get("/api/v1/resources")
    item = get_items(response)[0]

    assert [story["slug"] for story in item["stories"]] == ["public-story"]


def test_resource_sanitizes_unsafe_document_and_image_urls(resource_client):
    unsafe_image = MediaAsset(
        storage_key="unsafe-image",
        original_filename="unsafe.jpg",
        mime_type="image/jpeg",
        file_size=100,
        public_url="javascript:alert(1)",
    )

    safe_image = MediaAsset(
        storage_key="safe-image",
        original_filename="safe.jpg",
        mime_type="image/jpeg",
        file_size=100,
        public_url="https://example.org/image.jpg",
        alt_text="A community activity",
    )

    unsafe_resource = make_resource(
        "unsafe-resource",
        document_url="javascript:alert(1)",
        cover_image=unsafe_image,
    )

    safe_resource = make_resource(
        "safe-resource",
        document_url="https://example.org/report.pdf",
        cover_image=safe_image,
    )

    db.session.add_all([unsafe_resource, safe_resource])
    db.session.commit()

    items = {
        item["slug"]: item
        for item in get_items(resource_client.get("/api/v1/resources"))
    }

    assert items["unsafe-resource"]["document_url"] is None
    assert items["unsafe-resource"]["cover_image"] is None

    assert items["safe-resource"]["document_url"] == "https://example.org/report.pdf"
    assert items["safe-resource"]["cover_image"] == {
        "url": "https://example.org/image.jpg",
        "alt_text": "A community activity",
    }


def test_resource_pagination(resource_client):
    db.session.add_all([
        make_resource("resource-a"),
        make_resource("resource-b"),
        make_resource("resource-c"),
    ])
    db.session.commit()

    first = resource_client.get(
        "/api/v1/resources?per_page=2&page=1"
    ).get_json()

    second = resource_client.get(
        "/api/v1/resources?per_page=2&page=2"
    )

    assert first["meta"]["pagination"] == {
        "page": 1,
        "per_page": 2,
        "total": 3,
        "pages": 2,
    }
    assert len(first["data"]) == 2
    assert len(get_items(second)) == 1

    assert resource_client.get(
        "/api/v1/resources?per_page=1000"
    ).status_code == 400
