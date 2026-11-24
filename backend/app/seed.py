"""Clearly-marked NON-PRODUCTION demo data for exercising the public API.

    flask --app run.py seed-demo            # (re)create demo rows
    flask --app run.py seed-demo --clear    # remove demo rows only

Every demo row has a slug starting with "demo-" and obviously fake text. Titles and
names containing "[HIDDEN]" must NEVER appear in any public API response.
"""
from datetime import date, datetime, timedelta, timezone

import click
from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy import delete, update

from app.extensions import db
from app.models import (
    Location,
    Milestone,
    Phase,
    Program,
    Story,
    TeamProfile,
    ThematicArea,
    TrainingTrack,
    program_themes,
)

DEMO_PREFIX = "demo-"
NOTICE = "DEMO DATA. Not a real SOEA profile or story. Safe to delete."


def clear_demo_data() -> None:
    """Remove demo rows in an order that respects the database's RESTRICT rules."""
    like = f"{DEMO_PREFIX}%"
    # Stories first: their author, team and tag links cascade away, which frees everything else.
    db.session.execute(delete(Story).where(Story.slug.like(like)))
    db.session.execute(delete(TeamProfile).where(TeamProfile.slug.like(like)))
    # Programs cascade to their phases, milestones, tracks and links.
    db.session.execute(delete(Program).where(Program.slug.like(like)))
    # Places are a tree, so remove the leaves first.
    for location_type in ("community", "county", "country"):
        db.session.execute(
            delete(Location).where(Location.slug.like(like), Location.location_type == location_type)
        )
    db.session.execute(delete(ThematicArea).where(ThematicArea.slug.like(like)))
    db.session.commit()


def _profile(slug, name, title, role_type, status, sort_order, links=None, **extra):
    return TeamProfile(
        slug=f"{DEMO_PREFIX}{slug}",
        display_name=name,
        role_title=title,
        role_type=role_type,
        bio=NOTICE,
        social_links=links or [],
        status=status,
        sort_order=sort_order,
        **extra,
    )


def _story(slug, title, authors, **overrides):
    now = datetime.now(timezone.utc)
    fields = dict(
        slug=f"{DEMO_PREFIX}{slug}",
        title=title,
        summary="DEMO summary.",
        body=NOTICE,
        status="PUBLISHED",
        published_at=now - timedelta(days=1),
        consent_status="confirmed",
        is_confidential=False,
    )
    fields.update(overrides)
    story = Story(**fields)
    story.authors.extend(authors)
    return story


def _theme(slug, name, publication_status, sort_order, **extra):
    return ThematicArea(
        slug=f"{DEMO_PREFIX}{slug}", name=name, summary="DEMO summary.", people_served="DEMO people served.",
        publication_status=publication_status, sort_order=sort_order, **extra,
    )


def _location(slug, name, location_type, publication_status, sort_order, parent=None, **extra):
    return Location(
        slug=f"{DEMO_PREFIX}{slug}", name=name, location_type=location_type, parent=parent,
        summary="DEMO summary.", publication_status=publication_status, sort_order=sort_order, **extra,
    )


