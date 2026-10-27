from flask import request
from sqlalchemy.orm import selectinload

from app.api.helpers import (
    LATEST_ON_DETAIL,
    collection_response,
    first_or_404,
    item_response,
    like_pattern,
    paginate,
)
from app.extensions import db
from app.models import (
    Story,
    TeamProfile,
    public_profile_by_slug,
    public_profiles,
    public_stories_for_profile,
)
from app.schemas.common import PaginationQuerySchema
from app.schemas.story import StoryListSchema
from app.schemas.team import (
    StoryRefSchema,
    TeamListQuerySchema,
    TeamProfileDetailSchema,
    TeamProfileListSchema,
)

from . import api_v1


@api_v1.get("/team")
def list_team():
    args = TeamListQuerySchema().load(request.args.to_dict())

    statement = public_profiles()
    if args.get("role"):
        statement = statement.where(TeamProfile.role_type == args["role"])
    search = (args.get("q") or "").strip()
    if search:
        pattern = like_pattern(search)
        statement = statement.where(
            TeamProfile.display_name.ilike(pattern, escape="\\")
            | TeamProfile.role_title.ilike(pattern, escape="\\")
        )

    page = paginate(statement, args)
    return collection_response(TeamProfileListSchema(many=True).dump(page.items), page)


@api_v1.get("/team/<slug>")
def get_team_profile(slug: str):
    profile = first_or_404(public_profile_by_slug(slug))

    latest = db.session.scalars(
        public_stories_for_profile(profile.id).limit(LATEST_ON_DETAIL)
    ).all()

    data = TeamProfileDetailSchema().dump(profile)
    data["stories"] = StoryRefSchema(many=True).dump(latest)  # latest only; full list below
    return item_response(data)


@api_v1.get("/team/<slug>/stories")
def list_team_profile_stories(slug: str):
    profile = first_or_404(public_profile_by_slug(slug))
    args = PaginationQuerySchema().load(request.args.to_dict())

    statement = public_stories_for_profile(profile.id).options(
        selectinload(Story.authors),
        selectinload(Story.programs),
        selectinload(Story.themes),
        selectinload(Story.locations),
    )
    page = paginate(statement, args)
    return collection_response(StoryListSchema(many=True).dump(page.items), page)
