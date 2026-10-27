from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    Story,
    TeamProfile,
    public_profiles,
    public_stories,
    public_stories_for_profile,
)

NOW = datetime.now(timezone.utc)


def make_profile(slug, **kw):
    base = dict(slug=slug, display_name=slug.title(), role_title="Officer",
                role_type="staff", status="published")
    base.update(kw)
    return TeamProfile(**base)


def make_story(slug, **kw):
    base = dict(slug=slug, title=slug, summary="s", body="b", status="PUBLISHED",
                published_at=NOW - timedelta(days=1), consent_status="confirmed")
    base.update(kw)
    return Story(**base)


@pytest.fixture()
def ctx(app):
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def test_public_gate_returns_only_public_stories_in_order(ctx):
    ann = make_profile("ann")
    newer = make_story("newer", published_at=NOW - timedelta(hours=1))
    older = make_story("older", published_at=NOW - timedelta(days=5), consent_status="not_required")
    hidden = [
        make_story("draft", status="DRAFT", published_at=None),
        make_story("in-review", status="IN_REVIEW", published_at=None),
        make_story("changes", status="CHANGES_REQUESTED", published_at=None),
        make_story("approved", status="APPROVED", published_at=None),
        make_story("scheduled", published_at=NOW + timedelta(days=3)),
        make_story("confidential", is_confidential=True),
        make_story("unreviewed", consent_status="unreviewed"),
        make_story("withdrawn", consent_status="withdrawn"),
        make_story("archived", status="ARCHIVED"),
    ]
    everything = [newer, older, *hidden]
    for story in everything:
        story.authors.append(ann)
    db.session.add_all([ann, *everything])
    db.session.commit()

    assert [s.slug for s in db.session.scalars(public_stories())] == ["newer", "older"]
    assert [s.slug for s in db.session.scalars(public_stories_for_profile(ann.id))] == ["newer", "older"]
    assert len(ann.stories) == len(everything)  # the raw relationship is unfiltered


def test_profile_slice_only_shows_that_profiles_public_stories(ctx):
    ann, ben = make_profile("ann"), make_profile("ben")
    ann_story = make_story("ann-story")
    ben_story = make_story("ben-story")
    ann_draft = make_story("ann-draft", status="DRAFT", published_at=None)
    ann_story.authors.append(ann)
    ann_draft.authors.append(ann)
    ben_story.authors.append(ben)
    db.session.add_all([ann, ben, ann_story, ben_story, ann_draft])
    db.session.commit()

    assert [s.slug for s in db.session.scalars(public_stories_for_profile(ann.id))] == ["ann-story"]


def test_co_authored_story_keeps_author_order(ctx):
    ann, ben = make_profile("ann"), make_profile("ben")
    story = make_story("joint")
    db.session.add_all([ann, ben, story])
    db.session.flush()
    db.session.execute(
        db.insert(db.metadata.tables["story_authors"]),
        [
            {"story_id": story.id, "profile_id": ben.id, "sort_order": 0},
            {"story_id": story.id, "profile_id": ann.id, "sort_order": 1},
        ],
    )
    db.session.commit()
    db.session.refresh(story)
    assert [a.slug for a in story.authors] == ["ben", "ann"]


def test_public_profiles_only_published_and_sorted(ctx):
    db.session.add_all([
        make_profile("zed", sort_order=1),
        make_profile("amy", sort_order=1),
        make_profile("first", sort_order=0),
        make_profile("hidden-draft", status="draft"),
        make_profile("hidden-archived", status="archived"),
    ])
    db.session.commit()
    assert [p.slug for p in db.session.scalars(public_profiles())] == ["first", "amy", "zed"]


@pytest.mark.parametrize("bad", [
    dict(status="LIVE"),
    dict(consent_status="maybe"),
    dict(status="PUBLISHED", published_at=None),  # published needs a date
])
def test_story_check_constraints(ctx, bad):
    db.session.add(make_story("bad", **bad))
    with pytest.raises(IntegrityError):
        db.session.commit()


def test_profile_check_constraints(ctx):
    db.session.add(make_profile("bad", role_type="intern"))
    with pytest.raises(IntegrityError):
        db.session.commit()


def test_slugs_are_unique(ctx):
    db.session.add_all([make_story("dup"), make_story("dup")])
    with pytest.raises(IntegrityError):
        db.session.commit()


def test_profile_with_stories_cannot_be_deleted(ctx):
    ann = make_profile("ann")
    story = make_story("s1")
    story.authors.append(ann)
    db.session.add_all([ann, story])
    db.session.commit()

    with pytest.raises(IntegrityError):  # ORM delete path
        db.session.delete(ann)
        db.session.commit()
    db.session.rollback()

    with pytest.raises(IntegrityError):  # raw SQL path
        db.session.execute(delete(TeamProfile))
        db.session.commit()


def test_deleting_a_story_removes_only_the_link(ctx):
    ann = make_profile("ann")
    story = make_story("s1")
    story.authors.append(ann)
    db.session.add_all([ann, story])
    db.session.commit()

    db.session.delete(story)
    db.session.commit()
    assert db.session.get(TeamProfile, ann.id) is not None