def seed_demo_data() -> dict:
    clear_demo_data()
    now = datetime.now(timezone.utc)

    # ---- themes ----
    anchor = _theme("anchor-theme", "Demo Anchor Theme", "published", 0, is_anchor=True)
    circular = _theme("circular-economy", "Demo Circular Economy", "published", 1)
    energy = _theme("energy", "Demo Energy", "published", 2)
    hidden_theme = _theme("hidden-theme", "Hidden Theme [HIDDEN]", "draft", 3)

    # ---- locations (a small tree) ----
    kenya = _location("kenya", "Demo Kenya", "country", "published", 0, engagement_status="active")
    nairobi = _location("nairobi", "Demo Nairobi County", "county", "published", 1, kenya,
                        engagement_status="active", is_coordination_hub=True)
    dandora = _location("dandora", "Demo Dandora", "community", "published", 2, nairobi, engagement_status="active")
    mathare = _location("mathare", "Demo Mathare", "community", "published", 3, nairobi, engagement_status="active")
    focus = _location("focus-county", "Demo Focus County", "county", "published", 4, kenya)  # focus_only
    hidden_location = _location("hidden-location", "Hidden Location [HIDDEN]", "county", "draft", 5, kenya)

    # ---- program, phases, milestones, tracks ----
    ceci = Program(slug="demo-ceci", title="Demo Champions Program", short_name="DEMO", summary="DEMO summary.",
                   body=NOTICE, status="in_progress", is_featured=True, publication_status="published")
    hidden_program = Program(slug="demo-hidden-program", title="Hidden Program [HIDDEN]", summary="DEMO summary.",
                             status="planned", publication_status="draft")
    ceci.themes.extend([circular, energy, hidden_theme])
    ceci.locations.extend([nairobi, dandora, mathare, hidden_location])

    def phase(sequence, title, status, publication_status="published", **extra):
        return Phase(program=ceci, sequence=sequence, slug=f"{DEMO_PREFIX}phase-{sequence}", title=title,
                     status=status, publication_status=publication_status, **extra)

    phase0 = phase(0, "Demo Phase 0", "completed", period_label="DEMO period", summary="DEMO summary.")
    phase1 = phase(1, "Demo Phase 1", "in_progress", period_label="DEMO period")
    phase2 = phase(2, "Demo Phase 2", "planned")
    hidden_phase = phase(3, "Hidden Phase [HIDDEN]", "planned", publication_status="draft")
    milestones = [
        Milestone(phase=phase0, slug="demo-community-day", title="[DEMO] Community day", status="completed",
                  occurred_on=date(2026, 1, 15), venue="Demo venue", summary="DEMO summary.",
                  publication_status="published"),
        Milestone(phase=phase0, slug="demo-hidden-milestone", title="Hidden Milestone [HIDDEN]", status="planned",
                  sort_order=1, publication_status="draft"),
    ]
    core = TrainingTrack(program=ceci, slug="demo-core-leadership", title="Demo core skill", track_type="core",
                         summary="DEMO summary.", status="planned", publication_status="published")
    textiles = TrainingTrack(program=ceci, slug="demo-textiles", title="Demo textile pathway",
                             track_type="specialized", summary="DEMO summary.", intended_skills="DEMO skills.",
                             practical_activity="DEMO activity.", safety_requirements="DEMO safety.",
                             status="planned", sort_order=1, publication_status="published")
    hidden_track = TrainingTrack(program=ceci, slug="demo-hidden-track", title="Hidden Track [HIDDEN]",
                                 track_type="specialized", status="planned", sort_order=2,
                                 publication_status="draft")
    textiles.themes.append(circular)
    hidden_track.themes.append(circular)

    # ---- people ----
    staff = _profile("staff-one", "Demo Staff One", "Programs Officer (demo)", "staff", "published", 0,
                     [{"platform": "linkedin", "url": "https://www.linkedin.com/in/demo-example"}],
                     first_name="Demo", short_role="Demo role", education="DEMO education.",
                     fun_fact="DEMO fun fact.", public_email="demo.staff@example.org")
    volunteer = _profile("volunteer-one", "Demo Volunteer One", "Volunteer (demo)", "volunteer", "published", 1)
    leader = _profile("leadership-one", "Demo Leadership One", "Governance role (demo)", "leadership", "published", 2)
    draft = _profile("draft-profile", "Hidden Draft Person [HIDDEN]", "Draft (demo)", "staff", "draft", 3)
    archived = _profile("archived-profile", "Hidden Archived Person [HIDDEN]", "Archived (demo)", "staff", "archived", 4)
    staff.programs.append(ceci)
    draft.programs.append(ceci)

    # ---- stories ----
    stories = [
        # Public
        _story("public-newest", "[DEMO] Newest public story", [staff], published_at=now - timedelta(hours=2)),
        _story("public-coauthored", "[DEMO] Co-authored public story", [staff, volunteer],
               published_at=now - timedelta(days=3), consent_status="not_required"),
        _story("public-hidden-coauthor", "[DEMO] Public story with an unpublished co-author", [staff, draft],
               published_at=now - timedelta(days=6)),
        # Must never be public
        _story("hidden-draft", "[HIDDEN] draft", [staff], status="DRAFT", published_at=None),
        _story("hidden-in-review", "[HIDDEN] in review", [staff], status="IN_REVIEW", published_at=None),
        _story("hidden-changes", "[HIDDEN] changes requested", [staff], status="CHANGES_REQUESTED", published_at=None),
        _story("hidden-approved", "[HIDDEN] approved, not published", [staff], status="APPROVED", published_at=None),
        _story("hidden-scheduled", "[HIDDEN] scheduled", [staff], published_at=now + timedelta(days=5)),
        _story("hidden-confidential", "[HIDDEN] confidential", [staff], is_confidential=True),
        _story("hidden-unreviewed", "[HIDDEN] consent unreviewed", [staff], consent_status="unreviewed"),
        _story("hidden-withdrawn", "[HIDDEN] consent withdrawn", [staff], consent_status="withdrawn"),
        _story("hidden-archived", "[HIDDEN] archived", [staff], status="ARCHIVED"),
        _story("draft-profile-story", "[DEMO] Public story by a draft profile", [draft]),
    ]
    # Tag every story (public and hidden) so the program / theme / place views prove that
    # hidden stories never leak through them.
    for story in stories:
        story.programs.append(ceci)
        story.themes.append(circular)
        story.locations.append(dandora)
    stories[0].phases.append(phase1)    # public
    stories[3].phases.append(phase1)    # hidden draft

    db.session.add_all([
        anchor, circular, energy, hidden_theme,
        kenya, nairobi, dandora, mathare, focus, hidden_location,
        ceci, hidden_program, phase0, phase1, phase2, hidden_phase, *milestones, core, textiles, hidden_track,
        staff, volunteer, leader, draft, archived,
        *stories,
    ])
    db.session.flush()
    # CECI is cross-thematic but anchored within one area: mark its primary theme.
    db.session.execute(
        update(program_themes)
        .where(program_themes.c.program_id == ceci.id, program_themes.c.theme_id == circular.id)
        .values(is_primary=True)
    )
    db.session.commit()
    return {"profiles": 5, "stories": len(stories), "themes": 4, "locations": 6, "programs": 2}


@click.command("seed-demo")
@click.option("--clear", is_flag=True, help="Only remove demo rows; do not recreate them.")
@with_appcontext
def seed_demo_command(clear: bool) -> None:
    """Create (or with --clear, remove) clearly-marked demo data."""
    if current_app.config.get("APP_ENV") == "production":
        raise click.ClickException("Refusing to touch demo data in production.")
    if clear:
        clear_demo_data()
        click.echo("Removed demo data.")
        return
    counts = seed_demo_data()
    click.echo(
        "Seeded demo data: {profiles} profiles, {stories} stories, {themes} themes, "
        "{locations} locations, {programs} programs.".format(**counts)
    )


def register_cli(app) -> None:
    app.cli.add_command(seed_demo_command)

    from .admin_cli import create_admin_command, set_password_command
    app.cli.add_command(create_admin_command)
    app.cli.add_command(set_password_command)

    from .content_seed import import_past_events_command, seed_jeet_command, seed_partnership_areas_command
    app.cli.add_command(seed_jeet_command)
    app.cli.add_command(seed_partnership_areas_command)
    app.cli.add_command(import_past_events_command)

    from .site_import import import_site_content_command
    app.cli.add_command(import_site_content_command)
