# SOEA Backend API Handoff

**API version:** v1
**Base path:** `/api/v1`
**Framework:** Flask
**Database:** PostgreSQL
**Authentication:** Bearer token for administrative endpoints

This document describes the backend API contract.

## 1. Base URL and health check

All API endpoints use the `/api/v1` prefix.

- `GET /` - Returns API name, version and health endpoint.
- `GET /api/v1/health` - Returns `{"status": "ok"}`.

The health endpoint does not use the standard data envelope.

## 2. Response formats

Single resource:

    {"data": {}}

Collection:

    {
      "data": [],
      "meta": {
        "pagination": {
          "page": 1,
          "per_page": 12,
          "total": 0,
          "pages": 0
        }
      }
    }

Error:

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Please correct the highlighted fields.",
        "details": {},
        "request_id": "example-request-id"
      }
    }

Errors may include a request ID. The same identifier is returned in the `X-Request-ID` response header.

## 3. Pagination

Paginated collection endpoints accept:

| Parameter | Default | Allowed range |
|---|---:|---:|
| `page` | 1 | Minimum 1 |
| `per_page` | 12 | 1â€“50 |

Pagination metadata includes `page`, `per_page`, `total` and `pages`.

Unknown query parameters are ignored.

## 4. Authentication

Administrative authentication uses Bearer access tokens.

### Login

`POST /api/v1/auth/login`

Request:

    {
      "email": "admin@example.com",
      "password": "your-password"
    }

Successful response:

    {
      "data": {
        "access_token": "<token>",
        "token_type": "Bearer",
        "expires_in": 900,
        "user": {
          "id": "<uuid>",
          "email": "admin@example.com",
          "role": "admin"
        }
      }
    }

Invalid credentials return HTTP 401.

Rate limit: 5 requests per minute.

### Current user

`GET /api/v1/auth/me`

Requires:

`Authorization: Bearer <access_token>`

Returns the authenticated user's ID, email and role.

Login and `GET /auth/me` return the account:

    {"id": "<uuid>", "email": "...", "role": "admin | editor | author",
     "full_name": "...", "must_change_password": false,
     "team_profile": {"id": "<uuid>", "slug": "chika-atueyi", "display_name": "Chika Atueyi"}}

`team_profile` is the public profile the account writes as, or `null`.

### Roles

| Role | Who | Can |
|---|---|---|
| `admin` | Founder / executive lead | Everything, including approving and publishing, and managing accounts |
| `editor` | Communications / program staff | Content drafts, the inbox, newsletters; cannot publish stories or manage accounts |
| `author` | Staff and volunteers who write | Their own stories only |

### First login and password changes

Accounts created by an admin have `must_change_password: true`. Until the password is
changed, every endpoint except `/auth/me`, `/auth/change-password` and `/auth/logout`
returns HTTP 403 with code `PASSWORD_CHANGE_REQUIRED`.

`POST /api/v1/auth/change-password`

    {"current_password": "...", "new_password": "at least 12 characters"}

Returns a new access token in the same shape as login. All other sessions are signed out.
Rate limit: 5 requests per minute.

### Logout

`POST /api/v1/auth/logout`

Requires authentication. Revokes the current token.

## 5. Public content endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/locations` | List published locations |
| GET | `/locations/<slug>` | Location details and related content |
| GET | `/partners` | List published partners |
| GET | `/programs` | List published programs |
| GET | `/programs/<slug>` | Program details |
| GET | `/programs/<slug>/timeline` | Program phases and milestones |
| GET | `/resources` | List published resources |
| GET | `/social-posts` | List published social posts |
| GET | `/stories` | List public stories |
| GET | `/stories/<slug>` | Story details |
| GET | `/team` | List published team profiles |
| GET | `/team/<slug>` | Team profile details |
| GET | `/team/<slug>/stories` | Stories associated with a team member |
| GET | `/themes` | List published themes |
| GET | `/themes/<slug>` | Theme details and related content |

All paths above are relative to `/api/v1`.

### Available filters

