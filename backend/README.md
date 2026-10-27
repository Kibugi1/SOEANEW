# SOEA Backend

Flask JSON API for the SOEA website revamp. The Next.js frontend consumes it; Flask serves no HTML.

**Status:** early but broad. It has a health check, public read endpoints for team profiles, themes, locations, programs (with a phase timeline) and stories, PostgreSQL migrations, and clearly marked demo data. See [docs/BACKEND_STATUS.md](docs/BACKEND_STATUS.md) for the full API reference, what is built, the decisions made and what comes next.

## Requirements

- Python 3.12 or newer (developed on 3.13)
- PostgreSQL (developed on 18). Needed for migrations and for running the API against real data.
- Git

The test suite uses an in-memory SQLite database and does not need PostgreSQL.

## Quick start

### 1. Create the environment and install packages

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Your prompt should start with `(.venv)`. Activate the environment again in every new terminal.

### 2. Create the database (one time)

Open `psql` as the PostgreSQL superuser (`psql -U postgres -h localhost` on Windows, or `sudo -u postgres psql` on Linux) and run:

```sql
CREATE USER soea_dev;
\password soea_dev
CREATE DATABASE soea_dev OWNER soea_dev;
\q
```

`\password` asks for the new password at a hidden prompt, so it never appears in your command history. Typing is invisible at psql password prompts; type it and press Enter.

### 3. Configure `.env`

```powershell
Copy-Item .env.example .env     # Windows
```
```bash
cp .env.example .env            # macOS / Linux
```

Edit `.env`:

- `SECRET_KEY`: generate one with `python -c "import secrets; print(secrets.token_hex(32))"`.
- `DATABASE_URL`: uncomment it and fill in your password:
  `postgresql+psycopg://soea_dev:YOUR_PASSWORD@localhost:5432/soea_dev`

If the password contains special characters (`@ : / # % ?`), percent-encode them in the URL (for example `@` becomes `%40`). Letters and digits need no encoding.

Never commit `.env`.

### 4. Apply migrations and load demo data

```
flask --app run.py db upgrade
flask --app run.py seed-demo
```

### 5. Run the API

```
flask --app run.py run --debug
```

Check it (use `curl.exe` on Windows PowerShell, `curl` elsewhere):

```
curl.exe -i http://127.0.0.1:5000/api/v1/health
```

Expected: `200` and `{"status": "ok"}`. Then try:

- `http://127.0.0.1:5000/api/v1/programs/demo-ceci`
- `http://127.0.0.1:5000/api/v1/programs/demo-ceci/timeline`
- `http://127.0.0.1:5000/api/v1/locations/demo-nairobi`
- `http://127.0.0.1:5000/api/v1/stories?program=demo-ceci`
- `http://127.0.0.1:5000/api/v1/team/demo-staff-one`

`--debug` is for your own machine only. The debugger console can run code on the server, so never run with debug on in production.

## Configuration

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `APP_ENV` | No | `development` | `development`, `testing` or `production`. |
| `SECRET_KEY` | Production | dev-only value in development | Long, random and stable. Changing it invalidates signed sessions. |
| `DATABASE_URL` | Production, and in practice development | none | Use the `postgresql+psycopg://` prefix (psycopg 3). |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated exact origins, no wildcards. |

Production refuses to start without `SECRET_KEY` and `DATABASE_URL`.

CORS origins must match exactly: `http://localhost:3000` and `http://127.0.0.1:3000` are different origins.

> **SQLite note.** If `DATABASE_URL` is unset, development falls back to a local SQLite file, but the committed migrations are PostgreSQL-only (SQLite rejects their `now()` default). In practice, set `DATABASE_URL` and use PostgreSQL. The SQLite fallback only works for the tests.

## API (v1)

Base URL: `http://127.0.0.1:5000/api/v1`. Every endpoint is read-only (`GET`) and returns published content only.

