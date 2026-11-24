"""Import the content the website currently hard-codes (frontend/src/data/*.ts).

    cd frontend && node scripts/export-content.mjs > ../backend/instance/site-content.json
    cd backend  && flask --app run.py import-site-content

Everything the site already shows publicly is imported as published, so the site looks
the same once it reads from the API; from then on the admin dashboard controls it.
Existing rows (matched by slug) are never overwritten, so the command is safe to re-run.
Portraits are copied from frontend/public into the media store (metadata stripped).
"""

import json
from datetime import date, datetime, timezone
from pathlib import Path

import click
from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy import select, update

from app.extensions import db
from app.models import (
    AuditEvent,
    Location,
    MediaAsset,
    Milestone,
    Phase,
    Program,
    Story,
    TeamProfile,
    ThematicArea,
    TrainingTrack,
    program_themes,
)
from app.services.media_storage import UploadError, public_url_for, store_upload

ANCHOR_SLUG = "rural-urban-sustainable-development"
PHASE_STATUS = {"completed": "completed", "current": "in_progress", "planned": "planned"}


class Importer:
    def __init__(self, content: dict, public_dir: Path):
        self.content = content
        self.public_dir = public_dir
        self.created: dict[str, int] = {}
        self.notes: list[str] = []

    # --- helpers -----------------------------------------------------------------------

    def _existing(self, model, slug):
        return db.session.scalars(select(model).where(model.slug == slug)).first()

    def _count(self, kind):
        self.created[kind] = self.created.get(kind, 0) + 1

    def _image(self, src: str | None, alt: str | None):
        """Copy a frontend/public image into the media store; None if unavailable."""
        if not src or not src.startswith("/"):
            return None
        path = (self.public_dir / src.lstrip("/")).resolve()
        if self.public_dir.resolve() not in path.parents or not path.is_file():
            self.notes.append(f"Image not found, skipped: {src}")
            return None
        try:
            stored = store_upload(path.read_bytes())
        except UploadError as exc:
            self.notes.append(f"Image not imported ({src}): {exc}")
            return None
        asset = MediaAsset(
            kind=stored.kind, storage_key=stored.storage_key, original_filename=path.name,
            mime_type=stored.mime_type, file_size=stored.file_size,
            width=stored.width, height=stored.height, alt_text=alt,
            public_url=public_url_for(stored.storage_key),
        )
        db.session.add(asset)
        self._count("images")
        return asset

    # --- content ----------------------------------------------------------------------

    def themes(self):
        anchor = self.content["focusAnchor"]
        rows = [dict(slug=ANCHOR_SLUG, name=anchor["title"], summary=anchor["description"],
                     people_served=None, is_anchor=True, sort_order=0)]
        for index, area in enumerate(self.content["focusAreas"], start=1):
            rows.append(dict(
                slug=area["slug"], name=area["title"], summary=area["description"],
                people_served="; ".join(area.get("peopleServed") or []) or None,
                is_anchor=False, sort_order=index,
            ))
        for row in rows:
            if not self._existing(ThematicArea, row["slug"]):
                db.session.add(ThematicArea(publication_status="published", **row))
                self._count("themes")
        db.session.flush()

    def places(self):
        where = self.content["whereWeWork"]
        kenya = self._existing(Location, "kenya") or Location(
            slug="kenya", name="Kenya", location_type="country", engagement_status="active",
            publication_status="published", sort_order=0,
        )
        if kenya.id is None:
            db.session.add(kenya)
            self._count("places")

        hub = where["coordinationHub"]
        nairobi = self._existing(Location, "nairobi") or Location(
            slug="nairobi", name=hub["name"], location_type="county", parent=kenya,
            summary=hub["description"], engagement_status="active", is_coordination_hub=True,
            publication_status="published", sort_order=1,
        )
        if nairobi.id is None:
            db.session.add(nairobi)
            self._count("places")

        for index, community in enumerate(where["communityLocations"], start=1):
            if not self._existing(Location, community["id"]):
                db.session.add(Location(
                    slug=community["id"], name=community["name"], location_type="community",
                    parent=nairobi, summary=community["description"], engagement_status="active",
                    publication_status="published", sort_order=index,
                ))
                self._count("places")

        for index, county in enumerate(where["geographicFocus"], start=10):
            slug = county.lower().replace(" ", "-")
            if not self._existing(Location, slug):
                db.session.add(Location(
                    slug=slug, name=county, location_type="county", parent=kenya,
                    summary=None, engagement_status="focus_only",
                    publication_status="published", sort_order=index,
                ))
                self._count("places")
        db.session.flush()

    def people(self):
        for index, person in enumerate(self.content["volunteers"]):
            if self._existing(TeamProfile, person["slug"]):
                continue
            photo = person.get("photo") or {}
            db.session.add(TeamProfile(
                slug=person["slug"], display_name=person["name"], first_name=person.get("firstName"),
                role_title=person["role"], short_role=person.get("shortRole"), role_type="volunteer",
                bio=person.get("bio"),
                education="\n".join(person.get("education") or []) or None,
                fun_fact=person.get("funFact"), public_email=person.get("email"),
                social_links=[], status="published", sort_order=index,
                image=self._image(photo.get("src"), photo.get("alt")),
            ))
            self._count("profiles")

        for index, member in enumerate(self.content["boardMembers"]):
            slug = member["id"]
            if self._existing(TeamProfile, slug):
                continue
            photo = member.get("photo") or {}
            db.session.add(TeamProfile(
                slug=slug, display_name=member["name"], first_name=member["name"].split()[0],
                role_title=member["title"], short_role=member["title"], role_type="leadership",
                bio=member.get("bio"), social_links=[], status="published", sort_order=100 + index,
                image=self._image(photo.get("src"), photo.get("alt")),
            ))
            self._count("profiles")
        db.session.flush()

    def programs(self):
        ceci_data = self.content["ceci"]
        themes_by_name = {t.name: t for t in db.session.scalars(select(ThematicArea)).all()}
        places_by_name = {p.name: p for p in db.session.scalars(select(Location)).all()}

        for index, source in enumerate(self.content["programmes"]):
            if source.get("visibility") != "published" or self._existing(Program, source["slug"]):
                continue
            is_ceci = source["slug"] == "ceci"
            body = source["description"]
            if is_ceci:
                body = f"{ceci_data['programme']['introduction']}\n\n{ceci_data['programme']['purpose']}"

            program = Program(
                slug=source["slug"], title=source["title"], short_name=source.get("shortName"),
                summary=source["summary"], body=body,
                status=source["status"] if source["status"] in ("in_development", "completed", "planned") else "in_progress",
                is_featured=bool(source.get("featured")),
                start_date=date.fromisoformat(source["startDate"]) if source.get("startDate") else None,
                end_date=date.fromisoformat(source["endDate"]) if source.get("endDate") else None,
                sort_order=index, publication_status="published", cta_pending=False,
            )
            program.themes = [themes_by_name[n] for n in source.get("thematicAreas", []) if n in themes_by_name]
            program.locations = [places_by_name[n] for n in source.get("location", []) if n in places_by_name]
            missing = [n for n in source.get("thematicAreas", []) if n not in themes_by_name]
            if missing:
                self.notes.append(f"{source['shortName']}: theme names not matched: {', '.join(missing)}")

            if is_ceci:
                lead_name = ceci_data["leadership"]["name"]
                program.lead = db.session.scalars(
                    select(TeamProfile).where(TeamProfile.display_name == lead_name)
                ).first()
                self._ceci_structure(program, ceci_data)

            db.session.add(program)
            db.session.flush()
            if program.themes:  # the first listed theme is the program's primary theme
                db.session.execute(
                    update(program_themes)
                    .where(program_themes.c.program_id == program.id,
                           program_themes.c.theme_id == program.themes[0].id)
                    .values(is_primary=True)
                )
            self._count("programs")

        # "Programs supported" on each volunteer profile.
        programs_by_id = {p["id"]: p["slug"] for p in self.content["programmes"]}
        for person in self.content["volunteers"]:
            profile = self._existing(TeamProfile, person["slug"])
            for programme_id in person.get("programmeIds", []):
                program = self._existing(Program, programs_by_id.get(programme_id, ""))
                if profile and program and program not in profile.programs:
                    profile.programs.append(program)
        db.session.flush()

    def _ceci_structure(self, program, ceci_data):
        for phase_data in ceci_data["phases"]:
            sequence = int(phase_data["number"])
            phase = Phase(
                program=program, sequence=sequence, slug=f"phase-{sequence}",
                title=phase_data["title"], summary=phase_data["description"],
                period_label=phase_data["period"], status=PHASE_STATUS.get(phase_data["status"], "planned"),
                publication_status="published",
            )
            db.session.add(phase)
            if sequence == 0:
                db.session.add(Milestone(
                    phase=phase, slug="waste-pickers-super-day", title="Waste Pickers Super Day",
                    summary=phase_data["evidence"], occurred_on=date(2026, 10, 10),
                    venue="Dandora Community Park", status="completed", publication_status="published",
                ))
        for index, area in enumerate(ceci_data["learningAreas"]):
            db.session.add(TrainingTrack(
                program=program, slug=f"core-{index + 1}", title=area, track_type="core",
                status="planned", sort_order=index, publication_status="published",
            ))
        for index, pathway in enumerate(ceci_data["pathways"]):
            slug = pathway["title"].lower().replace(" & ", "-").replace(" ", "-")
            db.session.add(TrainingTrack(
                program=program, slug=slug, title=pathway["title"], track_type="specialized",
                summary=pathway["description"], status="planned", sort_order=index,
                publication_status="published",
            ))

    def stories(self):
        programs_by_id = {p["id"]: p["slug"] for p in self.content["programmes"]}
        now = datetime.now(timezone.utc)
        for source in self.content["stories"]:
            if self._existing(Story, source["slug"]):
                continue
            story = Story(
                slug=source["slug"], title=source["title"], summary=source["summary"],
                body=source["summary"],
                activity_date=date.fromisoformat(source["date"]) if source.get("date") else None,
                next_step=source.get("nextStep"), social_url=source.get("socialUrl"),
                story_type="story", status="PUBLISHED", published_at=now,
                # These describe program activity, with no identifiable participants or photos.
                consent_status="not_required",
            )
            program = self._existing(Program, programs_by_id.get(source.get("programmeId") or "", ""))
            if program:
                story.programs = [program]
                story.phases = [ph for ph in program.phases if ph.title == source.get("phase")]
            story.locations = [
                place for place in db.session.scalars(
                    select(Location).where(Location.name.in_(source.get("community") or []))
                )
            ]
            story.authors = [
                profile for slug in source.get("linkedTeamIds") or []
                if (profile := self._existing(TeamProfile, slug))
            ]
            db.session.add(story)
            self._count("stories")
        db.session.flush()

    def run(self):
        self.themes()
        self.places()
        self.people()
        self.programs()
        self.stories()
        db.session.add(AuditEvent(
            actor_user_id=None, action="content.imported", target_type="site",
            target_id=None, details={"created": self.created},
        ))
        db.session.commit()
        return self.created, self.notes


def import_site_content(content: dict, public_dir: Path):
    return Importer(content, public_dir).run()


@click.command("import-site-content")
@click.option("--from", "source", default=None, help="JSON from scripts/export-content.mjs.")
@click.option("--public-dir", default=None, help="The frontend's public/ folder (for portraits).")
@with_appcontext
def import_site_content_command(source, public_dir):
    """Import the website's current content as published records (skips existing slugs)."""
    base = Path(current_app.root_path).parent
    source_path = Path(source) if source else base / "instance" / "site-content.json"
    public_path = Path(public_dir) if public_dir else base.parent / "frontend" / "public"
    if not source_path.is_file():
        raise click.ClickException(
            f"{source_path} not found. Run: cd frontend && node scripts/export-content.mjs "
            "> ../backend/instance/site-content.json"
        )
    created, notes = import_site_content(json.loads(source_path.read_text("utf-8")), public_path)
    click.echo("Created: " + (", ".join(f"{n} {k}" for k, n in created.items()) or "nothing (already imported)"))
    for note in notes:
        click.echo(f"Note: {note}")