| Endpoint | Query parameters |
|---|---|
| `/locations` | `type`: country, county, community |
| `/partners` | `type`: community_organization, technical_institution, business, researcher, financial_institution, public_institution, development_partner |
| `/programs` | `featured`, `theme`, `location` |
| `/resources` | `type`, `program`, `location`, `phase`, `date_from`, `date_to` |
| `/social-posts` | `platform`: facebook, instagram, linkedin, youtube, tiktok, x, other |
| `/stories` | `program`, `theme`, `location`, `author`, `q`, `sort` |
| `/team` | `role`: staff, volunteer, leadership; `q` |

Story sorting accepts `newest` or `oldest`; default is `newest`.

Resource types: `report`, `guide`, `toolkit`, `policy`, `research`, `news`, `other`.

Resource date filters use dates. `date_from` must not be later than `date_to`.

Text search parameters use `q`.

## 6. Public forms

### Website messages (partnership, volunteer, contact)

`POST /api/v1/contact-enquiries`

One endpoint for every message sent through the website. `kind` selects the journey and
decides which fields are required. The server, not the client, decides which inbox a
message goes to.

| `kind` | Required | Optional | Inbox |
|---|---|---|---|
| `partnership` (default) | `name`, `email`, `organization`, `interests` (list, 1–12) | `phone`, `experience_resources`, `message` | `partnerships` |
| `volunteer` | `name`, `email`, `area`, `skills`, `availability`, `motivation` | `phone` | `volunteers` |
| `contact` | `name`, `email`, `topic`, `message` | `organization`, `phone` | `partnerships` for topics `partnerships`, `research`, `institutional`; otherwise `info` |

All kinds also require `consent: true` and accept `source_page` (the page the journey was
completed on). `message`, when given, is 10–10,000 characters. Contact topics: `general`,
`partnerships`, `community`, `research`, `media`, `institutional`.

The legacy single `partnership_category` string is still accepted for partnership
enquiries instead of `interests`.

Successful submission returns HTTP 201:

    {"data": {"id": "<uuid>", "reference": "SOEA-VO-7K3F9Q", "message": "Your enquiry has been received."}}

Show `reference` on the thank-you screen so the person can quote it. References use the
prefixes `PA` (partnership), `VO` (volunteer) and `CO` (contact).

Spam protection: rate limit of 5 requests per hour, and a honeypot field named `website`.
Render it hidden from people; if it is filled in, the API answers 201 and discards the message.

When the inbox's email address is configured, the inbox receives an alert containing the
reference, the sender's name and a link to the dashboard (not the message itself).

### Newsletter subscription

`POST /api/v1/newsletter-subscriptions`

Request:

    {
      "email": "subscriber@example.com",
      "consent": true
    }

Returns HTTP 202 for accepted requests. A confirmation email is sent.

Rate limit: 5 requests per hour.

### Confirm subscription

`POST /api/v1/newsletter-subscriptions/confirm`

Request:

    {
      "token": "<confirmation-token>"
    }

### Unsubscribe

`POST /api/v1/newsletter-subscriptions/unsubscribe`

Request:

    {
      "token": "<unsubscribe-token>"
    }

Invalid or expired tokens return an error response.

Both endpoints are rate-limited to 10 requests per hour.

## 7. Administrative newsletter campaigns

These endpoints require a valid Bearer token and an `admin` or `editor` role.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/admin/newsletter-campaigns` | Create campaign |
| GET | `/admin/newsletter-campaigns` | List campaigns |
| GET | `/admin/newsletter-campaigns/<campaign_id>` | Campaign details |
| PATCH | `/admin/newsletter-campaigns/<campaign_id>` | Update draft |
| POST | `/admin/newsletter-campaigns/<campaign_id>/schedule` | Schedule campaign |
| POST | `/admin/newsletter-campaigns/<campaign_id>/send` | Send campaign |

### Create campaign

Required:

- `subject` â€” 1â€“255 characters
- `body_text` â€” non-empty text

Optional:

- `body_html` â€” nullable HTML content

New campaigns are created as drafts.

### Update campaign

Only draft campaigns can be updated. At least one update field must be supplied.

### Schedule campaign

`scheduled_at` is required and must include a timezone. It must be in the future.

Example:

    {
      "scheduled_at": "2027-01-15T10:00:00Z"
    }

### Send campaign

The backend enforces campaign status and scheduling rules.

Delivery results include attempted, sent, failed, skipped and outstanding counts.

## 7a. Administrative accounts (admin only)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/users` | List accounts (paginated) |
| POST | `/admin/users` | Create an account |
| GET | `/admin/users/<id>` | Account details |
| PATCH | `/admin/users/<id>` | Change `full_name`, `role`, `is_active`, `team_profile_slug` |
| POST | `/admin/users/<id>/reset-password` | Set a new temporary password |
| GET | `/admin/team-profiles` | Every team profile, for linking an account to the profile it writes as |

