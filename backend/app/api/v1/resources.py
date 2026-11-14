from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from flask import request

from app.api.helpers import collection_response, paginate
from app.models import Location, Phase, Program, Resource
from app.schemas.resources import ResourceQuerySchema, ResourceSchema

from . import api_v1


@api_v1.get("/resources")
def list_resources():
    args = ResourceQuerySchema().load(request.args.to_dict())

    statement = (
        select(Resource)
        .where(Resource.publication_status == "published")
        .options(
            selectinload(Resource.cover_image),
            selectinload(Resource.program),
            selectinload(Resource.location),
            selectinload(Resource.phase).selectinload(Phase.program),
            selectinload(Resource.stories),
        )
    )

    if args.get("type"):
        statement = statement.where(Resource.resource_type == args["type"])

    if args.get("date_from"):
        statement = statement.where(Resource.published_on >= args["date_from"])

    if args.get("date_to"):
        statement = statement.where(Resource.published_on <= args["date_to"])

    if args.get("program"):
        statement = statement.where(
            Resource.program.has(
                and_(
                    Program.slug == args["program"],
                    Program.publication_status == "published",
                )
            )
        )

    if args.get("location"):
        statement = statement.where(
            Resource.location.has(
                and_(
                    Location.slug == args["location"],
                    Location.publication_status == "published",
                )
            )
        )

    if args.get("phase"):
        statement = statement.where(
            Resource.phase.has(
                and_(
                    Phase.slug == args["phase"],
                    Phase.publication_status == "published",
                    Phase.program.has(
                        Program.publication_status == "published"
                    ),
                )
            )
        )

    statement = statement.order_by(
        Resource.published_on.desc().nullslast(),
        Resource.title,
        Resource.id,
    )

    page = paginate(statement, args)
    data = ResourceSchema(many=True).dump(page.items)

    return collection_response(data, page)
