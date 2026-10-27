import re
import uuid

from flask import Flask, g, request

from .config import get_config
from .errors import register_error_handlers
from .extensions import cors, db, migrate

# Only accept a client-supplied request ID if it is short and harmless (keeps logs clean).
_SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "expose_headers": ["X-Request-ID"],
            }
        },
    )

    # Importing the models package lets Flask-Migrate (Alembic) see every table.
    from . import models  # noqa: F401

    from .api.v1 import api_v1

    app.register_blueprint(api_v1)

    register_error_handlers(app)
    _register_request_hooks(app)

    from .seed import register_cli

    register_cli(app)

    @app.get("/")
    def root():
        return {"name": "SOEA API", "version": "v1", "health": "/api/v1/health"}

    return app


def _register_request_hooks(app: Flask) -> None:
    @app.before_request
    def assign_request_id():
        incoming = request.headers.get("X-Request-ID", "")
        g.request_id = incoming if _SAFE_REQUEST_ID.match(incoming) else uuid.uuid4().hex

    @app.after_request
    def add_request_id_header(response):
        request_id = g.get("request_id")
        if request_id:
            response.headers["X-Request-ID"] = request_id
        return response
