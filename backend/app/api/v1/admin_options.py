"""Choices for the dashboard's pickers (any signed-in role).

Names and slugs only, including drafts (JEET), so a writer can tag a story with
a program, place, theme or person. Nothing private is returned.
"""

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.decorators import admin_required
from app.api.helpers import item_response
from app.extensions import db
from app.models import Location, Phase, Program, TeamProfile, ThematicArea

from . import api_v1


@api_v1.get("/admin/options")
@admin_required
def admin_options():
    profiles = db.session.scalars(
        select(TeamProfile).where(TeamProfile.status != "archived")
        .order_by(TeamProfile.display_name)
    ).all()
    programs = db.session.scalars(
        select(Program).where(Program.publication_status != "archived")
        .options(selectinload(Program.phases)).order_by(Program.sort_order, Program.title)
    ).all()
    themes = db.session.scalars(
        select(ThematicArea).where(ThematicArea.publication_status != "archived")
        .order_by(ThematicArea.sort_order)
    ).all()
    places = db.session.scalars(
        select(Location).where(Location.publication_status != "archived")
        .order_by(Location.sort_order, Location.name)
    ).all()

    return item_response({
        "profiles": [
            {"slug": p.slug, "name": p.display_name, "role_title": p.role_title} for p in profiles
        ],
        "programs": [
            {
                "slug": p.slug,
                "name": p.short_name or p.title,
                "title": p.title,
                "phases": [
                    {"ref": f"{p.slug}/{ph.slug}", "name": ph.title, "sequence": ph.sequence}
                    for ph in p.phases if ph.publication_status != "archived"
                ],
            }
            for p in programs
        ],
        "themes": [{"slug": t.slug, "name": t.name} for t in themes],
        "places": [
            {"slug": l.slug, "name": l.name, "type": l.location_type} for l in places
        ],
    })
