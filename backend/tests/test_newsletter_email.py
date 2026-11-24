from urllib.parse import parse_qs, urlsplit

import pytest

from app.services import newsletter_email


class FakeSMTP:
    def __init__(self, host, port, timeout):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.started_tls = False
        self.login_details = None
        self.message = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def starttls(self):
        self.started_tls = True

    def login(self, username, password):
        self.login_details = (username, password)

    def send_message(self, message):
        self.message = message


def configure_email(app):
    app.config.update(
        SMTP_HOST="smtp.example.com",
        SMTP_PORT=587,
        SMTP_FROM_EMAIL="updates@soea.example",
        SMTP_USERNAME="smtp-user",
        SMTP_PASSWORD="smtp-password",
        NEWSLETTER_CONFIRMATION_URL=(
            "https://soea.example/confirm?source=newsletter#confirmation"
        ),
    )


def test_confirmation_email_is_sent_with_valid_url_and_readable_body(
    app, monkeypatch
):
    with app.app_context():
        configure_email(app)
        fake_smtp = FakeSMTP("smtp.example.com", 587, 15)

        monkeypatch.setattr(
            newsletter_email.smtplib,
            "SMTP",
            lambda host, port, timeout: fake_smtp,
        )

        newsletter_email.send_newsletter_confirmation(
            "person@example.com",
            "signed-token",
        )

        assert fake_smtp.started_tls is True
        assert fake_smtp.login_details == ("smtp-user", "smtp-password")

        message = fake_smtp.message
        assert message["To"] == "person@example.com"
        assert message["From"] == "updates@soea.example"

        body = message.get_content()
        assert "\n\n" in body
        assert "\\n" not in body

        url_line = next(
            line for line in body.splitlines()
            if line.startswith("https://")
        )
        parts = urlsplit(url_line)

        assert parts.fragment == "confirmation"
        assert parse_qs(parts.query) == {
            "source": ["newsletter"],
            "token": ["signed-token"],
        }


def test_confirmation_email_requires_configuration(app):
    with app.app_context():
        app.config.update(
            SMTP_HOST=None,
            SMTP_FROM_EMAIL=None,
            NEWSLETTER_CONFIRMATION_URL=None,
        )

        with pytest.raises(RuntimeError, match="not configured"):
            newsletter_email.send_newsletter_confirmation(
                "person@example.com",
                "signed-token",
            )


def test_confirmation_email_rejects_incomplete_smtp_credentials(
    app, monkeypatch
):
    with app.app_context():
        configure_email(app)
        app.config["SMTP_PASSWORD"] = None

        with pytest.raises(RuntimeError, match="must either both"):
            newsletter_email.send_newsletter_confirmation(
                "person@example.com",
                "signed-token",
            )


def test_campaign_email_includes_personal_unsubscribe_link(
    app, monkeypatch
):
    with app.app_context():
        configure_email(app)
        app.config["NEWSLETTER_UNSUBSCRIBE_URL"] = (
            "https://soea.example/unsubscribe?source=campaign#manage"
        )

        fake_smtp = FakeSMTP("smtp.example.com", 587, 15)
        monkeypatch.setattr(
            newsletter_email.smtplib,
            "SMTP",
            lambda host, port, timeout: fake_smtp,
        )

        newsletter_email.send_newsletter_campaign_email(
            email="reader@example.com",
            subject="SOEA November updates",
            body_text="Thank you for supporting SOEA.",
            body_html="<h1>November updates</h1>",
            unsubscribe_token="recipient-specific-token",
        )

        message = fake_smtp.message
        assert message["To"] == "reader@example.com"
        assert message["Subject"] == "SOEA November updates"
        assert "recipient-specific-token" in message["List-Unsubscribe"]
        assert "/newsletter-subscriptions/one-click?token=" in message["List-Unsubscribe"]
        assert message["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"

        parts = list(message.walk())
        text_part = next(
            part for part in parts
            if part.get_content_type() == "text/plain"
        )
        html_part = next(
            part for part in parts
            if part.get_content_type() == "text/html"
        )

        assert "Thank you for supporting SOEA." in text_part.get_content()
        assert "recipient-specific-token" in text_part.get_content()
        assert "<h1>November updates</h1>" in html_part.get_content()
        assert "unsubscribe here" in html_part.get_content()


def test_campaign_email_supports_plain_text_only(app, monkeypatch):
    with app.app_context():
        configure_email(app)
        app.config["NEWSLETTER_UNSUBSCRIBE_URL"] = (
            "https://soea.example/unsubscribe"
        )

        fake_smtp = FakeSMTP("smtp.example.com", 587, 15)
        monkeypatch.setattr(
            newsletter_email.smtplib,
            "SMTP",
            lambda host, port, timeout: fake_smtp,
        )

        newsletter_email.send_newsletter_campaign_email(
            email="reader@example.com",
            subject="SOEA updates",
            body_text="Latest news from SOEA.",
            body_html=None,
            unsubscribe_token="plain-text-token",
        )

        message = fake_smtp.message
        assert message.get_content_type() == "text/plain"
        assert "plain-text-token" in message.get_content()


def test_campaign_email_requires_unsubscribe_configuration(app):
    with app.app_context():
        configure_email(app)
        app.config["NEWSLETTER_UNSUBSCRIBE_URL"] = None

        with pytest.raises(RuntimeError, match="not configured"):
            newsletter_email.send_newsletter_campaign_email(
                email="reader@example.com",
                subject="SOEA updates",
                body_text="Latest news.",
                body_html=None,
                unsubscribe_token="signed-token",
            )


def test_campaign_email_falls_back_to_page_link_without_api_url(app, monkeypatch):
    with app.app_context():
        configure_email(app)
        app.config["NEWSLETTER_UNSUBSCRIBE_URL"] = "https://soea.example/unsubscribe"
        app.config["API_PUBLIC_URL"] = None
        fake_smtp = FakeSMTP("smtp.example.com", 587, 15)
        monkeypatch.setattr(newsletter_email.smtplib, "SMTP", lambda host, port, timeout: fake_smtp)

        newsletter_email.send_newsletter_campaign_email(
            email="reader@example.com", subject="Hi", body_text="Body", body_html=None,
            unsubscribe_token="tok",
        )

        message = fake_smtp.message
        assert message["List-Unsubscribe"] == "<https://soea.example/unsubscribe?token=tok>"
        assert message["List-Unsubscribe-Post"] is None
