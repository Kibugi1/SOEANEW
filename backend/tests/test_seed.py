import pytest
from sqlalchemy import func, select

from app.extensions import db
from app.models import Location, Program, Story, TeamProfile, ThematicArea


@pytest.fixture()
def ctx(app):
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()


def counts():
    return (
        db.session.scalar(select(func.count()).select_from(TeamProfile)),
        db.session.scalar(select(func.count()).select_from(Story)),
    )


def content_counts():
    return tuple(db.session.scalar(select(func.count()).select_from(m)) for m in (ThematicArea, Location, Program))


def test_seed_is_idempotent_and_clearable(app, ctx):
    runner = app.test_cli_runner()
    first = runner.invoke(args=["seed-demo"])
    assert first.exit_code == 0, first.output
    assert counts() == (5, 13)
    assert content_counts() == (4, 6, 2)

    runner.invoke(args=["seed-demo"])  # running again must not duplicate
    assert counts() == (5, 13)
    assert content_counts() == (4, 6, 2)

    cleared = runner.invoke(args=["seed-demo", "--clear"])
    assert cleared.exit_code == 0, cleared.output
    assert counts() == (0, 0)
    assert content_counts() == (0, 0, 0)


def test_seed_only_removes_demo_rows(app, ctx):
    db.session.add(TeamProfile(slug="real-person", display_name="Real", role_title="x",
                               role_type="staff", status="draft"))
    db.session.commit()
    runner = app.test_cli_runner()
    runner.invoke(args=["seed-demo"])
    runner.invoke(args=["seed-demo", "--clear"])
    assert counts() == (1, 0)


def test_seed_refuses_in_production(app, ctx):
    app.config["APP_ENV"] = "production"
    result = app.test_cli_runner().invoke(args=["seed-demo"])
    assert result.exit_code != 0
    assert "production" in result.output.lower()
    assert counts() == (0, 0)
