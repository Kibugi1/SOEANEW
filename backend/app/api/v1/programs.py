from flask import request
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.helpers import LATEST_ON_DETAIL, collection_response, first_or_404, item_response, paginate
from app.extensions import db
from app.models import (
    Location,
    Program,
    ThematicArea,
    TrainingTrack,
    program_locations,
    program_themes,
    public_milestones,
    public_phases,
    public_profiles_for_program,
    public_program_by_slug,
    public_programs,
    public_stories_for_program,
    public_tracks,
)
from app.schemas.content import (
    MilestoneSchema,
    PhaseSchema,
    ProgramDetailSchema,
    ProgramListQuerySchema,
    ProgramListSchema,
    TrackSchema,
)
from app.schemas.refs import program_ref
from app.schemas.team import StoryRefSchema, TeamProfileListSchema

from . import api_v1


@api_v1.get("/programs")
def list_programs():
    args = ProgramListQuerySchema().load(request.args.to_dict())

    statement = public_programs().options(
        selectinload(Program.themes), selectinload(Program.locations), selectinload(Program.cover_image),
    )
    if "featured" in args:
        statement = statement.where(Program.is_featured.is_(args["featured"]))
    if args.get("theme"):
        tagged = (
            select(program_themes.c.program_id)
            .join(ThematicArea, ThematicArea.id == program_themes.c.theme_id)
            .where(ThematicArea.slug == args["theme"], ThematicArea.publication_status == "published")
        )
        statement = statement.where(Program.id.in_(tagged))
    if args.get("location"):
        tagged = (
            select(program_locations.c.program_id)
            .join(Location, Location.id == program_locations.c.location_id)
            .where(Location.slug == args["location"], Location.publication_status == "published")
        )
        statement = statement.where(Program.id.in_(tagged))

    page = paginate(statement, args)
    return collection_response(ProgramListSchema(many=True).dump(page.items), page)


@api_v1.get("/programs/<slug>")
def get_program(slug: str):
    program = first_or_404(public_program_by_slug(slug))

    phases = db.session.scalars(public_phases(program.id)).all()
    tracks = db.session.scalars(public_tracks(program.id).options(selectinload(TrainingTrack.themes))).all()
    people = db.session.scalars(public_profiles_for_program(program.id)).all()
    stories = db.session.scalars(public_stories_for_program(program.id).limit(LATEST_ON_DETAIL)).all()

    data = ProgramDetailSchema().dump(program)
    data["phases"] = PhaseSchema(many=True).dump(phases)
    data["learning_areas"] = TrackSchema(many=True).dump([t for t in tracks if t.track_type == "core"])
    data["specialized_pathways"] = TrackSchema(many=True).dump([t for t in tracks if t.track_type == "specialized"])
    data["people"] = TeamProfileListSchema(many=True).dump(people)
    data["stories"] = StoryRefSchema(many=True).dump(stories)  # latest only; filter /stories for all
    return item_response(data)


@api_v1.get("/programs/<slug>/timeline")
def get_program_timeline(slug: str):
    """Phases with their milestones. A small fixed list, so it is not paginated."""
    program = first_or_404(public_program_by_slug(slug))

    phases = db.session.scalars(public_phases(program.id)).all()
    milestones = db.session.scalars(public_milestones(program.id)).all()
    by_phase: dict = {}
    for milestone in milestones:
        by_phase.setdefault(milestone.phase_id, []).append(milestone)

    timeline = []
    for phase in phases:
        entry = PhaseSchema().dump(phase)
        entry["milestones"] = MilestoneSchema(many=True).dump(by_phase.get(phase.id, []))
        timeline.append(entry)
    return item_response(timeline)
