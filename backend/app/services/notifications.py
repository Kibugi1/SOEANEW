"""Email alerts for new website messages."""

from flask import current_app

from .mailer import send_email

_INBOX_SETTINGS = {
    "partnerships": "INBOX_PARTNERSHIPS_EMAIL",
    "volunteers": "INBOX_VOLUNTEERS_EMAIL",
    "info": "INBOX_INFO_EMAIL",
}

_KIND_LABELS = {
    "partnership": "Partnership enquiry",
    "volunteer": "Volunteer application",
    "contact": "Website message",
}


def inbox_address(inbox: str) -> str | None:
    setting = _INBOX_SETTINGS.get(inbox)
    return current_app.config.get(setting) if setting else None


def notify_new_enquiry(enquiry) -> bool:
    """Tell the routed inbox that a message arrived.

    The email carries only who wrote and a link to the dashboard, not the full
    message, so personal details stay in the admin inbox rather than in mailboxes.
    """
    address = inbox_address(enquiry.inbox)
    if not address:
        return False

    label = _KIND_LABELS.get(enquiry.kind, "Website message")
    who = enquiry.name + (f" ({enquiry.organization})" if enquiry.organization else "")
    link = f"{current_app.config['ADMIN_DASHBOARD_URL'].rstrip('/')}/inbox/{enquiry.id}"

    body = (
        f"A new {label.lower()} arrived through the SOEA website.\n\n"
        f"Reference: {enquiry.reference}\n"
        f"From: {who}\n"
        f"Inbox: {enquiry.inbox}\n\n"
        f"Open it in the admin dashboard:\n{link}\n"
    )
    return send_email(address, f"[SOEA] {label} {enquiry.reference}", body)


def _story_link(story) -> str:
    return f"{current_app.config['ADMIN_DASHBOARD_URL'].rstrip('/')}/stories/{story.id}"


def notify_review_requested(story, submitter) -> bool:
    """Tell every active admin that a story is waiting for review."""
    from sqlalchemy import select

    from app.extensions import db
    from app.models import User, UserRole

    reviewers = db.session.scalars(
        select(User.email).where(User.role == UserRole.ADMIN, User.is_active.is_(True))
    ).all()
    reviewers = [email for email in reviewers if email != submitter.email]
    if not reviewers:
        return False
    who = submitter.full_name or submitter.email
    body = (
        f"{who} has sent a {story.story_type} for review:\n\n"
        f"  {story.title}\n\n"
        f"Review it in the admin dashboard:\n{_story_link(story)}\n"
    )
    return send_email(reviewers, f"[SOEA] Story waiting for review: {story.title}", body)


def notify_author(story, outcome: str) -> bool:
    """Tell the story's writer it was published or needs changes."""
    writer = story.created_by
    if writer is None or not writer.is_active:
        return False
    if outcome == "published":
        subject = f"[SOEA] Your story is live: {story.title}"
        message = "Your story has been approved and published on the SOEA website."
    elif outcome == "scheduled":
        subject = f"[SOEA] Your story is scheduled: {story.title}"
        message = "Your story has been approved and will be published at the scheduled time."
    else:
        subject = f"[SOEA] Changes requested: {story.title}"
        message = "Your story needs a few changes before it can be published. The reviewer's notes are in the dashboard."
    body = f"{message}\n\n  {story.title}\n\n{_story_link(story)}\n"
    return send_email(writer.email, subject, body)
