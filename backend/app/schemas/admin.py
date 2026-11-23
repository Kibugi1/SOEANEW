"""Schemas for the admin dashboard: accounts and the inbox.

Response schemas are allow-lists like the public ones: a field appears only if it is
named here. Password hashes and token versions are never serialized.
"""

from marshmallow import EXCLUDE, Schema, fields, validate, validates_schema, ValidationError

from app.models.forms import ENQUIRY_INBOXES, ENQUIRY_KINDS, ENQUIRY_STATUSES
from app.models.user import UserRole
from .common import PaginationQuerySchema, UTCDateTime

_PASSWORD = validate.Length(min=12, max=256)


# --- Accounts -----------------------------------------------------------------------

class LinkedProfileSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    display_name = fields.String()
    status = fields.String()


class UserSchema(Schema):
    id = fields.UUID()
    email = fields.String()
    full_name = fields.String(allow_none=True)
    role = fields.String()
    is_active = fields.Boolean()
    must_change_password = fields.Boolean()
    team_profile = fields.Nested(LinkedProfileSchema, allow_none=True)
    last_login_at = UTCDateTime()
    created_at = UTCDateTime()


class UserCreateSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(max=254))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=150))
    role = fields.String(required=True, validate=validate.OneOf(UserRole.ALL))
    # Slug of the public profile this person writes as (optional; can be linked later).
    team_profile_slug = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=120))
    # Shared once with the person; they must replace it at first login.
    temporary_password = fields.String(required=True, load_only=True, validate=_PASSWORD)


class UserUpdateSchema(Schema):
    full_name = fields.String(validate=validate.Length(min=1, max=150))
    role = fields.String(validate=validate.OneOf(UserRole.ALL))
    is_active = fields.Boolean()
    team_profile_slug = fields.String(allow_none=True, validate=validate.Length(max=120))

    @validates_schema
    def require_a_change(self, data, **kwargs):
        if not data:
            raise ValidationError("Provide at least one field to update.")


class PasswordResetSchema(Schema):
    temporary_password = fields.String(required=True, load_only=True, validate=_PASSWORD)


class PasswordChangeSchema(Schema):
    current_password = fields.String(required=True, load_only=True, validate=validate.Length(max=256))
    new_password = fields.String(required=True, load_only=True, validate=_PASSWORD)


class ProfileOptionSchema(Schema):
    """A team profile as offered in the "link account to profile" picker."""
    id = fields.UUID()
    slug = fields.String()
    display_name = fields.String()
    role_title = fields.String()
    status = fields.String()


# --- Inbox --------------------------------------------------------------------------

class EnquiryListQuerySchema(PaginationQuerySchema):
    class Meta:
        unknown = EXCLUDE

    kind = fields.String(validate=validate.OneOf(ENQUIRY_KINDS))
    inbox = fields.String(validate=validate.OneOf(ENQUIRY_INBOXES))
    status = fields.String(validate=validate.OneOf(ENQUIRY_STATUSES))
    q = fields.String(validate=validate.Length(min=1, max=100))


class AssigneeSchema(Schema):
    id = fields.UUID()
    full_name = fields.String(allow_none=True)
    email = fields.String()


class EnquirySummarySchema(Schema):
    id = fields.UUID()
    reference = fields.String(allow_none=True)
    kind = fields.String()
    inbox = fields.String()
    topic = fields.String(allow_none=True)
    status = fields.String()
    name = fields.String()
    organization = fields.String(allow_none=True)
    email = fields.String()
    assigned_to = fields.Nested(AssigneeSchema, allow_none=True)
    created_at = UTCDateTime()


class EnquiryDetailSchema(EnquirySummarySchema):
    phone = fields.String(allow_none=True)
    partnership_category = fields.String(allow_none=True)
    experience_resources = fields.String(allow_none=True)
    message = fields.String(allow_none=True)
    details = fields.Dict()
    source_page = fields.String(allow_none=True)
    consent = fields.Boolean()
    internal_notes = fields.String(allow_none=True)
    status_changed_at = UTCDateTime()
    updated_at = UTCDateTime()


