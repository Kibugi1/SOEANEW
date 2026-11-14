"""Administrative newsletter campaign endpoints."""

from datetime import datetime, timezone
from uuid import UUID

from flask import abort, g, request
from sqlalchemy import func, select

from app.api.decorators import roles_required
from app.api.helpers import collection_response, item_response, paginate
from app.extensions import db
from app.models import (
    AuditEvent,
    NewsletterCampaign,
    NewsletterDelivery,
    UserRole,
)
from app.schemas.common import PaginationQuerySchema
from app.schemas.newsletter_campaign import (
    NewsletterCampaignCreateSchema,
    NewsletterCampaignResponseSchema,
    NewsletterCampaignScheduleSchema,
    NewsletterCampaignUpdateSchema,
)
from app.services.newsletter_campaigns import send_campaign

from . import api_v1


_CAMPAIGN_ROLES = (UserRole.ADMIN, UserRole.EDITOR)
_campaign_schema = NewsletterCampaignResponseSchema()


def _get_campaign(campaign_id):
    try:
        parsed_id = UUID(str(campaign_id))
    except (ValueError, TypeError, AttributeError):
        abort(404)

    campaign = db.session.get(NewsletterCampaign, parsed_id)
    if campaign is None:
        abort(404)
    return campaign


def _delivery_counts(campaign_id):
    counts = {
        "pending": 0,
        "sent": 0,
        "failed": 0,
    }

    rows = db.session.execute(
        select(
            NewsletterDelivery.status,
            func.count(NewsletterDelivery.id),
        )
        .where(NewsletterDelivery.campaign_id == campaign_id)
        .group_by(NewsletterDelivery.status)
    ).all()

    for status, count in rows:
        counts[status] = count

    return counts


def _campaign_data(campaign):
    data = _campaign_schema.dump(campaign)
    data["delivery_counts"] = _delivery_counts(campaign.id)
    return data


def _audit(action, campaign, details=None):
    db.session.add(AuditEvent(
        actor_user_id=g.current_user.id,
        action=action,
        target_type="newsletter_campaign",
        target_id=str(campaign.id),
        details=details or {},
    ))


@api_v1.post("/admin/newsletter-campaigns")
@roles_required(*_CAMPAIGN_ROLES)
def create_newsletter_campaign():
    data = NewsletterCampaignCreateSchema().load(
        request.get_json(silent=True) or {}
    )

    if not data["subject"].strip() or not data["body_text"].strip():
        abort(400, description="Subject and text content cannot be blank.")

    campaign = NewsletterCampaign(
        subject=data["subject"].strip(),
        body_text=data["body_text"],
        body_html=data.get("body_html"),
        status="draft",
        created_by_user_id=g.current_user.id,
    )

    db.session.add(campaign)
    db.session.flush()
    _audit("newsletter.campaign_created", campaign)
    db.session.commit()

    return item_response(_campaign_data(campaign)), 201


@api_v1.get("/admin/newsletter-campaigns")
@roles_required(*_CAMPAIGN_ROLES)
def list_newsletter_campaigns():
    args = PaginationQuerySchema().load(request.args)

    pagination = paginate(
        select(NewsletterCampaign).order_by(
            NewsletterCampaign.created_at.desc(),
            NewsletterCampaign.id.desc(),
        ),
        args,
    )

    data = [_campaign_data(campaign) for campaign in pagination.items]
    return collection_response(data, pagination)


@api_v1.get("/admin/newsletter-campaigns/<campaign_id>")
@roles_required(*_CAMPAIGN_ROLES)
def get_newsletter_campaign(campaign_id):
    campaign = _get_campaign(campaign_id)
    return item_response(_campaign_data(campaign))


@api_v1.patch("/admin/newsletter-campaigns/<campaign_id>")
@roles_required(*_CAMPAIGN_ROLES)
def update_newsletter_campaign(campaign_id):
    campaign = _get_campaign(campaign_id)

    if campaign.status != "draft":
        abort(
            409,
            description="Only draft campaigns can be edited.",
        )

    data = NewsletterCampaignUpdateSchema().load(
        request.get_json(silent=True) or {}
    )

    if not data:
        abort(400, description="At least one campaign field is required.")

    if "subject" in data:
        if not data["subject"].strip():
            abort(400, description="Subject cannot be blank.")
        campaign.subject = data["subject"].strip()

    if "body_text" in data:
        if not data["body_text"].strip():
            abort(400, description="Text content cannot be blank.")
        campaign.body_text = data["body_text"]

    if "body_html" in data:
        campaign.body_html = data["body_html"]

    _audit("newsletter.campaign_updated", campaign, {
        "fields": sorted(data.keys()),
    })
    db.session.commit()

    return item_response(_campaign_data(campaign))


@api_v1.post("/admin/newsletter-campaigns/<campaign_id>/schedule")
@roles_required(*_CAMPAIGN_ROLES)
def schedule_newsletter_campaign(campaign_id):
    campaign = _get_campaign(campaign_id)

    if campaign.status != "draft":
        abort(409, description="Only draft campaigns can be scheduled.")

    data = NewsletterCampaignScheduleSchema().load(
        request.get_json(silent=True) or {}
    )
    scheduled_at = data["scheduled_at"]

    if scheduled_at.tzinfo is None or scheduled_at.utcoffset() is None:
        abort(
            400,
            description="scheduled_at must include a timezone.",
        )

    scheduled_at = scheduled_at.astimezone(timezone.utc)
    now = datetime.now(timezone.utc)

    if scheduled_at <= now:
        abort(400, description="scheduled_at must be in the future.")

    campaign.scheduled_at = scheduled_at
    campaign.status = "scheduled"

    _audit("newsletter.campaign_scheduled", campaign, {
        "scheduled_at": scheduled_at.isoformat(),
    })
    db.session.commit()

    return item_response(_campaign_data(campaign))


@api_v1.post("/admin/newsletter-campaigns/<campaign_id>/send")
@roles_required(*_CAMPAIGN_ROLES)
def send_newsletter_campaign(campaign_id):
    campaign = _get_campaign(campaign_id)

    if campaign.status == "scheduled":
        scheduled_at = campaign.scheduled_at

        if scheduled_at is None:
            abort(409, description="Scheduled campaign has no scheduled time.")

        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

        if scheduled_at > datetime.now(timezone.utc):
            abort(
                409,
                description="This campaign is scheduled for a future time.",
            )

    elif campaign.status not in ("draft", "failed"):
        abort(
            409,
            description="This campaign cannot be sent in its current state.",
        )

    try:
        result = send_campaign(campaign.id, g.current_user.id)
    except ValueError as exc:
        if "not found" in str(exc).lower():
            abort(404)
        abort(409, description="The campaign cannot be sent in its current state.")

    return item_response(result)
