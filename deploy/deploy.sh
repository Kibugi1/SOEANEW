#!/usr/bin/env bash
# Update the SOEA site on the VPS to the latest main. Run as the soeaweb user:
#   sudo -u soeaweb /srv/soeaweb/SOEANEW/deploy/deploy.sh
set -euo pipefail
ROOT=/srv/soeaweb
cd "$ROOT/SOEANEW"
git pull --ff-only

echo "== API"
cd backend
.venv/bin/pip install -q -r requirements.txt
set -a; source "$ROOT/backend.env"; set +a
FLASK_APP=wsgi.py .venv/bin/flask db upgrade
sudo systemctl restart soea-backend

# The website's build reads programs and stories from the API, so wait for it.
for _ in $(seq 1 30); do
  curl -fs http://127.0.0.1:8020/api/v1/health >/dev/null && break
  sleep 1
done

echo "== Website"
cd ../frontend
cp "$ROOT/frontend.env" .env.production.local
npm ci --no-audit --no-fund
npm run build
sudo systemctl restart soea-frontend

echo "Deployed $(git rev-parse --short HEAD)"