class EnquiryUpdateSchema(Schema):
    status = fields.String(validate=validate.OneOf(ENQUIRY_STATUSES))
    internal_notes = fields.String(allow_none=True, validate=validate.Length(max=10000))
    assigned_to_user_id = fields.UUID(allow_none=True)

    @validates_schema
    def require_a_change(self, data, **kwargs):
        if not data:
            raise ValidationError("Provide at least one field to update.")


# --- Media ----------------------------------------------------------------------------

class UploaderSchema(Schema):
    id = fields.UUID()
    full_name = fields.String(allow_none=True)


class MediaAssetSchema(Schema):
    id = fields.UUID()
    kind = fields.String()
    url = fields.String(attribute="public_url")
    alt_text = fields.String(allow_none=True)
    original_filename = fields.String()
    mime_type = fields.String()
    file_size = fields.Integer()
    width = fields.Integer(allow_none=True)
    height = fields.Integer(allow_none=True)
    uploaded_by = fields.Nested(UploaderSchema, allow_none=True)
    created_at = UTCDateTime()


class MediaListQuerySchema(PaginationQuerySchema):
    class Meta:
        unknown = EXCLUDE

    kind = fields.String(validate=validate.OneOf(("image", "document")))
    q = fields.String(validate=validate.Length(min=1, max=100))
    missing_alt = fields.Boolean()


class MediaUpdateSchema(Schema):
    alt_text = fields.String(required=True, allow_none=True, validate=validate.Length(max=500))


# --- Partners ---------------------------------------------------------------------------

from app.models.constants import PARTNER_TYPES, PUBLICATION_STATUSES  # noqa: E402

_SLUG = validate.Regexp(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", error="Use lowercase letters, numbers and single hyphens.")


def _http_url(value):
    from .common import safe_http_url
    if value is not None and safe_http_url(value) is None:
        raise ValidationError("Enter a full http:// or https:// address.")


class ImageRefSchema(Schema):
    id = fields.UUID()
    url = fields.String(attribute="public_url")
    alt_text = fields.String(allow_none=True)
    width = fields.Integer(allow_none=True)
    height = fields.Integer(allow_none=True)


class SlugNameSchema(Schema):
    slug = fields.String()
    name = fields.String()


class ProgramRefSchema(Schema):
    slug = fields.String()
    title = fields.String()


class PartnerAdminSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    name = fields.String()
    partner_type = fields.String()
    summary = fields.String(allow_none=True)
    website_url = fields.String(allow_none=True)
    sort_order = fields.Integer()
    publication_status = fields.String()
    logo = fields.Nested(ImageRefSchema, allow_none=True)
    areas = fields.List(fields.Nested(SlugNameSchema))
    programs = fields.List(fields.Nested(ProgramRefSchema))
    created_at = UTCDateTime()
    updated_at = UTCDateTime()


class PartnerListAdminQuerySchema(PaginationQuerySchema):
    class Meta:
        unknown = EXCLUDE

    status = fields.String(validate=validate.OneOf(PUBLICATION_STATUSES))
    type = fields.String(validate=validate.OneOf(PARTNER_TYPES))
    q = fields.String(validate=validate.Length(min=1, max=100))


class PartnerWriteSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    slug = fields.String(validate=[validate.Length(min=1, max=120), _SLUG])
    partner_type = fields.String(validate=validate.OneOf(PARTNER_TYPES))
    summary = fields.String(allow_none=True, validate=validate.Length(max=5000))
    website_url = fields.String(allow_none=True, validate=[validate.Length(max=500), _http_url])
    sort_order = fields.Integer(validate=validate.Range(min=0, max=10000))
    logo_id = fields.UUID(allow_none=True)
    area_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=30))
    program_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=30))
    publication_status = fields.String(validate=validate.OneOf(PUBLICATION_STATUSES))


