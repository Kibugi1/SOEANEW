"""Account management for the admin dashboard (admin role only).

Accounts are created with a temporary password that the person must replace at first
login. Accounts are deactivated rather than deleted, so the audit trail keeps its actors.
"""

from uuid import UUID

from flask import abort, g, request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.api.decorators import roles_required
from app.api.helpers import collection_response, item_response, paginate
from app.errors import error_response
from app.extensions import db
from app.models import AuditEvent, TeamProfile, User, UserRole
from app.schemas.admin import (
    PasswordResetSchema,
    ProfileOptionSchema,
    UserCreateSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.schemas.common import PaginationQuerySchema

from . import api_v1

_user_schema = UserSchema()


def _get_user(user_id) -> User:
    try:
        parsed = UUID(str(user_id))
    except (ValueError, TypeError, AttributeError):
        abort(404)
    user = db.session.get(User, parsed)
    if user is None:
        abort(404)
    return user


def _audit(action, user, details=None):
    db.session.add(AuditEvent(
        actor_user_id=g.current_user.id,
        action=action,
        target_type="user",
        target_id=str(user.id),
        details=details or {},
    ))


def _profile_for_slug(slug, exclude_user_id=None):
    """Resolve a profile slug for linking; returns (profile, error_response or None)."""
    profile = db.session.execute(
        select(TeamProfile).where(TeamProfile.slug == slug)
    ).scalar_one_or_none()
    if profile is None:
        return None, error_response(
            400, "VALIDATION_ERROR", "Please correct the highlighted fields.",
            {"team_profile_slug": ["No team profile has this slug."]},
        )
    owner = db.session.execute(
        select(User).where(User.team_profile_id == profile.id)
    ).scalar_one_or_none()
    if owner is not None and owner.id != exclude_user_id:
        return None, error_response(
            409, "CONFLICT", "That profile is already linked to another account.",
        )
    return profile, None


def _active_admin_count() -> int:
    return db.session.scalar(
        select(func.count(User.id)).where(User.role == UserRole.ADMIN, User.is_active.is_(True))
    )


@api_v1.get("/admin/users")
@roles_required(UserRole.ADMIN)
def list_users():
    args = PaginationQuerySchema().load(request.args)
    pagination = paginate(select(User).order_by(User.created_at, User.id), args)
    return collection_response(_user_schema.dump(pagination.items, many=True), pagination)


@api_v1.post("/admin/users")
@roles_required(UserRole.ADMIN)
def create_user():
    data = UserCreateSchema().load(request.get_json(silent=True) or {})
    email = data["email"].strip().lower()

    if db.session.execute(select(User.id).where(User.email == email)).first():
        return error_response(409, "CONFLICT", "An account with that email already exists.")

    user = User(
        email=email,
        full_name=data["full_name"].strip(),
        role=data["role"],
        must_change_password=True,
    )
    user.set_password(data["temporary_password"])

    if data.get("team_profile_slug"):
        profile, error = _profile_for_slug(data["team_profile_slug"])
        if error:
            return error
        user.team_profile_id = profile.id

    db.session.add(user)
    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        return error_response(409, "CONFLICT", "The account could not be created.")

    _audit("admin.account_created", user, {"role": user.role})
    db.session.commit()
    return item_response(_user_schema.dump(user)), 201


@api_v1.get("/admin/users/<user_id>")
@roles_required(UserRole.ADMIN)
def get_user(user_id):
    return item_response(_user_schema.dump(_get_user(user_id)))


@api_v1.patch("/admin/users/<user_id>")
@roles_required(UserRole.ADMIN)
def update_user(user_id):
    user = _get_user(user_id)
    data = UserUpdateSchema().load(request.get_json(silent=True) or {})
    changes = {}

    losing_admin = (
        user.role == UserRole.ADMIN and user.is_active
        and (data.get("role", UserRole.ADMIN) != UserRole.ADMIN or data.get("is_active") is False)
    )
    if losing_admin and _active_admin_count() <= 1:
        return error_response(
            409, "CONFLICT", "There must always be at least one active admin account.",
        )
    if user.id == g.current_user.id and (
        data.get("is_active") is False or data.get("role", UserRole.ADMIN) != UserRole.ADMIN
    ):
        return error_response(
            409, "CONFLICT", "You cannot deactivate or demote your own account.",
        )

    if "full_name" in data:
        user.full_name = data["full_name"].strip()
        changes["full_name"] = True

    if "team_profile_slug" in data:
        if data["team_profile_slug"]:
            profile, error = _profile_for_slug(data["team_profile_slug"], exclude_user_id=user.id)
            if error:
                return error
            user.team_profile_id = profile.id
        else:
            user.team_profile_id = None
        changes["team_profile_slug"] = data["team_profile_slug"]

    revoke = False
    if "role" in data and data["role"] != user.role:
        changes["role"] = {"from": user.role, "to": data["role"]}
        user.role = data["role"]
        revoke = True
    if "is_active" in data and data["is_active"] != user.is_active:
        changes["is_active"] = data["is_active"]
        user.is_active = data["is_active"]
        revoke = True
    if revoke:
        # A changed role or a deactivation takes effect immediately, not when the
        # person's current token happens to expire.
        user.token_version += 1

    _audit("admin.account_updated", user, changes)
    db.session.commit()
    return item_response(_user_schema.dump(user))


@api_v1.post("/admin/users/<user_id>/reset-password")
@roles_required(UserRole.ADMIN)
def reset_user_password(user_id):
    user = _get_user(user_id)
    data = PasswordResetSchema().load(request.get_json(silent=True) or {})

    user.set_password(data["temporary_password"])
    user.must_change_password = True
    user.token_version += 1

    _audit("admin.password_reset", user)
    db.session.commit()
    return item_response(_user_schema.dump(user))


@api_v1.get("/admin/team-profiles")
@roles_required(UserRole.ADMIN)
def list_profile_options():
    """Every team profile, any status, for linking an account to the profile it writes as."""
    profiles = db.session.scalars(
        select(TeamProfile).order_by(TeamProfile.display_name, TeamProfile.id)
    ).all()
    return item_response(ProfileOptionSchema(many=True).dump(profiles))
