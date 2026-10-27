from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import delete, func, insert, select
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    Location,
    Phase,
    Program,
    Story,
    StoryTeamMember,
    TeamProfile,
    ThematicArea,
    profile_programs,
    public_stories_for_location,
    public_stories_for_phase,
    public_stories_for_profile,
    public_stories_for_program,
    public_stories_for_theme,
    public_story_by_slug,
    story_authors,
    story_locations,
    story_phases,
    story_programs,
    story_themes,
)

NOW = datetime.now(timezone.utc)


# ---------- builders ----------

def make_profile(slug="ann", **kw):
    base = dict(slug=slug, display_name=slug.title(), role_title="Volunteer", role_type="volunteer",
                status="published")
    base.update(kw)
    return TeamProfile(**base)


def make_story(slug="s1", **kw):
    base = dict(slug=slug, title=slug, summary="s", body="b", status="PUBLISHED",
                published_at=NOW - timedelta(days=1), consent_status="confirmed")
    base.update(kw)
    return Story(**base)


def make_program(slug="ceci", **kw):
    base = dict(slug=slug, title=slug.upper(), summary="s", publication_status="published")
    base.update(kw)
    return Program(**base)


def make_phase(program, sequence=1, **kw):
    base = dict(program=program, sequence=sequence, slug=f"phase-{sequence}", title=f"Phase {sequence}",
                publication_status="published")
    base.update(kw)
    return Phase(**base)


def make_location(slug="dandora", **kw):
    base = dict(slug=slug, name=slug.title(), location_type="community", publication_status="published")
    base.update(kw)
    return Location(**base)


def make_theme(slug="circular", **kw):
    base = dict(slug=slug, name=slug.title(), summary="s", publication_status="published")
    base.update(kw)
    return ThematicArea(**base)


@pytest.fixture()
def ctx(app):
    # Each test gets a brand-new in-memory database, so nothing needs dropping afterwards.
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def slugs(statement):
    return [row.slug for row in db.session.scalars(statement)]


def tagged_story(**story_kw):
    """A story tagged for every view: author, lead, support, program, phase, place, theme."""
    author, lead, support = make_profile("author"), make_profile("lead"), make_profile("support")
    program = make_program()
    phase = make_phase(program)
    place, theme = make_location(), make_theme()
    story = make_story(**story_kw)
    story.authors.append(author)
    story.team_members.extend([
        StoryTeamMember(profile=lead, role="lead", sort_order=0),
        StoryTeamMember(profile=support, role="support", sort_order=1),
    ])
    story.programs.append(program)
    story.phases.append(phase)
    story.locations.append(place)
    story.themes.append(theme)
    db.session.add_all([author, lead, support, program, phase, place, theme, story])
    db.session.commit()
    return story, dict(author=author, lead=lead, support=support, program=program, phase=phase,
                       place=place, theme=theme)


def all_views(e):
    return {
        "author": public_stories_for_profile(e["author"].id),
        "lead": public_stories_for_profile(e["lead"].id),
        "support": public_stories_for_profile(e["support"].id),
        "program": public_stories_for_program(e["program"].id),
        "phase": public_stories_for_phase(e["phase"].id),
        "place": public_stories_for_location(e["place"].id),
        "theme": public_stories_for_theme(e["theme"].id),
    }


# ---------- new story and profile fields ----------

def test_story_summary_fits_a_100_word_summary_and_new_fields_are_optional(ctx):
    summary = " ".join(["community"] * 100)  # 100 long words = 999 characters, still within the limit
    assert len(summary) <= 1000
    story, plain = make_story(summary=summary), make_story("plain")
    db.session.add_all([story, plain])
    db.session.commit()
    assert db.session.get(Story, story.id).summary == summary
    for field in ("activity_date", "next_step", "lessons", "outcomes", "video_url", "social_url"):
        assert getattr(plain, field) is None


def test_story_stores_the_activity_date_separately_from_publication(ctx):
    story = make_story(activity_date=date(2026, 10, 10), next_step="Curriculum workshop",
                       lessons="Start with listening", social_url="https://example.org/post/1")
    db.session.add(story)
    db.session.commit()
    saved = db.session.get(Story, story.id)
    assert saved.activity_date == date(2026, 10, 10)
    assert saved.published_at is not None and saved.next_step == "Curriculum workshop"


def test_profile_new_fields_round_trip_and_default_to_empty(ctx):
    plain = make_profile("plain")
    rich = make_profile("rich", first_name="Rich", short_role="ICT Volunteer", education="BSc (approved)",
                        fun_fact="Likes tea", public_email="rich@example.org")
    db.session.add_all([plain, rich])
    db.session.commit()
    for field in ("first_name", "short_role", "education", "fun_fact", "public_email"):
        assert getattr(plain, field) is None
    assert db.session.get(TeamProfile, rich.id).short_role == "ICT Volunteer"


# ---------- one update, many views ----------

def test_one_published_story_appears_in_every_connected_view(ctx):
    story, entities = tagged_story()
    for name, statement in all_views(entities).items():
        assert slugs(statement) == [story.slug], f"missing from the {name} view"
    assert slugs(public_story_by_slug(story.slug)) == [story.slug]


@pytest.mark.parametrize("overrides", [
    dict(status="DRAFT", published_at=None),
    dict(status="IN_REVIEW", published_at=None),
    dict(published_at=NOW + timedelta(days=3)),
    dict(is_confidential=True),
    dict(consent_status="unreviewed"),
    dict(consent_status="withdrawn"),
    dict(status="ARCHIVED"),
])
def test_a_non_public_story_is_invisible_in_every_view(ctx, overrides):
    story, entities = tagged_story(**overrides)
    for name, statement in all_views(entities).items():
        assert slugs(statement) == [], f"leaked into the {name} view"
    assert slugs(public_story_by_slug(story.slug)) == []