Create:

    {"email": "s.ndiritu@sq1ecoafrica.org", "full_name": "Stephanie Ndiritu", "role": "author",
     "team_profile_slug": "stephanie-ndiritu", "temporary_password": "at least 12 characters"}

The new account must change its password at first login. A profile can be linked to only
one account (HTTP 409 otherwise). Changing a role or deactivating an account signs that
person out immediately. There must always be one active admin, and admins cannot demote or
deactivate themselves (HTTP 409). Accounts are deactivated, never deleted.

## 7b. Inbox (admin and editor)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/enquiries` | List messages, newest first |
| GET | `/admin/enquiries/assignees` | Active admins and editors a message can be assigned to (`id`, `full_name`, `email`) |
| GET | `/admin/enquiries/<id>` | Full message, including `details`, `internal_notes` |
| PATCH | `/admin/enquiries/<id>` | Change `status`, `internal_notes`, `assigned_to_user_id` |
| DELETE | `/admin/enquiries/<id>` | Permanently erase (admin only; e.g. a data-removal request) |

List filters: `kind`, `inbox`, `status` (`new`, `in_review`, `contacted`, `closed`) and `q`
(searches name, organization, email and reference). Messages can be assigned only to active
admin or editor accounts. Every change is written to the audit log without the note text.

`details` holds the journey-specific answers, e.g. `{"interests": [...]}` for a partnership
or `{"area", "skills", "availability", "motivation"}` for a volunteer.

## 7c. Uploads: images and documents (any signed-in role)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/admin/media` | Upload one file (`multipart/form-data`: `file`, optional `alt_text`) |
| GET | `/admin/media` | List files, newest first; filter `kind` = `image` or `document` |
| GET | `/admin/media/<id>` | File details, plus `in_use` (how many records use it) |
| PATCH | `/admin/media/<id>` | Change `alt_text` |
| DELETE | `/admin/media/<id>` | Delete; HTTP 409 while the file is still in use |

Accepted: JPEG, PNG and WebP images up to 10 MB, and PDF documents up to 25 MB. The type is
read from the file content, not its name. SVG and GIF are refused (upload logos as PNG or
WebP). Images are re-encoded on upload: camera rotation is applied, metadata such as GPS
location is removed, and the longest side is reduced to 2,400 pixels.

Authors see and manage only their own uploads; admins and editors see all of them. Every
image needs good `alt_text` before it appears on a public page.

Response:

    {"id": "<uuid>", "kind": "image", "url": "https://.../media/2026/11/<random>.png",
     "alt_text": "...", "original_filename": "logo.png", "mime_type": "image/png",
     "file_size": 20480, "width": 400, "height": 200,
     "uploaded_by": {"id": "<uuid>", "full_name": "..."}, "created_at": "..."}

Files are served from `GET /media/<path>` (development) or `MEDIA_BASE_URL` (production).

## 7d. Partners (admin and editor)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/partners` | List every partner; filters `status`, `type`, `q` |
| POST | `/admin/partners` | Create (draft by default) |
| GET | `/admin/partners/<id>` | Details |
| PATCH | `/admin/partners/<id>` | Update any field |
| DELETE | `/admin/partners/<id>` | Delete (admin only); HTTP 409 if linked, so archive it instead |
| GET | `/admin/partnership-areas` | Every partnership area, for the picker |

