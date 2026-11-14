from flask import Blueprint

api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

# Import route modules after the blueprint exists so they can register on it.
from . import health, locations, partners, programs, stories, team, themes  # noqa: E402,F401
from . import resources  # noqa: E402,F401
from . import social  # noqa: E402,F401
from . import forms  # noqa: E402,F401
from . import auth  # noqa: E402,F401


from . import newsletter_campaigns  # noqa: E402,F401
