import pytest

from app import create_app


@pytest.fixture()
def app():
    return create_app("testing")


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def demo_client(app):
    """A test client with the demo data loaded (fresh in-memory database per test)."""
    from app.extensions import db
    from app.seed import seed_demo_data

    with app.app_context():
        db.create_all()
        seed_demo_data()
        yield app.test_client()
        db.session.remove()
