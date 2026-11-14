from app.models import SocialPost


def test_social_post_model_registration():
    assert SocialPost.__tablename__ == "social_post"


def test_social_post_required_fields():
    required = {
        "platform",
        "post_url",
        "sort_order",
        "publication_status",
    }
    assert required.issubset(SocialPost.__table__.columns.keys())


def test_social_post_optional_fields():
    optional = {"title", "caption", "thumbnail_url"}
    assert optional.issubset(SocialPost.__table__.columns.keys())


def test_social_post_has_platform_constraint():
    constraints = [
        constraint.name
        for constraint in SocialPost.__table__.constraints
    ]
    assert "ck_social_post_platform" in constraints


def test_social_post_has_publication_constraint():
    constraints = [
        constraint.name
        for constraint in SocialPost.__table__.constraints
    ]
    assert "ck_social_post_publication_status" in constraints
