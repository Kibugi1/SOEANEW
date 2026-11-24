#!/usr/bin/env bash
# Update the SOEA site on the VPS to the latest main. Run as the soeaweb user:
#   sudo -u soeaweb /srv/soeaweb/SOEANEW/deploy/deploy.sh
# GitHub Actions runs the same script through its deploy key (DEPLOY.md, "Automatic deploys").
#
# The website is built in its own folder under releases/ while the current one keeps
# serving, then frontend-current is pointed at it and the service restarted (a second or
# two). A failed build changes nothing on the live site.
set -euo pipefail

ROOT=/srv/soeaweb
REPO=$ROOT/SOEANEW
RELEASES=$ROOT/releases
KEEP=3

main() {
  # One deploy at a time.
  exec 9>"$ROOT/.deploy.lock"
  flock -n 9 || { echo "Another deploy is already running."; exit 1; }

  cd "$REPO"
  git pull --ff-only
  local sha
  sha=$(git rev-parse --short HEAD)

  echo "== API"
  cd "$REPO/backend"
  .venv/bin/pip install -q -r requirements.txt
  (set -a; source "$ROOT/backend.env"; set +a; FLASK_APP=wsgi.py .venv/bin/flask db upgrade)
  sudo /usr/bin/systemctl restart soea-backend

  # The website's build reads programs and stories from the API, so wait for it.
  local ok=""
  for _ in $(seq 1 30); do
    if curl -fs http://127.0.0.1:8020/api/v1/health >/dev/null; then ok=1; break; fi
    sleep 1
  done
  [ -n "$ok" ] || { echo "API did not come back up; see: journalctl -u soea-backend"; exit 1; }

  echo "== Website ($sha)"
  # A new folder every time, so re-deploying the same commit never touches the live one.
  local rel
  rel="$RELEASES/$(date +%Y%m%d-%H%M%S)-$sha"
  mkdir -p "$rel"
  git -C "$REPO" archive HEAD frontend | tar -x -C "$rel"
  cd "$rel/frontend"
  cp "$ROOT/frontend.env" .env.production.local
  npm ci --no-audit --no-fund
  npm run build

  # Switch in one step, then restart onto the new build.
  ln -sfn "$rel/frontend" "$ROOT/frontend-next"
  mv -Tf "$ROOT/frontend-next" "$ROOT/frontend-current"
  sudo /usr/bin/systemctl restart soea-frontend

  # Keep the newest few releases for a quick roll-back; never the live one.
  local live
  live=$(readlink -f "$ROOT/frontend-current")
  ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    [ "$(readlink -f "$old")/frontend" = "$live" ] || rm -rf "$old"
  done

  echo "Deployed $sha"
}

# Everything runs from main(), so a git pull that changes this file can't confuse the
# copy that's already running.
main "$@"
exit
