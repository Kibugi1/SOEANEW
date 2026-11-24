#!/usr/bin/env bash
# Nightly backup of the database and uploaded files, keeping 14 days. Cron (as soeaweb):
#   30 2 * * * /srv/soeaweb/SOEANEW/deploy/backup.sh
set -euo pipefail
ROOT=/srv/soeaweb
cd "$ROOT"
mkdir -p "$ROOT/backups"
set -a; source "$ROOT/backend.env"; set +a
STAMP=$(date +%Y%m%d-%H%M)

# pg_dump does not understand SQLAlchemy's "+psycopg" driver suffix.
pg_dump "${DATABASE_URL/+psycopg/}" | gzip > "$ROOT/backups/soea-db-$STAMP.sql.gz"
tar -czf "$ROOT/backups/soea-uploads-$STAMP.tar.gz" -C "$ROOT" uploads

find "$ROOT/backups" -name 'soea-*' -mtime +14 -delete