class PartnerCreateSchema(PartnerWriteSchema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    partner_type = fields.String(required=True, validate=validate.OneOf(PARTNER_TYPES))


# --- Programs ---------------------------------------------------------------------------

from app.models.constants import PROGRESS_STATUSES  # noqa: E402


def _http_url_or_path(value):
    from .common import safe_http_or_path
    if value is not None and safe_http_or_path(value) is None:
        raise ValidationError("Enter a full http(s):// address or a site path such as /partner-with-us.")


class ProfileRefSchema(Schema):
    slug = fields.String()
    display_name = fields.String()
    status = fields.String()


class ThemeRefAdminSchema(Schema):
    slug = fields.String()
    name = fields.String()


class LocationRefAdminSchema(Schema):
    slug = fields.String()
    name = fields.String()


class ProgramAdminSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    short_name = fields.String(allow_none=True)
    summary = fields.String()
    body = fields.String(allow_none=True)
    status = fields.String()
    is_featured = fields.Boolean()
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    sort_order = fields.Integer()
    publication_status = fields.String()
    parent = fields.Nested(ProgramRefSchema, allow_none=True)
    sub_programs = fields.List(fields.Nested(ProgramRefSchema), attribute="children")
    lead = fields.Nested(ProfileRefSchema, allow_none=True)
    contact_email = fields.String(allow_none=True)
    cta_label = fields.String(allow_none=True)
    cta_url = fields.String(allow_none=True)
    cta_pending = fields.Boolean()
    cover_image = fields.Nested(ImageRefSchema, allow_none=True)
    themes = fields.List(fields.Nested(ThemeRefAdminSchema))
    locations = fields.List(fields.Nested(LocationRefAdminSchema))
    partners = fields.List(fields.Nested(SlugNameSchema))
    created_at = UTCDateTime()
    updated_at = UTCDateTime()


class ProgramListAdminQuerySchema(PaginationQuerySchema):
    class Meta:
        unknown = EXCLUDE

    status = fields.String(validate=validate.OneOf(PUBLICATION_STATUSES))
    progress = fields.String(validate=validate.OneOf(PROGRESS_STATUSES))
    q = fields.String(validate=validate.Length(min=1, max=100))


class ProgramWriteSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=200))
    slug = fields.String(validate=[validate.Length(min=1, max=120), _SLUG])
    short_name = fields.String(allow_none=True, validate=validate.Length(max=30))
    summary = fields.String(validate=validate.Length(min=1, max=500))
    body = fields.String(allow_none=True, validate=validate.Length(max=50000))
    status = fields.String(validate=validate.OneOf(PROGRESS_STATUSES))
    is_featured = fields.Boolean()
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    sort_order = fields.Integer(validate=validate.Range(min=0, max=10000))
    parent_slug = fields.String(allow_none=True, validate=validate.Length(max=120))
    lead_profile_slug = fields.String(allow_none=True, validate=validate.Length(max=120))
    contact_email = fields.Email(allow_none=True, validate=validate.Length(max=254))
    cta_label = fields.String(allow_none=True, validate=validate.Length(max=120))
    cta_url = fields.String(allow_none=True, validate=[validate.Length(max=500), _http_url_or_path])
    cta_pending = fields.Boolean()
    cover_image_id = fields.UUID(allow_none=True)
    theme_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=20))
    primary_theme_slug = fields.String(allow_none=True, validate=validate.Length(max=120))
    location_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=50))
    partner_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=100))
    publication_status = fields.String(validate=validate.OneOf(PUBLICATION_STATUSES))


