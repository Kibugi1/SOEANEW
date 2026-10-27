from datetime import date

import pytest
from sqlalchemy import delete, func, insert, select
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    Location,
    Milestone,
    Phase,
    Program,
    ThematicArea,
    TrainingTrack,
    program_locations,
    program_themes,
    public_location_by_slug,
    public_locations,
    public_milestones,
    public_phases,
    public_program_by_slug,
    public_programs,
    public_theme_by_slug,
    public_themes,
    public_tracks,
    track_themes,
)


# ---------- builders ----------

def make_theme(slug="circular", **kw):
    base = dict(slug=slug, name=slug.title(), summary="s", publication_status="published")
    base.update(kw)
    return ThematicArea(**base)


def make_location(slug="nairobi", **kw):
    base = dict(slug=slug, name=slug.title(), location_type="county", publication_status="published")
    base.update(kw)
    return Location(**base)


def make_program(slug="ceci", **kw):
    base = dict(slug=slug, title=slug.upper(), summary="s", status="in_progress", publication_status="published")
    base.update(kw)
    return Program(**base)


def make_phase(program, sequence=0, slug=None, **kw):
    base = dict(program=program, sequence=sequence, slug=slug or f"phase-{sequence}", title=f"Phase {sequence}",
                status="planned", publication_status="published")
    base.update(kw)
    return Phase(**base)


def make_milestone(phase, slug="m1", **kw):
    base = dict(phase=phase, slug=slug, title=slug, status="completed", publication_status="published")
    base.update(kw)
    return Milestone(**base)


def make_track(program, slug="textiles", **kw):
    base = dict(program=program, slug=slug, title=slug.title(), publication_status="published")
    base.update(kw)
    return TrainingTrack(**base)


@pytest.fixture()
def ctx(app):
    # Every test gets a brand-new in-memory database, so there is nothing to drop afterwards
    # (and drop_all() cannot drop a self-referencing table that still has rows under FK rules).
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def commit_fails(*objects):
    db.session.add_all(objects)
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def slugs(statement):
    return [row.slug for row in db.session.scalars(statement)]


# ---------- safe defaults ----------

def test_new_rows_default_to_draft_and_no_activity_claims(ctx):
    theme = ThematicArea(slug="t", name="T", summary="s")
    place = Location(slug="p", name="P", location_type="county")
    program = Program(slug="x", title="X", summary="s")
    db.session.add_all([theme, place, program])
    db.session.commit()
    assert theme.publication_status == "draft" and theme.is_anchor is False
    assert place.publication_status == "draft" and place.engagement_status == "focus_only"
    assert program.publication_status == "draft" and program.status == "planned"
    assert list(db.session.scalars(public_themes())) == []
    assert list(db.session.scalars(public_locations())) == []
    assert list(db.session.scalars(public_programs())) == []


# ---------- CHECK constraints ----------

@pytest.mark.parametrize("build", [
    lambda: make_theme(publication_status="live"),
    lambda: make_location(location_type="village"),
    lambda: make_location(engagement_status="maybe"),
    lambda: make_location(publication_status="live"),
    lambda: make_program(status="done"),
    lambda: make_program(publication_status="live"),
    lambda: make_program(start_date=date(2027, 3, 1), end_date=date(2026, 10, 1)),
])
def test_bad_values_are_rejected(ctx, build):
    commit_fails(build())


def test_bad_child_values_are_rejected(ctx):
    program = make_program()
    db.session.add(program)
    db.session.commit()
    commit_fails(make_phase(program, sequence=-1))
    commit_fails(make_phase(program, sequence=0, status="done"))
    commit_fails(make_phase(program, sequence=0, start_date=date(2027, 3, 1), end_date=date(2026, 10, 1)))
    phase = make_phase(program, sequence=0)
    db.session.add(phase)
    db.session.commit()
    commit_fails(make_milestone(phase, status="done"))
    commit_fails(make_track(program, track_type="optional"))
    commit_fails(make_track(program, status="done"))


# ---------- uniqueness ----------

@pytest.mark.parametrize("build", [make_theme, make_location, make_program])
def test_slugs_are_unique(ctx, build):
    commit_fails(build("same"), build("same"))


def test_phase_slug_and_sequence_unique_per_program_only(ctx):
    ceci, other = make_program("ceci"), make_program("other")
    db.session.add_all([ceci, other, make_phase(ceci, 0), make_phase(other, 0)])  # same sequence, other program: fine
    db.session.commit()
    commit_fails(make_phase(ceci, 0, slug="another-slug"))   # duplicate sequence
    commit_fails(make_phase(ceci, 5, slug="phase-0"))        # duplicate slug


