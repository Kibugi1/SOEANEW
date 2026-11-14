"""Configuration, selected by the APP_ENV environment variable.

APP_ENV: development (default) | testing | production

Variables read from the environment (or backend/.env):
    SECRET_KEY    required in production
    DATABASE_URL  required in development and production; must use PostgreSQL
    RATELIMIT_STORAGE_URI  required in production; use Redis (redis:// or rediss://)
    CORS_ORIGINS  comma-separated exact origins; defaults to http://localhost:3000
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    NEWSLETTER_CONSENT_TEXT_VERSION = os.getenv("NEWSLETTER_CONSENT_TEXT_VERSION", "v1")
    NEWSLETTER_TOKEN_MAX_AGE = 60 * 60 * 24
    ADMIN_ACCESS_TOKEN_MAX_AGE = 900
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    NEWSLETTER_CONFIRMATION_URL = os.getenv("NEWSLETTER_CONFIRMATION_URL")
    NEWSLETTER_UNSUBSCRIBE_URL = os.getenv("NEWSLETTER_UNSUBSCRIBE_URL")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")


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
        config = CONFIGS[name]
    except KeyError:
        raise RuntimeError(f"Unknown APP_ENV {name!r}; expected one of {sorted(CONFIGS)}") from None

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
