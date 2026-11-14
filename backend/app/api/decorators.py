"""Authentication and role checks for administrative API routes."""

from functools import wraps
from uuid import UUID

from flask import abort, g, request
from itsdangerous import BadData, SignatureExpired
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import User
from app.services.admin_auth import verify_admin_access_token


def admin_required(view):
    """Require a valid, active administrative account."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        scheme, separator, token = header.partition(" ")

        if (
            scheme.lower() != "bearer"
            or not separator
            or not token
            or len(token) > 4096
        ):
            abort(401, description="Valid authentication is required.")

        try:
            claims = verify_admin_access_token(token)
            user_id = UUID(str(claims["user_id"]))
            user = db.session.get(User, user_id)
        except (BadData, SignatureExpired, ValueError, TypeError, KeyError):
            abort(401, description="The access token is invalid or expired.")
        except SQLAlchemyError:
            raise

        if (
            user is None
            or not user.is_active
            or user.token_version != claims["token_version"]
        ):
            abort(401, description="The access token is invalid or expired.")

        g.current_user = user
        return view(*args, **kwargs)

    return wrapped


def roles_required(*allowed_roles):
    """Require authentication and one of the specified account roles."""
    def decorator(view):
        @wraps(view)
        @admin_required
        def wrapped(*args, **kwargs):
            if g.current_user.role not in allowed_roles:
                abort(403, description="You do not have permission to perform this action.")
            return view(*args, **kwargs)

        return wrapped
    return decorator
