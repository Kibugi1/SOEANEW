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
    monkeypatch.setenv("CORS_ORIGINS", "https://soea.example.org")
    monkeypatch.setenv("SECRET_KEY", "test-production-secret-key-at-least-32-chars")
    monkeypatch.setenv("RATELIMIT_STORAGE_URI", "redis://localhost:6379/0")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///production.db")

    with pytest.raises(RuntimeError, match="must use PostgreSQL"):
        get_config("production")


def test_production_uses_configured_postgresql(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://soea.example.org")
    url = "postgresql+psycopg://user:pass@localhost/soea"
    monkeypatch.setenv("SECRET_KEY", "test-production-secret-key-at-least-32-chars")
    monkeypatch.setenv("RATELIMIT_STORAGE_URI", "redis://localhost:6379/0")
    monkeypatch.setenv("DATABASE_URL", url)

    assert get_config("production").SQLALCHEMY_DATABASE_URI == url


def test_production_rejects_in_memory_rate_limit_storage(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://soea.example.org")
    monkeypatch.setenv("SECRET_KEY", "test-production-secret-key-at-least-32-chars")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv("RATELIMIT_STORAGE_URI", "memory://")

    with pytest.raises(RuntimeError, match="must use Redis"):
        get_config("production")

def test_production_rejects_short_secret_key(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "too-short")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )

    with pytest.raises(RuntimeError, match="at least 32 characters"):
        get_config("production")


def test_production_requires_explicit_cors_origins(monkeypatch):
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-production-secret-key-at-least-32-chars",
    )
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        get_config("production")


def test_production_rejects_empty_cors_origins(monkeypatch):
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-production-secret-key-at-least-32-chars",
    )
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )
    monkeypatch.setenv("CORS_ORIGINS", " , ")

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        get_config("production")


def test_production_rejects_localhost_cors_origin(monkeypatch):
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-production-secret-key-at-least-32-chars",
    )
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "http://localhost:3000",
    )

    with pytest.raises(RuntimeError, match="localhost"):
        get_config("production")


def test_production_uses_explicit_cors_origins(monkeypatch):
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-production-secret-key-at-least-32-chars",
    )
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://soea.example.org,https://admin.soea.example.org",
    )

    config = get_config("production")

    assert config.CORS_ORIGINS == [
        "https://soea.example.org",
        "https://admin.soea.example.org",
    ]


def test_smtp_port_uses_environment(monkeypatch):
    monkeypatch.setenv("SMTP_PORT", "2525")

    assert get_config("testing").SMTP_PORT == 2525


def test_smtp_port_rejects_non_numeric_value(monkeypatch):
    monkeypatch.setenv("SMTP_PORT", "not-a-port")

    with pytest.raises(RuntimeError, match="SMTP_PORT"):
        get_config("testing")


@pytest.mark.parametrize("port", ["0", "65536", "-1"])
def test_smtp_port_rejects_out_of_range_values(monkeypatch, port):
    monkeypatch.setenv("SMTP_PORT", port)

    with pytest.raises(RuntimeError, match="SMTP_PORT"):
        get_config("testing")


def test_configuration_instances_do_not_share_environment_values(monkeypatch):
    first_url = "postgresql+psycopg://user:pass@localhost/first"
    second_url = "postgresql+psycopg://user:pass@localhost/second"

    monkeypatch.setenv("DATABASE_URL", first_url)
    first_config = get_config("development")

    monkeypatch.setenv("DATABASE_URL", second_url)
    second_config = get_config("development")

    assert first_config.SQLALCHEMY_DATABASE_URI == first_url
    assert second_config.SQLALCHEMY_DATABASE_URI == second_url


@pytest.mark.parametrize(
    "origin",
    [
        "https://*",
        "https://bad host.example.org",
        "https://.example.org",
        "https://example..org",
        "https://-bad.example.org",
        "https://bad-.example.org",
    ],
)
def test_production_rejects_wildcard_and_malformed_cors_hosts(
    monkeypatch, origin
):
    monkeypatch.setenv(
        "SECRET_KEY",
        "test-production-secret-key-at-least-32-chars",
    )
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost/soea",
    )
    monkeypatch.setenv(
        "RATELIMIT_STORAGE_URI",
        "redis://localhost:6379/0",
    )
    monkeypatch.setenv("CORS_ORIGINS", origin)

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        get_config("production")
