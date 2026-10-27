from flask import request
from sqlalchemy.orm import selectinload

from app.api.helpers import LATEST_ON_DETAIL, collection_response, first_or_404, item_response, paginate
from app.extensions import db
from app.models import (
    Program,
    TrainingTrack,
    public_programs_for_theme,
    public_stories_for_theme,
    public_theme_by_slug,
    public_themes,
    public_tracks_for_theme,
)
from app.schemas.common import PaginationQuerySchema
from app.schemas.content import ProgramListSchema, ThemeSchema, TrackSchema
from app.schemas.team import StoryRefSchema

from . import api_v1


@api_v1.get("/themes")
def list_themes():
    args = PaginationQuerySchema().load(request.args.to_dict())
    page = paginate(public_themes(), args)
    return collection_response(ThemeSchema(many=True).dump(page.items), page)


@api_v1.get("/themes/<slug>")
def get_theme(slug: str):
    theme = first_or_404(public_theme_by_slug(slug))

    programs = db.session.scalars(
        public_programs_for_theme(theme.id).options(selectinload(Program.themes), selectinload(Program.locations))
    ).all()
    tracks = db.session.scalars(
        public_tracks_for_theme(theme.id).options(selectinload(TrainingTrack.themes))
    ).all()
    stories = db.session.scalars(public_stories_for_theme(theme.id).limit(LATEST_ON_DETAIL)).all()

    data = ThemeSchema().dump(theme)
    data["programs"] = ProgramListSchema(many=True).dump(programs)
    data["tracks"] = TrackSchema(many=True).dump(tracks)
    data["stories"] = StoryRefSchema(many=True).dump(stories)
    return item_response(data)
