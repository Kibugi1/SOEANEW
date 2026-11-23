"""Real, approved-by-source content that is loaded as DRAFTS for the admin to publish.

Unlike `seed-demo` (fake data for development), these commands load real SOEA content.
Everything is created as a draft: nothing becomes public until an admin publishes it in
the dashboard. Each command is idempotent and never overwrites edits made since.
"""

import click
from flask.cli import with_appcontext
from sqlalchemy import or_, select

from app.extensions import db
from app.models import AuditEvent, Location, Program, TeamProfile, ThematicArea, program_themes

JEET_SLUG = "jeet-champions"

# Source: Chika Atueyi's email "JEET Champions Programme - Green Mobility Champions
# Pathway", 20 Nov 2026 (copied to Rozalia). Her mobile number is deliberately not
# stored: profiles and programs publish only an approved work email.
JEET = {
    "title": "JEET Champions: Green Mobility Champions Pathway",
    "short_name": "JEET",
    "status": "in_development",  # shown as "Concept in development"
    "summary": (
        "An emerging project under CECI that opens Kenya's clean energy and electric "
        "mobility transition to underserved women, women with disabilities and young people, "
        "starting with electric motorcycles and the boda boda industry."
    ),
    "body": (
        "JEET Champions is an emerging project under SOEA's Community Environmental Champions "
        "Initiative, applying SOEA's community-led training methodology to expand participation "
        "in Kenya's clean energy and electric mobility transition.\n\n"
        "Its initial pathway, Green Mobility Champions, will focus on creating opportunities for "
        "women, particularly underserved women and women with disabilities, to participate in "
        "Kenya's electric mobility sector, with a starting focus on electric motorcycles and the "
        "boda boda industry. The pathway will also engage young people and explore wider "
        "opportunities across ride-hailing and passenger transport.\n\n"
        "Through practical learning, participants will develop knowledge, confidence, advocacy "
        "skills, financial literacy and an understanding of the livelihood and enterprise "
        "opportunities associated with cleaner mobility. The project will also promote informed "
        "community engagement around electric mobility, renewable energy solutions and their "
        "potential social and economic benefits.\n\n"
        "The proposed pilot will begin in Nairobi, with potential for adaptation and expansion "
        "into Kajiado and subsequent scale-up in Isiolo, informed by lessons from each stage.\n\n"
        "## Alignment with SOEA's focus areas\n\n"
        "The JEET Champions Programme also connects with SOEA's Renewable Energy & Clean Cooking "
        "Solutions focus area by exploring the relationship between renewable energy and electric "
        "mobility. While electric mobility is not itself a renewable energy source, its transition "
        "towards cleaner transport is strengthened by access to renewable electricity and "
        "sustainable charging solutions. The Green Mobility Champions pathway will therefore help "
        "raise awareness of the links between clean energy, electric transport and the associated "
        "livelihood and enterprise opportunities."
    ),
    "contact_email": "c.atueyi@sq1ecoafrica.org",
    # The contact route for this CTA is still to be confirmed by SOEA: shown without a link.
    "cta_label": "Help shape the first JEET Champions cohort",
    "cta_pending": True,
}
JEET_PLACES = ("nairobi", "kajiado", "isiolo")  # pilot, then expansion, then scale-up


def _find_ceci():
    return db.session.scalars(
        select(Program).where(or_(Program.slug == "ceci", Program.short_name == "CECI")).limit(1)
    ).first()


def _find_theme():
    """Chika's brief names "Renewable Energy & Clean Cooking Solutions"; the site's theme
    is "Just & Equitable Energy Transition" (slug energy-transition). Use whichever exists."""
    for pattern in ("%renewable%", "%energy%"):
        theme = db.session.scalars(
            select(ThematicArea).where(or_(
                ThematicArea.slug.ilike(pattern), ThematicArea.name.ilike(pattern),
            )).limit(1)
        ).first()
        if theme:
            return theme
    return None


