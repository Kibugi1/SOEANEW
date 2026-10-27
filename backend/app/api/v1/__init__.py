from flask import Blueprint

api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

# Import route modules after the blueprint exists so they can register on it.
from . import health, locations, programs, stories, team, themes  # noqa: E402,F401
