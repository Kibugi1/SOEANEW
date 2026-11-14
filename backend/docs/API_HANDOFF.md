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

### Contact enquiry

`POST /api/v1/contact-enquiries`

Required fields:

- `name`
- `organization`
- `email`
- `partnership_category`
- `message` (10â€“10,000 characters)
- `consent` (must be true)

Optional fields:

- `phone`
- `experience_resources`

Successful submission returns HTTP 201.

Rate limit: 5 requests per hour.

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
- Insufficient permissions return HTTP 403.
- Clients should handle HTTP 404, 409, 429 and 5xx responses.
- Preserve and log `X-Request-ID` when reporting API errors.

## 10. Backend deployment requirements

Production configuration requires:

- `SECRET_KEY` of at least 32 characters.
- PostgreSQL `DATABASE_URL`.
- Redis-backed `RATELIMIT_STORAGE_URI`.
- Explicit HTTPS `CORS_ORIGINS`.
- Valid SMTP configuration for email delivery.
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