class ProgramCreateSchema(ProgramWriteSchema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    summary = fields.String(required=True, validate=validate.Length(min=1, max=500))


# --- Stories ------------------------------------------------------------------------------

from app.models.story import CONSENT_STATUSES, EVENT_ROLES, STORY_STATUSES, STORY_TYPES  # noqa: E402


class StoryGalleryItemSchema(Schema):
    media_id = fields.UUID()
    url = fields.Function(lambda item: item.media.public_url)
    alt_text = fields.Function(lambda item: item.media.alt_text)
    caption = fields.String(allow_none=True)


class TeamMemberRefSchema(Schema):
    slug = fields.Function(lambda member: member.profile.slug)
    display_name = fields.Function(lambda member: member.profile.display_name)
    role = fields.String()


class PhaseRefAdminSchema(Schema):
    ref = fields.Function(lambda phase: f"{phase.program.slug}/{phase.slug}")
    title = fields.String()


class StoryAdminSchema(Schema):
    id = fields.UUID()
    slug = fields.String()
    title = fields.String()
    summary = fields.String()
    body = fields.String()
    story_type = fields.String()
    status = fields.String()
    activity_date = fields.Date(allow_none=True)
    event_end_date = fields.Date(allow_none=True)
    venue = fields.String(allow_none=True)
    organiser = fields.String(allow_none=True)
    event_role = fields.String(allow_none=True)
    next_step = fields.String(allow_none=True)
    lessons = fields.String(allow_none=True)
    outcomes = fields.String(allow_none=True)
    video_url = fields.String(allow_none=True)
    social_url = fields.String(allow_none=True)
    consent_status = fields.String()
    is_confidential = fields.Boolean()
    review_notes = fields.String(allow_none=True)
    cover_image = fields.Nested(ImageRefSchema, allow_none=True)
    gallery = fields.List(fields.Nested(StoryGalleryItemSchema))
    authors = fields.List(fields.Nested(ProfileRefSchema))
    team = fields.List(fields.Nested(TeamMemberRefSchema), attribute="team_members")
    programs = fields.List(fields.Nested(ProgramRefSchema))
    phases = fields.List(fields.Nested(PhaseRefAdminSchema))
    themes = fields.List(fields.Nested(ThemeRefAdminSchema))
    locations = fields.List(fields.Nested(LocationRefAdminSchema))
    created_by = fields.Nested(UploaderSchema, allow_none=True)
    reviewed_by = fields.Nested(UploaderSchema, allow_none=True)
    submitted_at = UTCDateTime()
    reviewed_at = UTCDateTime()
    published_at = UTCDateTime()
    created_at = UTCDateTime()
    updated_at = UTCDateTime()


class StoryListAdminQuerySchema(PaginationQuerySchema):
    class Meta:
        unknown = EXCLUDE

    status = fields.String(validate=validate.OneOf(STORY_STATUSES))
    type = fields.String(validate=validate.OneOf(STORY_TYPES))
    mine = fields.Boolean()
    q = fields.String(validate=validate.Length(min=1, max=100))


class GalleryItemWriteSchema(Schema):
    media_id = fields.UUID(required=True)
    caption = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=300))


class TeamMemberWriteSchema(Schema):
    slug = fields.String(required=True, validate=validate.Length(max=120))
    role = fields.String(required=True, validate=validate.OneOf(("lead", "support")))


class StoryWriteSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=255))
    slug = fields.String(validate=[validate.Length(min=1, max=160), _SLUG])
    summary = fields.String(validate=validate.Length(min=1, max=1000))
    body = fields.String(validate=validate.Length(min=1, max=100000))
    story_type = fields.String(validate=validate.OneOf(STORY_TYPES))
    activity_date = fields.Date(allow_none=True)
    event_end_date = fields.Date(allow_none=True)
    venue = fields.String(allow_none=True, validate=validate.Length(max=200))
    organiser = fields.String(allow_none=True, validate=validate.Length(max=300))
    event_role = fields.String(allow_none=True, validate=validate.OneOf(EVENT_ROLES))
    next_step = fields.String(allow_none=True, validate=validate.Length(max=5000))
    lessons = fields.String(allow_none=True, validate=validate.Length(max=10000))
    outcomes = fields.String(allow_none=True, validate=validate.Length(max=10000))
    video_url = fields.String(allow_none=True, validate=[validate.Length(max=500), _http_url])
    social_url = fields.String(allow_none=True, validate=[validate.Length(max=500), _http_url])
    consent_status = fields.String(validate=validate.OneOf(CONSENT_STATUSES))
    is_confidential = fields.Boolean()
    cover_image_id = fields.UUID(allow_none=True)
    gallery = fields.List(fields.Nested(GalleryItemWriteSchema), validate=validate.Length(max=40))
    author_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=10))
    team = fields.List(fields.Nested(TeamMemberWriteSchema), validate=validate.Length(max=20))
    program_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=10))
    phase_refs = fields.List(fields.String(validate=validate.Length(max=241)), validate=validate.Length(max=10))
    theme_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=10))
    location_slugs = fields.List(fields.String(validate=validate.Length(max=120)), validate=validate.Length(max=20))


class StoryCreateSchema(StoryWriteSchema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=255))


class ReviewNotesSchema(Schema):
    notes = fields.String(required=True, validate=validate.Length(min=1, max=10000))


class ApproveSchema(Schema):
    # Optional: publish later instead of now (must include a timezone).
    publish_at = fields.AwareDateTime(allow_none=True, load_default=None)
    notes = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=10000))
