"""Configuration, selected by the APP_ENV environment variable.

APP_ENV: development (default) | testing | production

Variables read from the environment (or backend/.env):
    SECRET_KEY    required in production
    DATABASE_URL  required in development and production; must use PostgreSQL
    RATELIMIT_STORAGE_URI  required in production; use Redis (redis:// or rediss://)
    CORS_ORIGINS  comma-separated exact origins; defaults to http://localhost:3000
"""
import os
import ipaddress
import re
from urllib.parse import urlsplit
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _valid_cors_hostname(hostname: str) -> bool:
    """Return whether a hostname is a valid DNS name or IP address."""
    if not hostname or '*' in hostname or len(hostname) > 253:
        return False

    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        pass

    labels = hostname.split('.')
    if len(labels) < 2:
        return False

    return all(
        re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?', label)
        is not None
        for label in labels
    )


def _get_smtp_port() -> int:
    raw_port = os.getenv("SMTP_PORT", "587")
    try:
        port = int(raw_port)
    except (TypeError, ValueError):
        raise RuntimeError(
            "SMTP_PORT must be an integer between 1 and 65535."
        ) from None

    if not 1 <= port <= 65535:
        raise RuntimeError(
            "SMTP_PORT must be an integer between 1 and 65535."
        )
    return port


class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    NEWSLETTER_CONSENT_TEXT_VERSION = os.getenv("NEWSLETTER_CONSENT_TEXT_VERSION", "v1")
    NEWSLETTER_TOKEN_MAX_AGE = 60 * 60 * 24
    ADMIN_ACCESS_TOKEN_MAX_AGE = 900
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = 587
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    NEWSLETTER_CONFIRMATION_URL = os.getenv("NEWSLETTER_CONFIRMATION_URL")
    NEWSLETTER_UNSUBSCRIBE_URL = os.getenv("NEWSLETTER_UNSUBSCRIBE_URL")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    # Where website messages are announced by email. Every message is stored in the
    # admin inbox whether or not these are set; an empty value skips the email.
    INBOX_PARTNERSHIPS_EMAIL = os.getenv("INBOX_PARTNERSHIPS_EMAIL")
    INBOX_VOLUNTEERS_EMAIL = os.getenv("INBOX_VOLUNTEERS_EMAIL")
    INBOX_INFO_EMAIL = os.getenv("INBOX_INFO_EMAIL")
    # Base URL of the admin dashboard, used for links in notification emails.
    ADMIN_DASHBOARD_URL = os.getenv("ADMIN_DASHBOARD_URL", "http://localhost:3000/admin")

    # Uploaded files. The API serves them from MEDIA_URL_PATH in development; in
    # production put a web server or CDN in front and set MEDIA_BASE_URL to it.
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "instance" / "uploads"))
    MEDIA_URL_PATH = "/media"
    MEDIA_BASE_URL = os.getenv("MEDIA_BASE_URL", "http://localhost:5000/media")
    MAX_IMAGE_BYTES = 10 * 1024 * 1024
    MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
    # Longest side of a stored image; larger photos are scaled down on upload.
    MAX_IMAGE_DIMENSION = 2400
    # Requests above this are refused before they are read (largest file + form overhead).
    MAX_CONTENT_LENGTH = 26 * 1024 * 1024


class DevelopmentConfig(BaseConfig):
    APP_ENV = "development"
    DEBUG = True
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-not-a-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

class TestingConfig(BaseConfig):
    APP_ENV = "testing"
    TESTING = True
    SECRET_KEY = "test-only-not-a-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite://"  # in-memory; never touches real data
    MEDIA_BASE_URL = "http://testserver/media"
    CORS_ORIGINS = ["http://localhost:3000"]


class ProductionConfig(BaseConfig):
    APP_ENV = "production"
    DEBUG = False


CONFIGS = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str | None = None):
    name = (name or os.getenv("APP_ENV", "development")).lower()
    try:
        config_class = CONFIGS[name]
    except KeyError:
        raise RuntimeError(f"Unknown APP_ENV {name!r}; expected one of {sorted(CONFIGS)}") from None

    # Give every call its own class so environment-specific values
    # cannot mutate configuration returned by earlier calls.
    config = type(f"{name.title()}ConfigInstance", (config_class,), {})
    config.SMTP_PORT = _get_smtp_port()

    if name == "development":
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is required for development. Configure PostgreSQL in backend/.env."
            )
        if not database_url.startswith(("postgresql://", "postgresql+")):
            raise RuntimeError(
                "Development DATABASE_URL must use PostgreSQL."
            )
        config.SQLALCHEMY_DATABASE_URI = database_url
    if name == "production":
        required = ("SECRET_KEY", "DATABASE_URL", "RATELIMIT_STORAGE_URI")
        missing = [key for key in required if not os.getenv(key)]
        if missing:
            raise RuntimeError(f"Missing required environment variables for production: {missing}")

        secret_key = os.getenv("SECRET_KEY", "")

        if len(secret_key) < 32:
            raise RuntimeError(
                "Production SECRET_KEY must be at least 32 characters long."
            )

        config.SECRET_KEY = secret_key

        cors_origins = _split_csv(os.getenv("CORS_ORIGINS", ""))
        if not cors_origins:
            raise RuntimeError(
                "CORS_ORIGINS is required in production and must contain "
                "at least one HTTPS origin."
            )

        for origin in cors_origins:
            try:
                parsed_origin = urlsplit(origin)
                parsed_origin.port
            except ValueError:
                raise RuntimeError(
                    f"Invalid production CORS origin: {origin!r}."
                ) from None

            hostname = (parsed_origin.hostname or "").lower()

            if (
                parsed_origin.scheme != "https"
                or not parsed_origin.netloc
                or not hostname
                or not _valid_cors_hostname(hostname)
                or hostname == "localhost"
                or hostname.endswith(".localhost")
                or hostname in ("127.0.0.1", "::1", "0.0.0.0")
                or parsed_origin.username is not None
                or parsed_origin.password is not None
                or parsed_origin.path
                or parsed_origin.query
                or parsed_origin.fragment
            ):
                raise RuntimeError(
                    "Production CORS_ORIGINS must contain valid HTTPS "
                    f"origins without localhost or paths: {origin!r}."
                )

        config.CORS_ORIGINS = cors_origins

        storage_uri = os.getenv("RATELIMIT_STORAGE_URI", "")
        if not storage_uri.startswith(("redis://", "rediss://")):
            raise RuntimeError(
                "Production RATELIMIT_STORAGE_URI must use Redis (redis:// or rediss://)."
            )
        config.RATELIMIT_STORAGE_URI = storage_uri

        database_url = os.getenv("DATABASE_URL")
        if not database_url.startswith(("postgresql://", "postgresql+")):
            raise RuntimeError("Production DATABASE_URL must use PostgreSQL.")

        config.SQLALCHEMY_DATABASE_URI = database_url
    return config
