from flask import request
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.helpers import collection_response, first_or_404, item_response, like_pattern, paginate
from app.models import (
    Location,
    Phase,
    Program,
    Story,
    StoryTeamMember,
    TeamProfile,
    ThematicArea,
    public_stories,
    public_story_by_slug,
    story_authors,
    story_locations,
    story_programs,
    story_themes,
)
from app.schemas.story import StoryDetailSchema, StoryListQuerySchema, StoryListSchema

from . import api_v1


def _tagged_with(link_table, link_column, model, slug):
    """Story ids tagged with a PUBLISHED program / place / theme that has this slug."""
    return (
        select(link_table.c.story_id)
        .join(model, model.id == link_table.c[link_column])
        .where(model.slug == slug, model.publication_status == "published")
    )


@api_v1.get("/stories")
def list_stories():
    args = StoryListQuerySchema().load(request.args.to_dict())

    statement = public_stories().options(
        selectinload(Story.authors),
        selectinload(Story.programs),
        selectinload(Story.themes),
        selectinload(Story.locations),
    )
    if args.get("type"):
        statement = statement.where(Story.story_type == args["type"])
    if args.get("program"):
        statement = statement.where(Story.id.in_(_tagged_with(story_programs, "program_id", Program, args["program"])))
    if args.get("theme"):
        statement = statement.where(Story.id.in_(_tagged_with(story_themes, "theme_id", ThematicArea, args["theme"])))
    if args.get("location"):
        statement = statement.where(Story.id.in_(_tagged_with(story_locations, "location_id", Location, args["location"])))
    if args.get("author"):
        # Only a PUBLISHED profile can be filtered on; an unpublished slug just matches nothing.
        people = select(TeamProfile.id).where(TeamProfile.slug == args["author"], TeamProfile.status == "published")
        authored = select(story_authors.c.story_id).where(story_authors.c.profile_id.in_(people))
        on_team = select(StoryTeamMember.story_id).where(StoryTeamMember.profile_id.in_(people))
        statement = statement.where(or_(Story.id.in_(authored), Story.id.in_(on_team)))
    search = (args.get("q") or "").strip()
    if search:
        pattern = like_pattern(search)
        statement = statement.where(
            Story.title.ilike(pattern, escape="\\") | Story.summary.ilike(pattern, escape="\\")
        )
    if args["sort"] == "oldest":
        statement = statement.order_by(None).order_by(Story.published_at.asc(), Story.id)

    page = paginate(statement, args)
    return collection_response(StoryListSchema(many=True).dump(page.items), page)


@api_v1.get("/stories/<slug>")
def get_story(slug: str):
    statement = public_story_by_slug(slug).options(
        selectinload(Story.authors),
        selectinload(Story.team_members).selectinload(StoryTeamMember.profile),
        selectinload(Story.programs),
        selectinload(Story.phases).selectinload(Phase.program),
        selectinload(Story.themes),
        selectinload(Story.locations),
    )
    story = first_or_404(statement)
    return item_response(StoryDetailSchema().dump(story))
