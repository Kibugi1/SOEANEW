from flask import request
from sqlalchemy.orm import selectinload

from app.api.helpers import LATEST_ON_DETAIL, collection_response, first_or_404, item_response, paginate
from app.extensions import db
from app.models import (
    Location,
    Program,
    public_child_locations,
    public_location_by_slug,
    public_locations,
    public_programs_for_location,
    public_stories_for_location,
)
from app.schemas.content import LocationListQuerySchema, LocationSchema, ProgramListSchema
from app.schemas.team import StoryRefSchema

from . import api_v1


@api_v1.get("/locations")
def list_locations():
    args = LocationListQuerySchema().load(request.args.to_dict())
    statement = public_locations().options(selectinload(Location.parent))
    if args.get("type"):
        statement = statement.where(Location.location_type == args["type"])
    page = paginate(statement, args)
    return collection_response(LocationSchema(many=True).dump(page.items), page)


@api_v1.get("/locations/<slug>")
def get_location(slug: str):
    location = first_or_404(public_location_by_slug(slug))

    children = db.session.scalars(
        public_child_locations(location.id).options(selectinload(Location.parent))
    ).all()
    programs = db.session.scalars(
        public_programs_for_location(location.id).options(
            selectinload(Program.themes), selectinload(Program.locations)
        )
    ).all()
    stories = db.session.scalars(public_stories_for_location(location.id).limit(LATEST_ON_DETAIL)).all()

    data = LocationSchema().dump(location)
    data["children"] = LocationSchema(many=True).dump(children)
    data["programs"] = ProgramListSchema(many=True).dump(programs)
    data["stories"] = StoryRefSchema(many=True).dump(stories)
    return item_response(data)