def test_an_unpublished_parent_hides_only_its_own_view(ctx):
    story, e = tagged_story()
    e["program"].publication_status = "draft"
    e["theme"].publication_status = "archived"
    db.session.commit()
    assert slugs(public_stories_for_program(e["program"].id)) == []
    assert slugs(public_stories_for_phase(e["phase"].id)) == []   # its program is no longer public
    assert slugs(public_stories_for_theme(e["theme"].id)) == []
    assert slugs(public_stories_for_location(e["place"].id)) == [story.slug]  # unaffected
    assert slugs(public_stories_for_profile(e["author"].id)) == [story.slug]


def test_an_unpublished_phase_hides_the_phase_view(ctx):
    story, e = tagged_story()
    e["phase"].publication_status = "draft"
    db.session.commit()
    assert slugs(public_stories_for_phase(e["phase"].id)) == []
    assert slugs(public_stories_for_program(e["program"].id)) == [story.slug]


def test_profile_view_unions_authored_and_team_stories_without_duplicates(ctx):
    ann = make_profile("ann")
    authored = make_story("authored", published_at=NOW - timedelta(days=5))
    led = make_story("led", published_at=NOW - timedelta(days=4))
    supported = make_story("supported", published_at=NOW - timedelta(days=3))
    both = make_story("both", published_at=NOW - timedelta(days=2))
    hidden = make_story("hidden-draft", status="DRAFT", published_at=None)
    other = make_story("someone-elses", published_at=NOW - timedelta(days=1))
    authored.authors.append(ann)
    led.team_members.append(StoryTeamMember(profile=ann, role="lead"))
    supported.team_members.append(StoryTeamMember(profile=ann, role="support"))
    both.authors.append(ann)
    both.team_members.append(StoryTeamMember(profile=ann, role="lead"))
    hidden.team_members.append(StoryTeamMember(profile=ann, role="lead"))
    db.session.add_all([ann, authored, led, supported, both, hidden, other])
    db.session.commit()
    assert slugs(public_stories_for_profile(ann.id)) == ["both", "supported", "led", "authored"]


def test_a_story_in_several_programs_shows_under_each(ctx):
    one, two = make_program("one"), make_program("two")
    story = make_story("shared")
    story.programs.extend([one, two])
    db.session.add_all([one, two, story])
    db.session.commit()
    assert slugs(public_stories_for_program(one.id)) == ["shared"]
    assert slugs(public_stories_for_program(two.id)) == ["shared"]


# ---------- team roles ----------

def test_team_role_and_primary_key_rules(ctx):
    ann, story = make_profile("ann"), make_story()
    db.session.add_all([ann, story])
    db.session.commit()

    db.session.add(StoryTeamMember(story_id=story.id, profile_id=ann.id, role="owner"))
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()

    db.session.add(StoryTeamMember(story_id=story.id, profile_id=ann.id, role="lead"))
    db.session.commit()
    db.session.add(StoryTeamMember(story_id=story.id, profile_id=ann.id, role="support"))  # same pair again
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_team_members_are_ordered(ctx):
    story = make_story()
    zed, amy = make_profile("zed"), make_profile("amy")
    story.team_members.extend([
        StoryTeamMember(profile=zed, role="support", sort_order=1),
        StoryTeamMember(profile=amy, role="lead", sort_order=0),
    ])
    db.session.add_all([story, zed, amy])
    db.session.commit()
    db.session.refresh(story)
    assert [m.profile.slug for m in story.team_members] == ["amy", "zed"]


# ---------- delete rules ----------

LINK_TABLES = (story_authors, story_programs, story_phases, story_locations, story_themes)


def count(table):
    return db.session.scalar(select(func.count()).select_from(table))


def test_deleting_a_story_removes_its_links_but_nothing_else(ctx):
    story, e = tagged_story()
    db.session.delete(story)
    db.session.commit()
    assert all(count(t) == 0 for t in LINK_TABLES)
    assert count(StoryTeamMember) == 0
    for key in ("author", "lead", "support", "program", "phase", "place", "theme"):
        assert db.session.get(type(e[key]), e[key].id) is not None


@pytest.mark.parametrize("key", ["author", "lead", "support", "program", "phase", "place", "theme"])
def test_anything_a_story_points_at_cannot_be_deleted(ctx, key):
    _, e = tagged_story()
    target = e[key]
    with pytest.raises(IntegrityError):  # ORM path
        db.session.delete(target)
        db.session.commit()
    db.session.rollback()
    with pytest.raises(IntegrityError):  # raw SQL path
        db.session.execute(delete(type(target)).where(type(target).id == target.id))
        db.session.commit()
    db.session.rollback()


# ---------- profile <-> programs ----------

def test_profile_programs_link_and_delete_rules(ctx):
    ann, ceci = make_profile("ann"), make_program()
    ann.programs.append(ceci)
    db.session.add_all([ann, ceci])
    db.session.commit()
    assert [p.slug for p in db.session.get(TeamProfile, ann.id).programs] == ["ceci"]

    with pytest.raises(IntegrityError):  # a program someone supports cannot be deleted
        db.session.delete(ceci)
        db.session.commit()
    db.session.rollback()

    db.session.delete(ann)  # a profile with no stories can go, taking only its program links
    db.session.commit()
    assert count(profile_programs) == 0
    assert db.session.get(Program, ceci.id) is not None
