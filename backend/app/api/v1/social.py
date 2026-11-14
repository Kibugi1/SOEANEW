from sqlalchemy import select
from flask import request

from app.api.helpers import collection_response, paginate
from app.models import SocialPost
from app.schemas.social import SocialPostListQuerySchema, SocialPostListSchema

from . import api_v1


@api_v1.get("/social-posts")
def list_social_posts():
    args = SocialPostListQuerySchema().load(request.args.to_dict())

    statement = select(SocialPost).where(
        SocialPost.publication_status == "published"
    )

    if args.get("platform"):
        statement = statement.where(
            SocialPost.platform == args["platform"]
        )

    statement = statement.order_by(
        SocialPost.sort_order,
        SocialPost.created_at.desc(),
        SocialPost.id,
    )

    page = paginate(statement, args)
    data = SocialPostListSchema(many=True).dump(page.items)

    return collection_response(data, page)
