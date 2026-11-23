"""Plain-text email delivery for operational notifications (inbox alerts, review requests).

Newsletter email has its own module (newsletter_email.py) with stricter rules. These
notifications are best effort: the record is already saved, so a delivery failure is
logged and never turned into an error for the person who submitted the form.
"""

import logging
import smtplib
from email.message import EmailMessage

from flask import current_app

logger = logging.getLogger(__name__)


def email_configured() -> bool:
    config = current_app.config
    return bool(config.get("SMTP_HOST") and config.get("SMTP_FROM_EMAIL"))


def send_email(to: list[str] | str, subject: str, body: str, reply_to: str | None = None) -> bool:
    """Send one plain-text email. Returns True when handed to the SMTP server."""
    recipients = [to] if isinstance(to, str) else [address for address in to if address]
    if not recipients:
        return False

    if not email_configured():
        logger.info("Email not configured; skipped %r to %d recipient(s).", subject, len(recipients))
        return False

    config = current_app.config
    username = config.get("SMTP_USERNAME")
    password = config.get("SMTP_PASSWORD")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = config["SMTP_FROM_EMAIL"]
    message["To"] = ", ".join(recipients)
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)

    try:
        with smtplib.SMTP(config["SMTP_HOST"], config.get("SMTP_PORT", 587), timeout=15) as smtp:
            smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Email delivery failed for %r.", subject)
        return False
    return True