Fields: `name`, `slug` (generated from the name when omitted), `partner_type`, `summary`,
`website_url` (http/https only), `sort_order`, `logo_id` (an uploaded image, or `null`),
`area_slugs`, `program_slugs`, `publication_status` (`draft`, `published`, `archived`).

Publishing rules: editors create and edit drafts. Only an admin can publish or archive a
partner, or change one that is already published or archived (HTTP 403 otherwise). A
partner needs a `summary` before it can be published.

The public `GET /partners` now includes `logo`: `{"url", "alt_text", "width", "height"}` or
`null`. The alt text falls back to "<name> logo".

## 7e. Programs (admin and editor)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/programs` | List every program; filters `status` (publication), `progress`, `q` |
| POST | `/admin/programs` | Create (draft by default) |
| GET | `/admin/programs/<id>` | Details |
| PATCH | `/admin/programs/<id>` | Update any field |
| DELETE | `/admin/programs/<id>` | Delete (admin only); HTTP 409 if it has sub-programs or linked stories/profiles |

Fields: `title`, `slug` (generated from `short_name` or the title), `short_name`, `summary`
(max 500), `body`, `status` (`completed`, `in_progress`, `planned`, `coming_soon`,
`in_development`), `is_featured`, `start_date`, `end_date`, `sort_order`, `parent_slug`,
`lead_profile_slug`, `contact_email`, `cta_label`, `cta_url` (http/https or a site path like
`/partner-with-us`), `cta_pending`, `theme_slugs`, `primary_theme_slug` (one of the themes),
`location_slugs`, `partner_slugs`, `publication_status`.

`in_development` is displayed as **"Concept in development"**. Publishing rules match partners.
A call to action needs a link unless it is marked pending. A program cannot sit under itself or
one of its own sub-programs.

The public program endpoints now also return `parent` (list and detail) and, on the detail,
`lead` (only while that profile is published), `contact_email`, `cta`
(`{"label", "url", "pending"}`; `url` is `null` while pending) and `sub_programs`.

**Loading JEET Champions:** `flask --app run.py seed-jeet` creates JEET Champions from Chika
Atueyi's 20 November 2026 brief as a draft, linked to CECI, Chika's profile, the Renewable
Energy & Clean Cooking theme and Nairobi, Kajiado and Isiolo where those exist. It reports
anything it could not link, and never overwrites an existing JEET program.

