"""Headline numbers for the admin dashboard home screen."""

from flask import g
from sqlalchemy import func, or_, select

from app.api.decorators import admin_required
from app.api.helpers import item_response
from app.extensions import db
from app.models import (
    ContactEnquiry,
    Partner,
    Program,
    Story,
    StoryTeamMember,
    Subscriber,
    UserRole,
    story_authors,
)
from app.models.constants import PUBLICATION_STATUSES
from app.models.forms import ENQUIRY_INBOXES, ENQUIRY_STATUSES
from app.models.story import STORY_STATUSES

from . import api_v1


def _counts(column, keys, *where):
    """{key: count} for every key, including zeros, plus a total."""
    rows = db.session.execute(
        select(column, func.count()).where(*where).group_by(column)
    ).all()
    counts = {key: 0 for key in keys}
    counts.update({key: total for key, total in rows})
    counts["total"] = sum(counts[key] for key in keys)
    return counts


def _my_story_filter(user):
    """Stories the person wrote, or is bylined on, led or supported."""
    if user.team_profile_id is None:
        return Story.created_by_user_id == user.id
    authored = select(story_authors.c.story_id).where(story_authors.c.profile_id == user.team_profile_id)
    on_team = select(StoryTeamMember.story_id).where(StoryTeamMember.profile_id == user.team_profile_id)
    return or_(Story.created_by_user_id == user.id, Story.id.in_(authored), Story.id.in_(on_team))


@api_v1.get("/admin/dashboard")
@admin_required
def admin_dashboard():
    user = g.current_user
    data = {
        "role": user.role,
        "my_stories": _counts(Story.status, STORY_STATUSES, _my_story_filter(user)),
    }

    if user.role in UserRole.CONTENT_MANAGERS:
        open_statuses = ("new", "in_review")
        data.update({
            "programs": _counts(Program.publication_status, PUBLICATION_STATUSES),
            "stories": _counts(Story.status, STORY_STATUSES),
            "stories_awaiting_review": db.session.scalar(
                select(func.count(Story.id)).where(Story.status == "IN_REVIEW")
            ),
            "partners": _counts(Partner.publication_status, PUBLICATION_STATUSES),
            "enquiries": {
                "by_status": _counts(ContactEnquiry.status, ENQUIRY_STATUSES),
                "open_by_inbox": _counts(
                    ContactEnquiry.inbox, ENQUIRY_INBOXES, ContactEnquiry.status.in_(open_statuses)
                ),
            },
            "subscribers": _counts(Subscriber.status, ("pending", "active", "unsubscribed")),
        })

    return item_response(data)
