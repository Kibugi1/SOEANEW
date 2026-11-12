
import pytest

from app.extensions import db
from app.models import MediaAsset, Story, TeamProfile
from app.schemas.story import StoryListSchema
from app.schemas.team import TeamProfileListSchema


@pytest.fixture()
def ctx(app):
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def make_asset(**kw):
    base = dict(
        storage_key="stories/community.jpg",
        original_filename="community.jpg",
        mime_type="image/jpeg",
        file_size=102400,
        alt_text="Community members participating in an activity",
        public_url="https://example.com/community.jpg",
    )
    base.update(kw)
    return MediaAsset(**base)


def test_story_serializes_public_cover_image(ctx):
    asset = make_asset()
    story = Story(
        slug="community-story",
        title="Community Story",
        summary="Summary",
        body="Body",
        cover_image=asset,
    )
    db.session.add(story)
    db.session.commit()

    result = StoryListSchema().dump(story)

    assert result["cover_image"] == {
        "url": "https://example.com/community.jpg",
        "alt_text": "Community members participating in an activity",
    }
    assert "storage_key" not in result["cover_image"]


def test_team_profile_serializes_public_image(ctx):
    asset = make_asset(storage_key="team/profile.jpg")
    profile = TeamProfile(
        slug="jane-doe",
        display_name="Jane Doe",
        role_title="Officer",
        role_type="staff",
        status="published",
        image=asset,
    )
    db.session.add(profile)
    db.session.commit()

    result = TeamProfileListSchema().dump(profile)

    assert result["image"] == {
        "url": "https://example.com/community.jpg",
        "alt_text": "Community members participating in an activity",
    }
    assert "storage_key" not in result["image"]


def test_image_without_public_url_serializes_as_none(ctx):
    asset = make_asset(public_url=None)
    story = Story(
        slug="no-image-story",
        title="No Image",
        summary="Summary",
        body="Body",
        cover_image=asset,
    )
    db.session.add(story)
    db.session.commit()

    result = StoryListSchema().dump(story)

    assert result["cover_image"] is None


@pytest.mark.parametrize(
    "url",
    [
        "javascript:alert(1)",
        "data:image/png;base64,abc",
        "not-a-valid-url",
        "https:///missing-host.jpg",
    ],
)
def test_unsafe_image_url_is_not_exposed(ctx, url):
    asset = make_asset(public_url=url)
    story = Story(
        slug="unsafe-image-story",
        title="Unsafe Image",
        summary="Summary",
        body="Body",
        cover_image=asset,
    )
    db.session.add(story)
    db.session.commit()

    result = StoryListSchema().dump(story)

    assert result["cover_image"] is None