## 7f. Stories and events: writing and review (any signed-in role)

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| GET | `/admin/stories` | all | Authors: their own; admins/editors: all. Filters `status`, `type`, `mine`, `q` |
| POST | `/admin/stories` | all | Start a draft (bylined to the writer's linked profile) |
| GET | `/admin/stories/<id>` | all | Details, plus `permissions` for the signed-in user |
| PATCH | `/admin/stories/<id>` | see below | Edit |
| POST | `/admin/stories/<id>/submit` | writer, admin, editor | Send for review; emails every active admin |
| POST | `/admin/stories/<id>/request-changes` | admin | `{"notes": "..."}`; emails the writer |
| POST | `/admin/stories/<id>/approve` | admin | Publish now, or `{"publish_at": "<future, with timezone>"}`; emails the writer |
| POST | `/admin/stories/<id>/unpublish` | admin | Published → archived |
| POST | `/admin/stories/<id>/reopen` | admin | Archived → draft |
| DELETE | `/admin/stories/<id>` | admin; writer for own drafts | Delete (never while published) |

Workflow: `DRAFT → IN_REVIEW → PUBLISHED → ARCHIVED`, with `IN_REVIEW → CHANGES_REQUESTED → IN_REVIEW`.
Authors edit their own stories while `DRAFT` or `CHANGES_REQUESTED`; editors can edit anything
not yet live; admins can edit anything (a live story must stay publishable). An admin's own
draft can be approved directly. Someone else's story is invisible to an author (HTTP 404).

Before review or publishing a story needs a title, summary and body; `consent_status` must be
`confirmed` or `not_required`; every gallery photo needs alt text; and an event needs
`activity_date` and `event_role`.

Fields: `title`, `slug`, `summary` (max 1,000), `body` (Markdown), `story_type` (`story` or
`event`), `activity_date` (the day it happened; first day of an event), `event_end_date`,
`venue`, `organiser`, `event_role` (`hosted`, `participated`, `media`, `meeting`), `next_step`,
`lessons`, `outcomes`, `video_url`, `social_url`, `consent_status`, `cover_image_id`,
`gallery` (`[{"media_id", "caption"}]`), `team` (`[{"slug", "role": "lead"|"support"}]`),
`program_slugs`, `phase_refs` (`"ceci/phase-1"`), `theme_slugs`, `location_slugs`, and, for
admins and editors only, `author_slugs` and `is_confidential`. Event fields are cleared on
ordinary stories. Authors can use only photos they uploaded.

A published story appears on People & Stories, on the profile of every author and every
lead/support team member, and on each tagged program, phase, place and theme.

Public story responses now include `story_type` and `event`
(`{"start_date", "end_date", "venue", "organiser", "role"}` or `null`); the detail adds
`gallery` (`[{"url", "alt_text", "width", "height", "caption"}]`). `GET /stories?type=event`
lists events only.

## 7g. Loading content

Run once on a new database, in this order:

    cd frontend && node scripts/export-content.mjs > ../backend/instance/site-content.json
    cd ../backend
    flask --app run.py import-site-content   # profiles, portraits, themes, places, CECI, stories: published
    flask --app run.py seed-jeet             # JEET Champions: draft
    flask --app run.py import-past-events    # 19 events (Mar–Oct 2026): waiting for review

Every command skips records that already exist and never overwrites dashboard edits.

## 7h. Dashboard summary (any signed-in role)

`GET /admin/dashboard`

Every role receives `role` and `my_stories` (counts by story status for stories bylined to,
led or supported by the account's linked profile). Admins and editors also receive:
`programs` and `partners` (counts by publication status), `stories` (counts by status),
`stories_awaiting_review`, `enquiries.by_status`, `enquiries.open_by_inbox` (new and in
review) and `subscribers` (counts by status). Every count object includes `total`.

## 8. Dates and timestamps

API timestamps are serialized in UTC.

Example:

`2026-11-14T10:30:00Z`

Clients should send timezone-aware timestamps when scheduling campaigns.

## 9. Important integration notes

- Public endpoints expose published content only.
- Related content is filtered according to publication visibility.
- Unsafe or unsupported external URLs may be returned as `null`.
- Collection endpoints are paginated.
- Detail endpoints may include a limited number of related stories.
- The team stories endpoint provides a separately paginated story collection.
- Validation errors return HTTP 400 with field-level details where available.
- Authentication failures return HTTP 401.
- Insufficient permissions return HTTP 403 (`FORBIDDEN`), or `PASSWORD_CHANGE_REQUIRED` for an account that must first change its password.
- Clients should handle HTTP 404, 409, 429 and 5xx responses.
- Preserve and log `X-Request-ID` when reporting API errors.

## 10. Backend deployment requirements

Production configuration requires:

- `SECRET_KEY` of at least 32 characters.
- PostgreSQL `DATABASE_URL`.
- Redis-backed `RATELIMIT_STORAGE_URI`.
- Explicit HTTPS `CORS_ORIGINS`.
- Valid SMTP configuration for email delivery.
- `INBOX_PARTNERSHIPS_EMAIL`, `INBOX_VOLUNTEERS_EMAIL`, `INBOX_INFO_EMAIL` and `ADMIN_DASHBOARD_URL` for inbox alerts.
- Production WSGI server.
- Correctly configured database migrations.

### Production startup (Linux/Unix)

Apply database migrations during deployment, after reviewing the migration and ensuring a database backup is available:

```bash
flask --app wsgi:app db upgrade
```

Start the application using Gunicorn:

```bash
gunicorn --bind 0.0.0.0:$PORT wsgi:app
```

`wsgi.py` exposes the Flask application as `app`. Gunicorn is intended for Linux/Unix production environments; use `run.py` for local Windows development.

Verify environment variables, migrations, database connectivity, CORS and email delivery before deployment.

## 11. Scope

This document describes the backend API contract.

Frontend implementation, UI behavior, frontend routing and frontend/backend integration testing are outside the backend implementation scope.