| Path | Purpose | Parameters |
| --- | --- | --- |
| `/health` | Smoke test. Returns `{"status": "ok"}`. | none |
| `/team` | Published team profiles. | `page`, `per_page`, `role` (`staff`, `volunteer`, `leadership`), `q` |
| `/team/{slug}` | One profile, with programs supported and its latest 5 public stories. | none |
| `/team/{slug}/stories` | The person's public stories (as author, lead or support). | `page`, `per_page` |
| `/themes` | The anchor area and thematic areas, anchor first. | `page`, `per_page` |
| `/themes/{slug}` | One theme with its programs, training tracks and latest stories. | none |
| `/locations` | Places as a tree (Kenya, county, community). | `page`, `per_page`, `type` (`country`, `county`, `community`) |
| `/locations/{slug}` | One place with child places, programs and latest stories. | none |
| `/programs` | Programs and initiatives. | `page`, `per_page`, `theme`, `location`, `featured` |
| `/programs/{slug}` | One program with phases, learning areas, specialized pathways, people and latest stories. | none |
| `/programs/{slug}/timeline` | The program's phases, each with its milestones. Not paginated. | none |
| `/stories` | Public stories, newest first. | `page`, `per_page`, `program`, `theme`, `location`, `author`, `q`, `sort` (`newest`, `oldest`) |
| `/stories/{slug}` | One story with body, next step, lessons, links, phases and team. | none |

`per_page` is 1 to 50 (default 12). The filters `theme`, `location`, `program` and `author` take slugs. A filter on an unknown or unpublished slug returns an empty list.

Collections return `{"data": [...], "meta": {"pagination": {"page", "per_page", "total", "pages"}}}`. Single items return `{"data": {...}}`. Errors return `{"error": {"code", "message", "details", "request_id"}}`. Every response carries an `X-Request-ID` header. Timestamps are ISO 8601 UTC with a `Z` suffix and dates are `YYYY-MM-DD`.

Draft, archived and unknown items all return the same `404`. A phase, milestone or training track is public only when its program is public too. Drafts, scheduled, confidential and unconsented stories never appear in any public response. The full field-by-field reference is in [docs/BACKEND_STATUS.md](docs/BACKEND_STATUS.md).

## For frontend developers

