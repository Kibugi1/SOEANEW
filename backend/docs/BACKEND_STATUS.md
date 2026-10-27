# SOEA Backend: Status and Documentation

**As of:** 27 October 2026
**Covers:** everything done on the backend so far, measured against two documents: the *SOEA Website Project Outline & Backend Handoff Guide* (21 October 2026, "the handoff guide") and the *SOEA Website Content & Developer's Guide* (consolidated revised edition, 14 October 2026, "the content guide").

## 1. Summary

The backend is a Flask JSON API in a new repository, started from scratch. It now has:

- an app factory with versioned routes under `/api/v1`, a health route, JSON errors, request IDs and strict CORS;
- 18 database tables covering team profiles, stories, thematic areas, locations, programs, phases, milestones and training tracks, with the links between them;
- one query layer (`app/models/queries.py`) that decides what is public;
- 13 read-only endpoints (10 of the handoff guide's 12 public read endpoints, plus two detail routes the content guide needs and the health check);
- PostgreSQL migrations, a demo-data command and a 179-test suite.

The built parts match both guides. What remains is the rest of the data model (resources, partners, media, social posts, contact enquiries, subscribers), authentication and the admin workflow, and several decisions that need sign-off (section 13).

## 2. Background

### The old site

The old repository (a zip supplied for reference) contained:

- a static HTML site (its README says it is live at sq1ecoafrica.org on Bluehost);
- `legacy/` PHP backends backed by a MySQL schema with the tables `admins`, `articles`, `contacts`, `donations` and `subscribers`;
- a Django `registrations` app for Environmental Super Cup registrations.

**No database data or dump was available, only the schema, so nothing was migrated.** Decisions taken:

| Topic | Decision |
| --- | --- |
| Old content | Used as reference only. Stories and bios will be re-entered or imported as drafts and published only after consent and approval. |
| Environmental Super Cup registration | Deferred. Neither guide mentions it, and it stores emails, phone numbers and guardian-to-child links (minors' data). |
| Donations | Out of scope. Neither guide mentions them. |
| Newsletter subscribers | Now in scope: the content guide's Contact page has a subscribe form. Not built yet. |
| Old admin account | The old schema seeds a default admin with a documented password. It must not be reused, and should be changed if the old site is still live. |
| Old configuration | The legacy `.env` and the Django development settings (debug on, hard-coded secret) are not reused. |
| Images | Not brought over (about 324 MB, with oversized files and people photos that need consent). Media storage is still undecided. |

### The content guide

The content guide, which the handoff guide names as its source of truth, was received after the first build. It confirmed the publication rules and the Phase 0 / 1 / 2 statuses, and it changed the data model: stories gained an activity date, next step, lessons, outcomes, links and a lead/support team; profiles gained a first name, short role, education, fun fact and approved public email; and new entities were needed for programs, phases, milestones, training tracks, themes and locations. Section 12 lists what it settled and what it leaves open.

## 3. Environment

| Item | Value |
| --- | --- |
| Development machine | Windows, PowerShell, Python 3.13, virtual environment at `backend\.venv` |
| Database | PostgreSQL 18.6 (local), database and user both named `soea_dev` |
| Flask | 3.1.3 |
| Flask-SQLAlchemy / SQLAlchemy | 3.1.1 / 2.1.5 |
| Flask-Migrate / Alembic | 4.1.0 / 1.20.0 |
| Flask-CORS | 6.0.5 |
| marshmallow | 4.3.1 |
| psycopg | 3.3.6 (binary) |
| python-dotenv / pytest | 1.2.4 / 9.1.1 |

Versions are those resolved on 21 October 2026; `requirements.txt` holds the exact pins. SQLAlchemy 2.1.5 works with Flask-SQLAlchemy 3.1.1 (checked by the test suite and by migrations). marshmallow 4 removed the old `missing=` and `default=` field arguments; use `load_default=` and `dump_default=`.

## 4. Architecture

```
backend/
├── run.py
├── pytest.ini
├── requirements.txt
├── .env.example
├── docs/BACKEND_STATUS.md
├── app/
│   ├── __init__.py        create_app(): extensions, blueprint, errors, request IDs, CLI
│   ├── config.py          development / testing / production, chosen by APP_ENV
│   ├── extensions.py      db, migrate, cors; constraint naming; SQLite foreign-key pragma
│   ├── errors.py          JSON error format
│   ├── seed.py            seed-demo command
│   ├── api/
│   │   ├── helpers.py     pagination, first_or_404, LIKE escaping, response envelopes
│   │   └── v1/            health, team, themes, locations, programs, stories
│   ├── models/            one module per entity; constants.py; queries.py (public gates)
│   └── schemas/           common, refs, urls, team, content, story (allow-list schemas)
├── migrations/            Alembic
└── tests/
```

**Request flow:** a request gets a request ID, then the route validates its query string with a schema, selects data only through `app/models/queries.py`, serializes it through an allow-list schema, and returns the standard envelope. Errors from any step are converted to the standard error format.

## 5. Configuration

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `APP_ENV` | No | `development` | `development`, `testing`, `production`. |
| `SECRET_KEY` | Production | dev-only value in development | Production refuses to start without it. |
| `DATABASE_URL` | Production | none (dev falls back to SQLite, see section 14) | `postgresql+psycopg://user:password@host:5432/dbname`. |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated exact origins, no wildcards. |

`.env` is ignored by Git. Special characters in the database password must be percent-encoded in the URL.

## 6. Data model (implemented)

Eighteen tables. Two kinds of status are kept apart on purpose:

- `publication_status` (draft, published, archived) is the internal gate. Only `published` rows can reach a public response. It is never serialized.
- `status` (completed, in progress, planned, coming soon) is the public badge from the content guide.

`TeamProfile.status` (draft, published, archived) and `Story.status` (the six workflow states) are their own fields.

### Entities

| Table | Purpose | Key fields |
| --- | --- | --- |
| `thematic_area` | The anchor area plus the six themes | `slug`, `name`, `summary`, `people_served`, `is_anchor` (at most one true), `sort_order`, `publication_status` |
| `location` | Kenya, counties and community areas as a tree | `slug`, `name`, `location_type` (`country`, `county`, `community`), `parent_id`, `summary`, `engagement_status` (`active` or `focus_only`, default `focus_only`), `is_coordination_hub`, `publication_status` |
| `program` | A program or initiative (CECI first) | `slug`, `title`, `short_name`, `summary`, `body`, `status`, `is_featured`, `start_date`, `end_date`, `publication_status` |
| `phase` | A phase of a program | `program_id`, `sequence` (0, 1, 2), `slug`, `title`, `summary`, `period_label`, `start_date`, `end_date`, `status`, `publication_status` |
| `milestone` | A verified milestone inside a phase | `phase_id`, `slug`, `title`, `summary`, `occurred_on` (verified dates only), `venue`, `status`, `publication_status` |
| `training_track` | Core skills and specialized pathways | `program_id`, `slug`, `title`, `track_type` (`core`, `specialized`), `summary`, `intended_skills`, `practical_activity`, `safety_requirements`, `status`, `publication_status` |
| `team_profile` | Public profile, separate from any login | `slug`, `display_name`, `first_name`, `role_title`, `short_role`, `role_type` (`staff`, `volunteer`, `leadership`), `bio`, `education`, `fun_fact`, `public_email`, `social_links`, `status`, `sort_order` |
| `story` | A story, update or field dispatch | `slug`, `title`, `summary` (up to 1000 characters), `body`, `activity_date`, `next_step`, `lessons`, `outcomes`, `video_url`, `social_url`, `status`, `published_at`, `consent_status`, `is_confidential`, `review_notes` |

### Link tables

| Table | Links | Notes |
| --- | --- | --- |
| `story_authors` | story to profile | The byline. Ordered by `sort_order`, then display name. |
| `story_team` | story to profile | Lead or support role (`role`), separate from the byline. |
| `story_programs`, `story_phases`, `story_locations`, `story_themes` | story to program, phase, place, theme | "One update, many views". |
| `program_themes` | program to theme | `is_primary`: at most one primary theme per program. |
| `program_locations` | program to place | |
| `track_themes` | training track to theme | |
| `profile_programs` | profile to program | "Programs supported". |

### Constraints and delete rules

- Statuses are strings with named CHECK constraints (for example `ck_story_status`), not native enums, so a workflow change is a simple migration.
- A `PUBLISHED` story must have a `published_at` date. A phase or program cannot end before it starts. A place cannot be its own parent.
- Unique slugs on every top-level table; a phase's `sequence` and `slug` are unique within its program; milestone and track slugs are unique within their parent.
- **Cascade:** deleting a program removes its phases, milestones, tracks and links. Deleting a story removes its tags and team links.
- **Restrict:** a theme, place, program, phase or profile that is in use cannot be deleted, and neither can a place that still has child places. Archive instead.
- Dates the guide gives only as months stay `null`; the phase's `period_label` holds the wording.
- Not modelled yet: `Partner`, `Resource`, `MediaAsset`, `SocialPost`, `ContactEnquiry`, `Subscriber`, `User`/`Role` and `AuditEvent`. `TeamProfile` and `Story` also lack their user and image links.

## 7. Public visibility rules (implemented in `app/models/queries.py`)

A **story** is public only if all of these hold:

- `status` is `PUBLISHED`;
- `published_at` is set and not in the future (scheduled stories are excluded);
- `is_confidential` is false;
- `consent_status` is `confirmed` or `not_required`.

Everything else is gated by `publication_status = published` (or `status = published` for profiles):

- **Parents gate children.** A phase, milestone or training track is public only when its program is published (and a milestone also needs its phase).
- **Views.** A story tagged with a program, phase, place or theme appears on that page only while the tagged item is published. An unpublished program hides the story from the program view and nothing else.
- **People.** A profile's stories include those where the person is author, lead or support, without duplicates. Unpublished people are never shown as authors or team members.
- **Filters.** Filtering on an unpublished slug (a draft profile, a hidden theme) returns an empty list and reveals nothing.
- **Order.** Stories by `published_at` (newest first), then id. Other lists have a stable order ending in the id.

The relationships between models (for example `story.authors`, `program.themes`, `profile.stories`) are **not filtered**. Public code must never serialize them directly.

## 8. API reference (as built)

Base URL: `/api/v1`. All endpoints are `GET`. Timestamps are ISO 8601 UTC with a `Z` suffix; dates are `YYYY-MM-DD`; fields are snake_case. Every response carries an `X-Request-ID` header.

### Response formats

```json
{ "data": { "...": "..." } }
```
```json
{ "data": [ "..." ], "meta": { "pagination": { "page": 1, "per_page": 12, "total": 3, "pages": 1 } } }
```
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please correct the highlighted fields.", "details": { "per_page": ["..."] }, "request_id": "..." } }
```

| Status | Code | When |
| --- | --- | --- |
| 200 | n/a | Success, including a page past the end (empty `data`). |
| 400 | `VALIDATION_ERROR` | Invalid query (for example `per_page=1000`, `page=0`, `type=village`, `featured=maybe`, `sort=random`). |
| 404 | `NOT_FOUND` | Unknown route, or an item that is not public. |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method. |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled error; the message is generic and no internals are exposed. |

`pages` is `0` when `total` is `0`. Unknown query parameters are ignored. Pagination is `page` (at least 1) and `per_page` (1 to 50, default 12) everywhere. Detail routes embed at most the latest 5 stories; use `/stories` with a filter for the full list. A text search `q` (up to 100 characters) is case-insensitive, and `%` and `_` are matched literally.

### `GET /` and `GET /health`

`/` returns `{"name": "SOEA API", "version": "v1", "health": "/api/v1/health"}`. `/health` returns `{"status": "ok"}`, deliberately outside the `data` envelope.

### Shared shapes

| Shape | Fields |
| --- | --- |
| Story reference | `slug`, `title`, `published_at`, `url` |
| Theme or place reference | `slug`, `name`, `url` |
| Program reference | `slug`, `title`, `short_name`, `url` |
| Training track | `id`, `slug`, `title`, `track_type`, `summary`, `intended_skills`, `practical_activity`, `safety_requirements`, `status`, `themes` |
| Phase | `slug`, `sequence`, `title`, `summary`, `period_label`, `start_date`, `end_date`, `status` |
| Milestone | `slug`, `title`, `summary`, `occurred_on`, `venue`, `status` |

### Team

**`GET /team`**: parameters `page`, `per_page`, `role` (`staff`, `volunteer`, `leadership`), `q` (display name or role title). Sorted by `sort_order`, then name. Each item: `id`, `slug`, `display_name`, `first_name`, `role_title`, `short_role`, `role_type`, `image` (null for now), `url`.

**`GET /team/{slug}`**: the list fields plus `bio`, `education`, `fun_fact`, `email` (approved public work email only), `social_links` (only real `http(s)` links), `programs` (published program references) and `stories` (latest 5, story references).

**`GET /team/{slug}/stories`**: `page`, `per_page`. Public stories where the person is author, lead or support, in the story list shape below.

### Themes

**`GET /themes`**: `page`, `per_page`. Anchor first, then `sort_order`. Each item: `id`, `slug`, `name`, `summary`, `people_served`, `is_anchor`, `url` (`/our-focus/{slug}`).

**`GET /themes/{slug}`**: the same fields plus `programs` (program list items), `tracks` (training tracks linked to the theme) and `stories` (latest 5).

### Locations

**`GET /locations`**: `page`, `per_page`, `type` (`country`, `county`, `community`). Each item: `id`, `slug`, `name`, `location_type`, `summary`, `engagement_status`, `is_coordination_hub`, `parent` (a published parent as a place reference, otherwise `null`), `url` (`/where-we-work/{slug}`).

**`GET /locations/{slug}`**: the same fields plus `children` (published child places), `programs` and `stories` (latest 5). A place's stories are those tagged with that exact place; they do not include its child places.

`engagement_status` is `active` where SOEA works and `focus_only` for areas of geographic focus. Focus-only places carry no program or story claims.

### Programs

**`GET /programs`**: `page`, `per_page`, `theme` (slug), `location` (slug), `featured` (true or false). Featured programs first. Each item: `id`, `slug`, `title`, `short_name`, `summary`, `status`, `is_featured`, `themes`, `locations` (published ones only), `url` (`/programs/{slug}`).

**`GET /programs/{slug}`**: the list fields plus `body`, `start_date`, `end_date`, `phases`, `learning_areas` (core training tracks), `specialized_pathways`, `people` (published profiles linked to the program, in the team list shape) and `stories` (latest 5).

**`GET /programs/{slug}/timeline`**: the program's phases in sequence, each with a `milestones` list. It returns `{"data": [...]}` with no pagination because it is a small fixed list.

```json
{ "data": [
  { "slug": "demo-phase-0", "sequence": 0, "title": "Demo Phase 0", "summary": "DEMO summary.",
    "period_label": "DEMO period", "start_date": null, "end_date": null, "status": "completed",
    "milestones": [ { "slug": "demo-community-day", "title": "[DEMO] Community day",
                      "summary": "DEMO summary.", "occurred_on": "2026-01-15", "venue": "Demo venue",
                      "status": "completed" } ] }
] }
```

### Stories

**`GET /stories`**: `page`, `per_page`, `program`, `theme`, `location`, `author` (slugs), `q` (title or summary), `sort` (`newest` default, or `oldest`). Each item: `id`, `slug`, `title`, `summary`, `published_at`, `activity_date`, `authors` (published profiles: `slug`, `display_name`, `profile_url`), `program` (the first published program, or `null`), `themes`, `locations`, `cover_image` (null for now), `url` (`/people-stories/{slug}`).

**`GET /stories/{slug}`**: the list fields plus `body`, `next_step`, `lessons`, `outcomes`, `video_url`, `social_url` (only real `http(s)` links, otherwise `null`), `programs` (all published), `phases` (published phases of published programs: `slug`, `sequence`, `title`, `program`) and `team` (published lead or support people: `slug`, `display_name`, `role`, `profile_url`).

`body` is returned exactly as stored. Its format (Markdown or sanitized HTML) is undecided, so the frontend must not inject it as raw HTML yet. `outcomes` should only ever hold independently substantiated outcomes.

## 9. Security and privacy measures in place

- Public responses are built from **allow-list schemas**; private columns (`review_notes`, `consent_status`, `is_confidential`, `status`, `publication_status`, timestamps) are never declared, so they cannot leak by accident. Tests check the exact field set of every endpoint.
- One query layer decides what is public, tested against drafts, scheduled, confidential and unconsented content, and against unpublished parents.
- Every public demo URL is swept by a test that fails if any hidden text or private field appears.
- Social and video links are filtered on output (no `javascript:`, `data:` or host-less links).
- A client-supplied `X-Request-ID` is accepted only if it is short and plain; otherwise a new one is generated.
- Errors never expose stack traces or internal messages.
- Production refuses to start without `SECRET_KEY` and `DATABASE_URL`; CORS uses exact origins.
- Foreign keys are enforced in SQLite too, to match PostgreSQL behaviour in tests.
- There are no admin or write endpoints, so nothing unauthenticated can change data.
- The seed command refuses to run when `APP_ENV=production`.

## 10. Testing

179 tests. Run them with `python -m pytest -q`.

| File | Tests | Covers |
| --- | --- | --- |
| `test_health.py` | 2 | Health and root routes |
| `test_errors.py` | 3 | Error format, 405, generic 500 |
| `test_request_id_and_cors.py` | 4 | Request IDs and CORS |
| `test_models.py` | 11 | Team and story constraints, delete rules, public gate |
| `test_content_models.py` | 28 | Theme, place, program, phase, milestone and track rules, public queries |
| `test_story_relations.py` | 26 | New story and profile fields, tags, lead/support, "one update, many views" |
| `test_team_api.py` | 26 | Team endpoints |
| `test_content_api.py` | 40 | Themes, locations, programs, timeline |
| `test_stories_api.py` | 36 | Stories, filters, sorting, detail, the whole-API sweep |
| `test_seed.py` | 3 | Seed is idempotent, clears only demo rows, refuses in production |

- All 179 passed when run during development on Linux (Python 3.12). The first 48 were also confirmed on the Windows development machine (Python 3.13).
- The suite uses in-memory SQLite, so it does not prove PostgreSQL behaviour. The partial unique indexes (one anchor theme, one primary theme per program) and the 1000-character limit on story summaries are enforced by PostgreSQL; check them after upgrading.
- The team API was checked manually against PostgreSQL 18.6 on 22 October 2026 with the demo data.

## 11. Demo data

`flask --app run.py seed-demo` creates 5 profiles, 13 stories, 4 themes, 6 places and 2 programs, all with `demo-` slugs and obviously fake text:

- **Public:** 3 published profiles (staff, volunteer, leadership), 4 public stories, an anchor theme and 2 more, 5 places (including a coordination hub and a focus-only county) and one featured program with 3 phases, a milestone, a core track and a specialized pathway.
- **Never public:** a draft and an archived profile; drafts, in-review, changes-requested, approved-but-unpublished, scheduled, confidential, consent-unreviewed, consent-withdrawn and archived stories; a draft theme, place, program, phase, milestone and track.

Hidden rows contain `[HIDDEN]` in their titles or names, and no public response may ever contain that text. `--clear` removes the demo rows only.

## 12. Alignment with the guides

A tracker spreadsheet (`SOEA_Backend_Alignment_Tracker.xlsx`) records every item. In summary:

**Aligned:** response formats, ISO 8601 UTC timestamps, pagination and sorting, published-only rules, private-field protection, workflow statuses and constraints, slug and index rules, CORS, production configuration, seed data, PostgreSQL setup, the program, phase, milestone, theme, location and track models, the content-guide fields on stories and profiles, and 10 of the handoff guide's 12 public read endpoints (everything except `/resources` and `/partners`).

**What the content guide settled:**

- The Founder and Executive Lead belongs under Governance & Board, not the volunteer directory, and the eight directory people are volunteers. `GET /team` still includes `leadership` profiles; it should exclude them by default once the content owner confirms (decision C-02).
- Public status badges are Completed, In progress, Planned and Coming soon.
- Subscribers are in scope; donations and the Environmental Super Cup are not mentioned.
- One update, many views: a story tagged with a program, phase, place, person and theme appears on all of those pages.

**Inconsistencies in the content guide to send back to the content owner:**

1. The approach steps are worded differently on Home ("Listen & Understand", "Train & Equip") and Our Approach ("Understand the Challenge", "Build Capabilities").
2. Theme names use "and" in some places and "&" in others.
3. Several social URLs are still placeholders.
4. The volunteer profiles lack portraits, education, emails and fun facts, and the baseline report PDF has not been supplied.
5. No board members are listed.

**Process:** the handoff guide's Phase 0 requires both developers to approve the API contract before frontend integration. Until the frontend developer signs off, treat every field name above as a proposal.

## 13. Decisions that need confirming

| ID | Decision | Current state | Who |
| --- | --- | --- | --- |
| C-01 | `is_confidential` or the guide's `confidentiality_flag` | `is_confidential`. A rename after the first migration is shared needs its own migration. | Both developers |
| C-02 | Should `/team` exclude `leadership` profiles? | Included for now. | Content owner |
| C-03 | Consent values | `unreviewed`, `not_required`, `confirmed`, `withdrawn` (my proposal). | Content owner |
| C-04 | 400 or 422 for validation errors | 400, set in one constant. | Both developers |
| C-05 | Canonical story route | `/people-stories/{slug}`; News & Updates is treated as a filtered list. | Both developers |
| C-06 | Reserved fields | `image` and `cover_image` stay null until media exists. | Backend developer |
| C-07 | Story `body` format | Markdown or sanitized HTML undecided; returned as stored. | Both developers |
| C-08 | SQLite development fallback | Cannot run the PostgreSQL migrations; consider requiring `DATABASE_URL`. | Backend developer |
| C-09 | Route prefixes in `url` fields | `/our-focus`, `/where-we-work`, `/programs`, in `app/schemas/urls.py`. | Both developers |
| C-10 | Should a place's stories include its child places? | Exact match only. | Content owner |
| C-11 | Detail routes beyond the guide's list | `/themes/{slug}` and `/locations/{slug}` added for the content guide's subpages. | Both developers |

## 14. Known limitations

- **SQLite fallback.** If `DATABASE_URL` is unset, development falls back to SQLite, but the committed migrations are PostgreSQL-only (SQLite rejects the `now()` default), so the fallback only works for the tests.
- **Tests do not exercise PostgreSQL.** There is no CI yet.
- **No authentication, roles, rate limiting or admin endpoints.** Nothing can be changed through the API.
- **Missing endpoints and models.** `/resources`, `/partners`, contact enquiries and subscriptions need models that do not exist yet, as do media, social posts, users and the audit log.
- **Leadership profiles appear in `/team`** until C-02 is decided.
- **A story shows one program in lists** (the first published); the detail route lists all of them.
- **Stories have no cover image or attachments** until media support exists.
- **No import of real content.** Only demo data exists. Real profiles, programs and stories must come through an approved import or the future admin workflow.

## 15. Next steps

1. Review this document and the API reference with the frontend developer and agree the contract (handoff guide Phase 0), including the decisions in section 13.
2. Send the content-guide inconsistencies (section 12) to the content owner and get answers on C-02, C-03 and C-10.
3. Make sure `migrations/` is committed, then share the repository.
4. Add CI that runs the tests, ideally with a PostgreSQL-backed run.
5. Build the remaining models: `Partner`, `Resource`, `MediaAsset`, `SocialPost`, `ContactEnquiry` (with phone, partnership category, experience and consent) and `Subscriber`; then `/resources`, `/partners`, the contact endpoint, the subscribe endpoint and rate limiting.
6. Write an import script that loads the approved content as drafts, so nothing real is published before consent, portraits and approvals are in.
7. Agree the authentication approach, then build `User`, `AuditEvent` and the admin workflow (handoff guide Phase 5).

## 16. Timeline

| Date | Work |
| --- | --- |
| 21 Oct 2026 | Reviewed the handoff guide and the old repository. Built the Flask scaffold, the `TeamProfile`, `Story` and `story_authors` models with the public query gate, the team API with schemas and tests, and the seed command. Initialized migrations. |
| 22 Oct 2026 | Installed PostgreSQL 18.6, created the `soea_dev` database and user, connected Flask through `DATABASE_URL`, regenerated the initial migration on PostgreSQL and verified the team API against it. Wrote the first alignment tracker, status document and README. |
| 23 to 27 Oct 2026 | Received and reviewed the content guide. Built the theme, location, program, phase, milestone and training-track models, then the story and profile changes with the tagging and team links. Built the themes, locations, programs and stories endpoints and extended the team endpoints and demo data (179 tests). Updated this document, the README and the tracker. |
