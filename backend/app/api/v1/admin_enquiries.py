"""The admin inbox: every message sent through the website (admins and editors)."""

from datetime import datetime, timezone
from uuid import UUID

from flask import abort, g, request
from sqlalchemy import or_, select

from app.api.decorators import roles_required
from app.api.helpers import collection_response, item_response, like_pattern, paginate
from app.errors import error_response
from app.extensions import db
from app.models import AuditEvent, ContactEnquiry, User, UserRole
from app.schemas.admin import (
    EnquiryDetailSchema,
    EnquiryListQuerySchema,
    EnquirySummarySchema,
    EnquiryUpdateSchema,
)

from . import api_v1

_detail_schema = EnquiryDetailSchema()


def _get_enquiry(enquiry_id) -> ContactEnquiry:
    try:
        parsed = UUID(str(enquiry_id))
    except (ValueError, TypeError, AttributeError):
        abort(404)
    enquiry = db.session.get(ContactEnquiry, parsed)
    if enquiry is None:
        abort(404)
    return enquiry


def _audit(action, enquiry, details=None):
    # Only ids and field names: the audit log must not become a copy of the message.
    db.session.add(AuditEvent(
        actor_user_id=g.current_user.id,
        action=action,
        target_type="contact_enquiry",
        target_id=str(enquiry.id),
        details=details or {},
    ))


@api_v1.get("/admin/enquiries")
@roles_required(*UserRole.CONTENT_MANAGERS)
def list_enquiries():
    args = EnquiryListQuerySchema().load(request.args)

    statement = select(ContactEnquiry)
    for field in ("kind", "inbox", "status"):
        if args.get(field):
            statement = statement.where(getattr(ContactEnquiry, field) == args[field])
    if args.get("q"):
        pattern = like_pattern(args["q"])
        statement = statement.where(or_(
            ContactEnquiry.name.ilike(pattern, escape="\\"),
            ContactEnquiry.organization.ilike(pattern, escape="\\"),
            ContactEnquiry.email.ilike(pattern, escape="\\"),
            ContactEnquiry.reference.ilike(pattern, escape="\\"),
        ))

    statement = statement.order_by(ContactEnquiry.created_at.desc(), ContactEnquiry.id)
    pagination = paginate(statement, args)
    return collection_response(EnquirySummarySchema(many=True).dump(pagination.items), pagination)


@api_v1.get("/admin/enquiries/<enquiry_id>")
@roles_required(*UserRole.CONTENT_MANAGERS)
def get_enquiry(enquiry_id):
    return item_response(_detail_schema.dump(_get_enquiry(enquiry_id)))


@api_v1.patch("/admin/enquiries/<enquiry_id>")
@roles_required(*UserRole.CONTENT_MANAGERS)
def update_enquiry(enquiry_id):
    enquiry = _get_enquiry(enquiry_id)
    data = EnquiryUpdateSchema().load(request.get_json(silent=True) or {})
    changed = []

    if "status" in data and data["status"] != enquiry.status:
        enquiry.status = data["status"]
        enquiry.status_changed_at = datetime.now(timezone.utc)
        changed.append("status")

    if "internal_notes" in data:
        enquiry.internal_notes = data["internal_notes"]
        changed.append("internal_notes")

    if "assigned_to_user_id" in data:
        assignee_id = data["assigned_to_user_id"]
        if assignee_id is not None:
            assignee = db.session.get(User, assignee_id)
            if assignee is None or not assignee.is_active or assignee.role not in UserRole.CONTENT_MANAGERS:
                return error_response(
                    400, "VALIDATION_ERROR", "Please correct the highlighted fields.",
                    {"assigned_to_user_id": ["Assign to an active admin or editor account."]},
                )
        enquiry.assigned_to_user_id = assignee_id
        changed.append("assigned_to_user_id")

    _audit("inbox.enquiry_updated", enquiry, {"fields": changed, "status": enquiry.status})
    db.session.commit()
    return item_response(_detail_schema.dump(enquiry))


@api_v1.delete("/admin/enquiries/<enquiry_id>")
@roles_required(UserRole.ADMIN)
def delete_enquiry(enquiry_id):
    """Permanently erase a message, e.g. when the sender asks for their data to be removed."""
    enquiry = _get_enquiry(enquiry_id)
    _audit("inbox.enquiry_deleted", enquiry, {"kind": enquiry.kind, "reference": enquiry.reference})
    db.session.delete(enquiry)
    db.session.commit()
    return "", 204