def test_milestone_and_track_slugs_unique_per_parent(ctx):
    ceci, other = make_program("ceci"), make_program("other")
    p0, p1 = make_phase(ceci, 0), make_phase(ceci, 1)
    db.session.add_all([ceci, other, p0, p1, make_milestone(p0, "m"), make_milestone(p1, "m"),
                        make_track(ceci, "t"), make_track(other, "t")])  # same slug, different parent: fine
    db.session.commit()
    commit_fails(make_milestone(p0, "m"))
    commit_fails(make_track(ceci, "t"))


# ---------- anchor and primary-theme rules ----------

def test_only_one_anchor_theme(ctx):
    db.session.add_all([make_theme("anchor", is_anchor=True), make_theme("a"), make_theme("b")])
    db.session.commit()
    commit_fails(make_theme("second-anchor", is_anchor=True))


def test_only_one_primary_theme_per_program(ctx):
    program, t1, t2 = make_program(), make_theme("t1"), make_theme("t2")
    db.session.add_all([program, t1, t2])
    db.session.flush()
    db.session.execute(insert(program_themes), [
        {"program_id": program.id, "theme_id": t1.id, "is_primary": True},
        {"program_id": program.id, "theme_id": t2.id, "is_primary": False},
    ])
    db.session.commit()
    with pytest.raises(IntegrityError):
        db.session.execute(delete(program_themes).where(program_themes.c.theme_id == t2.id))
        db.session.execute(insert(program_themes), {"program_id": program.id, "theme_id": t2.id, "is_primary": True})
        db.session.commit()
    db.session.rollback()


def test_two_programs_can_each_have_a_primary_theme(ctx):
    a, b, theme = make_program("a"), make_program("b"), make_theme()
    db.session.add_all([a, b, theme])
    db.session.flush()
    db.session.execute(insert(program_themes), [
        {"program_id": a.id, "theme_id": theme.id, "is_primary": True},
        {"program_id": b.id, "theme_id": theme.id, "is_primary": True},
    ])
    db.session.commit()


def test_plain_append_links_a_non_primary_theme(ctx):
    program, theme = make_program(), make_theme()
    program.themes.append(theme)
    db.session.add_all([program, theme])
    db.session.commit()
    row = db.session.execute(select(program_themes)).one()
    assert row.is_primary is False


# ---------- location tree ----------

def test_location_tree_and_self_parent_rule(ctx):
    kenya = make_location("kenya", location_type="country")
    nairobi = make_location("nairobi", parent=kenya, engagement_status="active", is_coordination_hub=True)
    dandora = make_location("dandora", location_type="community", parent=nairobi, engagement_status="active")
    db.session.add_all([kenya, nairobi, dandora])
    db.session.commit()
    assert [c.slug for c in kenya.children] == ["nairobi"]
    assert dandora.parent.parent.slug == "kenya"

    nairobi.parent_id = nairobi.id
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_place_with_children_cannot_be_deleted(ctx):
    kenya = make_location("kenya", location_type="country")
    nairobi = make_location("nairobi", parent=kenya)
    db.session.add_all([kenya, nairobi])
    db.session.commit()

    with pytest.raises(IntegrityError):  # ORM path
        db.session.delete(kenya)
        db.session.commit()
    db.session.rollback()
    with pytest.raises(IntegrityError):  # raw SQL path
        db.session.execute(delete(Location).where(Location.slug == "kenya"))
        db.session.commit()
    db.session.rollback()

    db.session.delete(nairobi)  # a leaf can go
    db.session.commit()
    assert db.session.scalar(select(func.count()).select_from(Location)) == 1


# ---------- delete rules ----------

def test_deleting_a_program_removes_its_children_and_links_but_not_themes_or_places(ctx):
    program, theme, place = make_program(), make_theme(), make_location()
    phase = make_phase(program, 0)
    milestone = make_milestone(phase)
    track = make_track(program)
    program.themes.append(theme)
    program.locations.append(place)
    track.themes.append(theme)
    db.session.add_all([program, theme, place, phase, milestone, track])
    db.session.commit()

    db.session.delete(program)
    db.session.commit()

    for model in (Program, Phase, Milestone, TrainingTrack):
        assert db.session.scalar(select(func.count()).select_from(model)) == 0
    for table in (program_themes, program_locations, track_themes):
        assert db.session.scalar(select(func.count()).select_from(table)) == 0
    assert db.session.get(ThematicArea, theme.id) is not None
    assert db.session.get(Location, place.id) is not None


