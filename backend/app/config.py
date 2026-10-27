"""Configuration, selected by the APP_ENV environment variable.

APP_ENV: development (default) | testing | production

Variables read from the environment (or backend/.env):
    SECRET_KEY    required in production
    DATABASE_URL  required in production; optional in development (falls back to SQLite)
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


class DevelopmentConfig(BaseConfig):
    APP_ENV = "development"
    DEBUG = True
    # Convenience only. Do not treat the SQLite fallback as production-ready, and
    # avoid PostgreSQL-only column types until PostgreSQL is your dev database.
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-not-a-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or (
        "sqlite:///" + (BASE_DIR / "dev.db").as_posix()
    )


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

    if name == "production":
        missing = [key for key in ("SECRET_KEY", "DATABASE_URL") if not os.getenv(key)]
        if missing:
            raise RuntimeError(f"Missing required environment variables for production: {missing}")
    return config
