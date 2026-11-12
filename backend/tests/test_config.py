import pytest

from app.config import get_config


def test_development_requires_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL is required"):
        get_config("development")


def test_development_requires_postgresql(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///dev.db")

    with pytest.raises(RuntimeError, match="must use PostgreSQL"):
        get_config("development")


def test_development_uses_configured_postgresql(monkeypatch):
    url = "postgresql+psycopg://user:pass@localhost/soea_dev"
    monkeypatch.setenv("DATABASE_URL", url)

    assert get_config("development").SQLALCHEMY_DATABASE_URI == url


def test_testing_uses_in_memory_sqlite(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert get_config("testing").SQLALCHEMY_DATABASE_URI == "sqlite://"


def test_production_requires_secret_key(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        get_config("production")


def test_production_requires_postgresql(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///production.db")

    with pytest.raises(RuntimeError, match="must use PostgreSQL"):
        get_config("production")


def test_production_uses_configured_postgresql(monkeypatch):
    url = "postgresql+psycopg://user:pass@localhost/soea"
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("DATABASE_URL", url)

    assert get_config("production").SQLALCHEMY_DATABASE_URI == url