@pytest.mark.parametrize("linker", ["program_theme", "program_location", "track_theme"])
def test_theme_or_place_in_use_cannot_be_deleted(ctx, linker):
    program, theme, place = make_program(), make_theme(), make_location()
    track = make_track(program)
    if linker == "program_theme":
        program.themes.append(theme)
        target = theme
    elif linker == "track_theme":
        track.themes.append(theme)
        target = theme
    else:
        program.locations.append(place)
        target = place
    db.session.add_all([program, theme, place, track])
    db.session.commit()

    with pytest.raises(IntegrityError):
        db.session.delete(target)
        db.session.commit()
    db.session.rollback()
    with pytest.raises(IntegrityError):
        db.session.execute(delete(type(target)))
        db.session.commit()
    db.session.rollback()


# ---------- public queries ----------

def test_public_themes_hide_unpublished_and_put_the_anchor_first(ctx):
    db.session.add_all([
        make_theme("energy", sort_order=2), make_theme("circular", sort_order=1),
        make_theme("anchor", is_anchor=True, sort_order=9),
        make_theme("draft-one", publication_status="draft"),
        make_theme("old-one", publication_status="archived"),
    ])
    db.session.commit()
    assert slugs(public_themes()) == ["anchor", "circular", "energy"]
    assert slugs(public_theme_by_slug("circular")) == ["circular"]
    assert slugs(public_theme_by_slug("draft-one")) == []
    assert slugs(public_theme_by_slug("old-one")) == []


def test_public_locations_hide_unpublished_and_keep_activity_status(ctx):
    db.session.add_all([
        make_location("b-county", sort_order=2),
        make_location("a-county", sort_order=1, engagement_status="active"),
        make_location("hidden", publication_status="draft"),
    ])
    db.session.commit()
    assert slugs(public_locations()) == ["a-county", "b-county"]
    assert slugs(public_location_by_slug("hidden")) == []
    focus = db.session.scalars(public_location_by_slug("b-county")).one()
    assert focus.engagement_status == "focus_only"


def test_public_programs_featured_first_and_hide_unpublished(ctx):
    db.session.add_all([
        make_program("regular", sort_order=0),
        make_program("featured", is_featured=True, sort_order=5),
        make_program("draft-program", publication_status="draft"),
        make_program("archived-program", publication_status="archived"),
    ])
    db.session.commit()
    assert slugs(public_programs()) == ["featured", "regular"]
    assert slugs(public_program_by_slug("draft-program")) == []


def test_children_need_every_parent_published(ctx):
    live = make_program("live")
    hidden = make_program("hidden", publication_status="draft")
    live_phases = [make_phase(live, 1), make_phase(live, 0), make_phase(live, 2, publication_status="draft")]
    hidden_phase = make_phase(hidden, 0)
    db.session.add_all([live, hidden, *live_phases, hidden_phase])
    db.session.flush()
    db.session.add_all([
        make_milestone(live_phases[1], "seq0-b", sort_order=1),   # phase sequence 0
        make_milestone(live_phases[1], "seq0-a", sort_order=0),   # phase sequence 0
        make_milestone(live_phases[0], "seq1-a", sort_order=0),   # phase sequence 1
        make_milestone(live_phases[1], "draft-milestone", publication_status="draft"),
        make_milestone(live_phases[2], "under-draft-phase"),
        make_milestone(hidden_phase, "under-draft-program"),
        make_track(live, "b-track", sort_order=1),
        make_track(live, "a-track", sort_order=0),
        make_track(live, "draft-track", publication_status="draft"),
        make_track(hidden, "under-draft-program"),
    ])
    db.session.commit()

    assert [p.sequence for p in db.session.scalars(public_phases(live.id))] == [0, 1]
    assert slugs(public_milestones(live.id)) == ["seq0-a", "seq0-b", "seq1-a"]  # by phase, then milestone
    assert slugs(public_tracks(live.id)) == ["a-track", "b-track"]

    # an unpublished program exposes nothing at all
    assert slugs(public_phases(hidden.id)) == []
    assert slugs(public_milestones(hidden.id)) == []
    assert slugs(public_tracks(hidden.id)) == []