def _find_place(name):
    return db.session.scalars(
        select(Location).where(or_(Location.slug == name, Location.slug.ilike(f"{name}%"))).limit(1)
    ).first()


def seed_jeet() -> list[str]:
    """Create the JEET Champions draft; returns notes on anything that could not be linked."""
    notes = []
    if db.session.scalars(select(Program).where(Program.slug == JEET_SLUG)).first():
        return ["JEET Champions already exists; nothing changed."]

    program = Program(slug=JEET_SLUG, publication_status="draft", is_featured=False, sort_order=20, **JEET)
    db.session.add(program)

    ceci = _find_ceci()
    if ceci:
        program.parent = ceci
    else:
        notes.append("CECI program not found: set JEET's parent in the dashboard once CECI exists.")

    lead = db.session.scalars(select(TeamProfile).where(TeamProfile.slug == "chika-atueyi")).first()
    if lead:
        program.lead = lead
    else:
        notes.append("Profile 'chika-atueyi' not found: set the program lead in the dashboard.")

    theme = _find_theme()
    if theme:
        program.themes = [theme]
    else:
        notes.append("No energy theme found: add JEET's theme in the dashboard.")

    places = [place for place in (_find_place(name) for name in JEET_PLACES) if place]
    program.locations = places
    missing = [name for name in JEET_PLACES if not any(p.slug.startswith(name) for p in places)]
    if missing:
        notes.append(f"Places not found ({', '.join(missing)}): link them in the dashboard.")

    db.session.add(program)
    db.session.flush()
    if theme:
        db.session.execute(
            program_themes.update()
            .where(program_themes.c.program_id == program.id)
            .values(is_primary=True)
        )
    db.session.add(AuditEvent(
        actor_user_id=None, action="program.seeded", target_type="program",
        target_id=str(program.id), details={"source": "Chika Atueyi email, 20 Nov 2026"},
    ))
    db.session.commit()
    return ["Created JEET Champions as a draft."] + notes


@click.command("seed-jeet")
@with_appcontext
def seed_jeet_command():
    """Load JEET Champions (from Chika's 20 Nov 2026 brief) as a draft program."""
    for note in seed_jeet():
        click.echo(note)


# --- Partnership areas ----------------------------------------------------------------

# The seven areas offered on the website's Partner With Us journey
# (frontend/src/components/journey/journeys.ts, partnershipInterests). Same slugs, so the
# areas on a partner match the `interests` stored on partnership enquiries.
PARTNERSHIP_AREAS = (
    ("training", "Training & Technical Expertise",
     "Curriculum development, TVET certification, circular-economy skills, facilitation and mentorship."),
    ("legal", "Legal Awareness & Community Rights",
     "Paralegal training, legal literacy, environmental rights and access to justice."),
    ("health-safety", "Health, Safety & Wellbeing",
     "Occupational health and safety, safety marshal training, first aid and protective equipment."),
    ("finance-enterprise", "Finance & Enterprise Development",
     "Financial literacy, savings, access to suitable finance, entrepreneurship and investment readiness."),
    ("markets", "Markets & Livelihoods",
     "Product development, employment pathways, buyer relationships and enterprise partnerships."),
    ("research", "Research, Innovation & Evidence",
     "Program assessments, digital tools, monitoring, community research and learning."),
    ("resource-mobilization", "Resource Mobilization",
     "Financial, technical, equipment and in-kind support for program development and implementation."),
)


def seed_partnership_areas() -> list[str]:
    """Create any missing partnership areas. Existing ones are left exactly as they are.

    They are published straight away: the same wording is already public on the
    Partner With Us journey.
    """
    from app.models import PartnershipArea

    existing = set(db.session.scalars(select(PartnershipArea.slug)).all())
    added = []
    for order, (slug, name, summary) in enumerate(PARTNERSHIP_AREAS, start=1):
        if slug in existing:
            continue
        db.session.add(PartnershipArea(slug=slug, name=name, summary=summary,
                                       sort_order=order * 10, publication_status="published"))
        added.append(name)
    db.session.commit()
    return [f"Added: {name}" for name in added] or ["All partnership areas already exist; nothing changed."]