- You need the API, not the database, and you never need database credentials.
- Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api/v1` in the frontend's `.env.local`.
- `seed-demo` gives you sample data. Titles and names containing `[HIDDEN]` must never appear in any response. If you see one, report it as a bug.
- Each item has a `url` field with the frontend route (`/team/...`, `/people-stories/...`, `/programs/...`, `/our-focus/...`, `/where-we-work/...`). The prefixes are provisional and live in one file, `app/schemas/urls.py`.
- `image` and `cover_image` are present but `null` until media support exists.
- A place's `engagement_status` is `active` (SOEA works there) or `focus_only` (a geographic area of focus). Do not present focus-only places as active work.
- Dates that are not yet verified are `null`. Phases also carry a free-text `period_label` (for example "October 2026 to March 2027").
- Story `body` is returned exactly as stored, and its format (Markdown or sanitized HTML) is still undecided. Do not inject it as raw HTML yet.

## Tests

```
python -m pytest -q
```

The suite (currently 179 tests) covers the health route, error format, request IDs, CORS, model constraints and delete rules, the public-visibility rules, every endpoint and the seed command. It runs on in-memory SQLite, so it does not prove PostgreSQL behaviour. After changing models or queries, also run `seed-demo` and call the endpoints against PostgreSQL.

## Database migrations

1. Add or change a model in `app/models/` and import it in `app/models/__init__.py`.
2. `flask --app run.py db migrate -m "describe the change"`
3. Read the generated file in `migrations/versions/`.
4. `flask --app run.py db upgrade`
5. Commit the migration together with the model change.

Generate migrations against PostgreSQL, never SQLite. `flask --app run.py db downgrade` rolls back one step in development. Changes to the API layer (schemas and routes) need no migration.

## Demo data

```
flask --app run.py seed-demo            # (re)create demo rows
flask --app run.py seed-demo --clear    # remove demo rows only
```

Demo rows use `demo-` slugs and obviously fake text: 5 profiles, 13 stories, 4 themes, 6 places, 2 programs with phases, a milestone and training tracks. Many rows exist only to prove that hidden content stays hidden (drafts, scheduled, confidential, unconsented, unpublished parents). The command refuses to run when `APP_ENV=production`.

## Project layout

```
backend/
├── run.py                    # entry point
├── pytest.ini
├── requirements.txt
├── .env.example
├── docs/
│   └── BACKEND_STATUS.md     # status, API reference, decisions, next steps
├── app/
│   ├── __init__.py           # create_app(): extensions, blueprint, errors, request IDs, CLI
│   ├── config.py             # development / testing / production
│   ├── extensions.py         # db, migrate, cors, constraint naming
│   ├── errors.py             # JSON error format
│   ├── seed.py               # seed-demo command
│   ├── api/
│   │   ├── helpers.py        # pagination, 404 helper, response envelopes
│   │   └── v1/               # health, team, themes, locations, programs, stories
│   ├── models/               # one module per entity; queries.py holds the public gates
│   └── schemas/              # public allow-list response schemas and query-string schemas
├── migrations/               # Alembic (Flask-Migrate)
└── tests/
```

## Conventions

- **One public gate.** Public endpoints select data only through `app/models/queries.py`. Never start from a relationship such as `story.authors` or `profile.stories`; those are unfiltered.
- **Allow-list schemas.** Public responses are built from the schemas in `app/schemas/`. Never return ORM objects. A new field is private until it is declared in a schema.
- **Two kinds of status.** `publication_status` (draft, published, archived) is the internal gate and is never shown. `status` (completed, in progress, planned, coming soon) is the public badge. `TeamProfile.status` and `Story.status` are their own workflow fields.
- **Parents gate children.** A phase, milestone or track is public only when its program is published.
- **Models.** UUID primary keys, timezone-aware UTC timestamps, string statuses with CHECK constraints, named constraints, and `RESTRICT` on anything that is in use (archive instead of deleting).
- **Errors** go through the shared handlers (`abort(404)`, `ValidationError`). Do not hand-build error responses.
- **No admin or write endpoints** until authentication and roles are agreed.
- **Secrets** stay out of Git, and nothing secret goes in a `NEXT_PUBLIC_*` variable.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `flask` or `pytest` not found | The virtual environment is not active. The prompt should start with `(.venv)`. |
| `psql` is not recognized (Windows) | Add PostgreSQL's `bin` folder to PATH for the session: `$env:Path += ";C:\Program Files\PostgreSQL\18\bin"` (use your version number). |
| `password authentication failed` | The password in `DATABASE_URL` does not match. Reset it with `\password soea_dev` in psql, and percent-encode special characters in the URL. |
| Migration log says `SQLiteImpl` | `DATABASE_URL` is not being read. Check that `.env` is in `backend/` and the line is uncommented. |
| Migration fails with `near "(": syntax error` | You are running a PostgreSQL migration on SQLite. Use PostgreSQL. |
| `relation "story_team" does not exist` (or similar) | Migrations are not applied. Run `flask --app run.py db upgrade`. |
| Driver or dialect error | The URL must start with `postgresql+psycopg://` (psycopg 3). |
| Browser CORS error | The frontend's origin must exactly match `CORS_ORIGINS`, including host and port. |
| A test fails with `DROP TABLE location` | Do not call `db.drop_all()` in fixtures. Each test already gets a fresh in-memory database. |

## Further reading

- [docs/BACKEND_STATUS.md](docs/BACKEND_STATUS.md): current status, API reference, decisions and next steps.
- `SOEA_Website_Project_Outline_and_Backend_Handoff_Guide.docx`: the product requirements and API contract this backend follows (kept outside the repo).
- `SOEA Website Content & Developer's Guide` (14 October 2026 edition): the approved content source of truth (kept outside the repo).
