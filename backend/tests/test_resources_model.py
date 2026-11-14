from datetime import date

from app.models import Resource, resource_stories

def test_resource_model_registration():
    assert Resource.__tablename__ == "resource"
    assert resource_stories.name == "resource_stories"

def test_resource_required_fields():
    required = {
        "slug", "title", "resource_type",
        "summary", "publication_status",
    }
    assert required.issubset(Resource.__table__.columns.keys())

def test_resource_optional_relationships():
    optional = {
        "cover_image_id", "program_id",
        "location_id", "phase_id",
    }
    assert optional.issubset(Resource.__table__.columns.keys())

def test_resource_publication_date_type():
    assert str(Resource.__table__.columns["published_on"].type) == "DATE"
