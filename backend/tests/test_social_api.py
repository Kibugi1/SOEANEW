import pytest

from app.extensions import db
from app.models import SocialPost


@pytest.fixture()
def social_client(app):
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def make_social_post(platform, post_url, **kwargs):
    values = {
        "platform": platform,
        "title": f"{platform.title()} post",
        "caption": "A public SOEA update",
        "post_url": post_url,
        "thumbnail_url": "https://example.com/image.jpg",
        "sort_order": 0,
        "publication_status": "published",
    }
    values.update(kwargs)
    return SocialPost(**values)


def get_items(response):
    return response.get_json()["data"]


def get_platforms(response):
    return [item["platform"] for item in get_items(response)]


def test_list_returns_only_published_social_posts(social_client):
    db.session.add_all([
        make_social_post("facebook", "https://facebook.com/post/1"),
        make_social_post("instagram", "https://instagram.com/p/1"),
        make_social_post(
            "linkedin",
            "https://linkedin.com/post/1",
            publication_status="draft",
        ),
        make_social_post(
            "youtube",
            "https://youtube.com/watch?v=1",
            publication_status="archived",
        ),
    ])
    db.session.commit()

    response = social_client.get("/api/v1/social-posts")

    assert response.status_code == 200
    assert set(get_platforms(response)) == {"facebook", "instagram"}
    assert response.get_json()["meta"]["pagination"] == {
        "page": 1,
        "per_page": 12,
        "total": 2,
        "pages": 1,
    }


def test_social_post_exposes_only_allowlisted_fields(social_client):
    db.session.add(
        make_social_post("facebook", "https://facebook.com/post/1")
    )
    db.session.commit()

    response = social_client.get("/api/v1/social-posts")
    item = get_items(response)[0]

    assert set(item) == {
        "id",
        "platform",
        "title",
        "caption",
        "post_url",
        "thumbnail_url",
        "created_at",
    }
    assert item["platform"] == "facebook"
    assert item["post_url"] == "https://facebook.com/post/1"
    assert item["thumbnail_url"] == "https://example.com/image.jpg"
    assert item["created_at"] is not None
    assert "publication_status" not in item
    assert "sort_order" not in item


def test_social_posts_filter_by_platform(social_client):
    db.session.add_all([
        make_social_post("facebook", "https://facebook.com/post/1"),
        make_social_post("instagram", "https://instagram.com/p/1"),
        make_social_post("linkedin", "https://linkedin.com/post/1"),
    ])
    db.session.commit()

    response = social_client.get("/api/v1/social-posts?platform=instagram")

    assert response.status_code == 200
    assert get_platforms(response) == ["instagram"]
    assert response.get_json()["meta"]["pagination"]["total"] == 1


def test_social_posts_reject_invalid_platform(social_client):
    response = social_client.get("/api/v1/social-posts?platform=invalid")

    assert response.status_code == 400
    assert "platform" in response.get_json()["error"]["details"]


def test_social_posts_support_pagination(social_client):
    db.session.add_all([
        make_social_post("facebook", "https://facebook.com/post/1"),
        make_social_post("instagram", "https://instagram.com/p/1"),
        make_social_post("linkedin", "https://linkedin.com/post/1"),
    ])
    db.session.commit()

    response = social_client.get("/api/v1/social-posts?page=1&per_page=2")

    assert response.status_code == 200
    assert len(get_items(response)) == 2
    assert response.get_json()["meta"]["pagination"] == {
        "page": 1,
        "per_page": 2,
        "total": 3,
        "pages": 2,
    }


def test_social_posts_follow_sort_order(social_client):
    db.session.add_all([
        make_social_post(
            "instagram",
            "https://instagram.com/p/2",
            sort_order=2,
        ),
        make_social_post(
            "facebook",
            "https://facebook.com/post/1",
            sort_order=1,
        ),
        make_social_post(
            "linkedin",
            "https://linkedin.com/post/3",
            sort_order=3,
        ),
    ])
    db.session.commit()

    response = social_client.get("/api/v1/social-posts")

    assert response.status_code == 200
    assert get_platforms(response) == ["facebook", "instagram", "linkedin"]


def test_social_posts_sanitize_unsafe_urls(social_client):
    db.session.add(
        make_social_post(
            "facebook",
            "javascript:alert(1)",
            thumbnail_url="data:text/html,unsafe",
        )
    )
    db.session.commit()

    response = social_client.get("/api/v1/social-posts")
    item = get_items(response)[0]

    assert response.status_code == 200
    assert item["post_url"] is None
    assert item["thumbnail_url"] is None


@pytest.mark.parametrize("per_page", ["0", "51", "invalid"])
def test_social_posts_reject_invalid_pagination(social_client, per_page):
    response = social_client.get(
        f"/api/v1/social-posts?per_page={per_page}"
    )

    assert response.status_code == 400