@click.command("seed-partnership-areas")
@with_appcontext
def seed_partnership_areas_command():
    """Load the seven partnership areas used on the Partner With Us journey."""
    for note in seed_partnership_areas():
        click.echo(note)


# --- Past events (March to October 2026) ------------------------------------------------

def import_past_events() -> tuple[int, list[str]]:
    """Load the compiled events as event records waiting for the founder's review.

    They arrive IN_REVIEW, so each one appears in the review queue and is published with
    a single approval. Records whose source gives no date cannot be approved until a date
    is added (events need one), and the review note says so.
    """
    from datetime import date, datetime, timezone

    from app.data.past_events import PAST_EVENTS, SOURCE
    from app.models import Phase, Story, StoryTeamMember

    def by_slug(model, slugs):
        rows = db.session.scalars(select(model).where(model.slug.in_(slugs))).all() if slugs else []
        return [row for slug in slugs for row in rows if row.slug == slug]

    created, notes = 0, []
    now = datetime.now(timezone.utc)
    for event in PAST_EVENTS:
        if db.session.scalars(select(Story).where(Story.slug == event["slug"])).first():
            continue

        review = [f"Imported from {SOURCE}. Check the wording before approving."]
        if not event["date"]:
            review.append("DATE TO CONFIRM: the post gives no date; add it before approving.")
        if event["consent"] == "unreviewed":
            review.append("Quotes a named community member: confirm consent, then set consent to confirmed.")
        if event["slug"] == "waste-pickers-super-day-2026":
            review.append(
                "Overlaps the existing story 'ceci-waste-pickers-super-day'; consider unpublishing that one "
                "once this event is live."
            )

        story = Story(
            slug=event["slug"], title=event["title"], summary=event["summary"], body=event["body"],
            story_type="event",
            activity_date=date.fromisoformat(event["date"]) if event["date"] else None,
            event_end_date=date.fromisoformat(event["end_date"]) if event.get("end_date") else None,
            venue=event["venue"], organiser=event["organiser"], event_role=event["role"],
            lessons=event["lessons"], next_step=event["next_step"],
            status="IN_REVIEW", submitted_at=now, consent_status=event["consent"],
            is_confidential=False, review_notes="\n".join(review),
        )
        db.session.add(story)

        with db.session.no_autoflush:
            for kind, model, key in (("programs", Program, "programs"), ("themes", ThematicArea, "themes"),
                                     ("places", Location, "locations")):
                found = by_slug(model, event[kind])
                setattr(story, key, found)
                missing = set(event[kind]) - {row.slug for row in found}
                if missing:
                    notes.append(f"{event['slug']}: {kind} not found: {', '.join(sorted(missing))}")

            phases = []
            for ref in event.get("phases", []):
                program_slug, _, phase_slug = ref.partition("/")
                phase = db.session.scalars(
                    select(Phase).join(Program).where(Program.slug == program_slug, Phase.slug == phase_slug)
                ).first()
                if phase:
                    phases.append(phase)
            story.phases = phases

            members = []
            for index, (slug, role) in enumerate(event["team"]):
                profile = db.session.scalars(select(TeamProfile).where(TeamProfile.slug == slug)).first()
                if profile:
                    members.append(StoryTeamMember(profile=profile, role=role, sort_order=index))
                else:
                    notes.append(f"{event['slug']}: profile not found: {slug}")
            story.team_members = members

        db.session.flush()
        db.session.add(AuditEvent(
            actor_user_id=None, action="story.imported", target_type="story",
            target_id=str(story.id), details={"source": SOURCE},
        ))
        created += 1

    db.session.commit()
    return created, notes


@click.command("import-past-events")
@with_appcontext
def import_past_events_command():
    """Load the March-October 2026 events into the founder's review queue."""
    created, notes = import_past_events()
    click.echo(f"Created {created} event record(s), waiting for review.")
    for note in notes:
        click.echo(f"Note: {note}")
