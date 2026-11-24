"""SMTP delivery for newsletter confirmation messages."""

import smtplib
from email.message import EmailMessage
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from flask import current_app


def _build_confirmation_url(base_url: str, token: str) -> str:
    """Add the confirmation token without discarding existing URL components."""
    parts = urlsplit(base_url)

    query = parse_qsl(parts.query, keep_blank_values=True)
    query.append(("token", token))

    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            parts.path,
            urlencode(query),
            parts.fragment,
        )
    )


def send_newsletter_confirmation(email: str, token: str) -> None:
    """Send a confirmation message. Raises when delivery is not configured."""
    config = current_app.config

    required = (
        "SMTP_HOST",
        "SMTP_FROM_EMAIL",
        "NEWSLETTER_CONFIRMATION_URL",
    )
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise RuntimeError(
            f"Newsletter email delivery is not configured: {', '.join(missing)}"
        )

    username = config.get("SMTP_USERNAME")
    password = config.get("SMTP_PASSWORD")

    if bool(username) != bool(password):
        raise RuntimeError(
            "SMTP_USERNAME and SMTP_PASSWORD must either both be configured or both be empty."
        )

    confirmation_url = _build_confirmation_url(
        config["NEWSLETTER_CONFIRMATION_URL"],
        token,
    )

    message = EmailMessage()
    message["Subject"] = "Confirm your SOEA newsletter subscription"
    message["From"] = config["SMTP_FROM_EMAIL"]
    message["To"] = email
    message.set_content(
        "Thank you for subscribing to SOEA updates.\n\n"
        "Please confirm your subscription using this link:\n"
        f"{confirmation_url}\n\n"
        "If you did not request this subscription, you can ignore this email."
    )

    with smtplib.SMTP(
        config["SMTP_HOST"],
        config.get("SMTP_PORT", 587),
        timeout=15,
    ) as smtp:
        smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)

def send_newsletter_campaign_email(
    email: str,
    subject: str,
    body_text: str,
    body_html: str | None,
    unsubscribe_token: str,
) -> None:
    """Send one campaign email with a recipient-specific unsubscribe link."""
    from html import escape

    config = current_app.config

    required = (
        "SMTP_HOST",
        "SMTP_FROM_EMAIL",
        "NEWSLETTER_UNSUBSCRIBE_URL",
    )
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise RuntimeError(
            f"Newsletter campaign delivery is not configured: {', '.join(missing)}"
        )

    username = config.get("SMTP_USERNAME")
    password = config.get("SMTP_PASSWORD")

    if bool(username) != bool(password):
        raise RuntimeError(
            "SMTP_USERNAME and SMTP_PASSWORD must either both be configured or both be empty."
        )

    unsubscribe_url = _build_confirmation_url(
        config["NEWSLETTER_UNSUBSCRIBE_URL"],
        unsubscribe_token,
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = config["SMTP_FROM_EMAIL"]
    message["To"] = email
    # Gmail, Outlook and Apple Mail show their own "Unsubscribe" button from these
    # headers. With List-Unsubscribe-Post the mail app POSTs to our API directly
    # (one-click, RFC 8058) and the reader never has to open a page.
    one_click_url = _build_confirmation_url(
        f"{config['API_PUBLIC_URL'].rstrip('/')}/newsletter-subscriptions/one-click",
        unsubscribe_token,
    ) if config.get("API_PUBLIC_URL") else None
    if one_click_url:
        message["List-Unsubscribe"] = f"<{one_click_url}>"
        message["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
    else:
        message["List-Unsubscribe"] = f"<{unsubscribe_url}>"

    text_content = (
        f"{body_text.rstrip()}\n\n"
        "To stop receiving SOEA newsletter emails, use this link:\n"
        f"{unsubscribe_url}\n"
    )
    message.set_content(text_content)

    if body_html:
        html_content = (
            f"{body_html}\n"
            '<p>To stop receiving SOEA newsletter emails, '
            f'<a href="{escape(unsubscribe_url, quote=True)}">'
            "unsubscribe here</a>.</p>"
        )
        message.add_alternative(html_content, subtype="html")

    with smtplib.SMTP(
        config["SMTP_HOST"],
        config.get("SMTP_PORT", 587),
        timeout=15,
    ) as smtp:
        smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)
