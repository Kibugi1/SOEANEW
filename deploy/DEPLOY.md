# Deploying the SOEA website

Everything runs on the Hostinger VPS (`179.198.203.133`) that already serves BiYo's
API and the current static sq1ecoafrica.org site, behind the nginx already there.

| Part | Runs as | Local port | Public address |
| --- | --- | --- | --- |
| API (Flask + gunicorn) | `soea-backend` service | 8020 | `https://api.sq1ecoafrica.org` |
| Website (Next.js) | `soea-frontend` service | 3020 | `https://new.sq1ecoafrica.org` while testing, then `https://sq1ecoafrica.org` |
| Database | PostgreSQL, database `soeaweb` | 5432 | none |
| Form rate limits | Redis, DB 1 | 6379 | none |

Everything SOEA-specific lives under `/srv/soeaweb`, owned by its own `soeaweb` user,
so it stays separate from BiYo (`/srv/biyo`, port 8010) and from your `soea` login.

The current site stays live until step 9. Steps 1–8 only add new addresses.

---

## 0. Before you start

- Push the code: `git push origin main` (from your laptop).
- Commands starting with `sudo` are run by you over SSH: `ssh soea@179.198.203.133`.
- See what's already installed and that the two ports are free:
  ```bash
  node -v; redis-cli ping; psql --version; ss -ltn | grep -E ':8020|:3020' || echo "ports free"
  ```

## 1. DNS

Where the sq1ecoafrica.org DNS is managed (the same place you added `biyo-api`), add:

| Name | Type | Value |
| --- | --- | --- |
| `api` | A | `179.198.203.133` |
| `new` | A | `179.198.203.133` |

Check: `dig +short api.sq1ecoafrica.org` and `dig +short new.sq1ecoafrica.org` both show the IP.

## 2. Packages (only what's missing from step 0)

```bash
sudo apt update
sudo apt install -y python3-venv python3-dev git redis-server postgresql postgresql-contrib
# Node 22 (Next.js 16 needs Node 20.9 or newer). Skip if `node -v` already shows v20.9+.
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo systemctl enable --now redis-server
redis-cli ping            # PONG
```

The website build needs about 1.5 GB of memory. If `swapon --show` prints nothing,
add 2 GB of swap so a build can never run the VPS out of memory (BiYo shares it):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Ubuntu's Redis only listens on 127.0.0.1 by default. Keep it that way.

## 3. User, database and code

```bash
sudo adduser --system --group --home /srv/soeaweb --shell /bin/bash soeaweb
sudo -u soeaweb mkdir -p /srv/soeaweb/uploads /srv/soeaweb/backups

# Database (choose a strong password; you'll put it in backend.env)
sudo -u postgres psql -c "CREATE USER soeaweb WITH PASSWORD 'DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE soeaweb OWNER soeaweb;"
```

The repository `square1ecoafrica/SOEANEW` is private, so give the VPS read-only access
with a deploy key:

```bash
sudo -u soeaweb mkdir -m 700 -p /srv/soeaweb/.ssh
sudo -u soeaweb ssh-keygen -t ed25519 -N "" -f /srv/soeaweb/.ssh/id_ed25519 -C "soeaweb@vps"
sudo cat /srv/soeaweb/.ssh/id_ed25519.pub
```

On GitHub: **SOEANEW → Settings → Deploy keys → Add deploy key**, paste it, leave
"Allow write access" **off**. Then:

```bash
sudo -u soeaweb git clone git@github.com:square1ecoafrica/SOEANEW.git /srv/soeaweb/SOEANEW
cd /srv/soeaweb/SOEANEW/backend
sudo -u soeaweb python3 -m venv .venv
sudo -u soeaweb .venv/bin/pip install -r requirements.txt
```

## 4. Settings

```bash
sudo cp /srv/soeaweb/SOEANEW/deploy/backend.env.example  /srv/soeaweb/backend.env
sudo cp /srv/soeaweb/SOEANEW/deploy/frontend.env.example /srv/soeaweb/frontend.env
sudo nano /srv/soeaweb/backend.env     # fill in SECRET_KEY, the DB password, SMTP_PASSWORD
sudo chown soeaweb:soeaweb /srv/soeaweb/*.env
sudo chmod 600 /srv/soeaweb/backend.env
```

- `SECRET_KEY`: `python3 -c "import secrets; print(secrets.token_hex(32))"`. Use a new
  one, not the one from your laptop.
- `SMTP_PASSWORD`: the same info@ app password as in your local `backend/.env`.
- `frontend.env` needs no changes.

## 5. Bring your content across

Your laptop's database already has the programs, partners, stories, events and
accounts you've set up. Copy it, plus the uploaded photos, instead of re-entering them.

**On your laptop** (from `SOEANEW/backend`):

```bash
set -a; source .env; set +a
pg_dump --no-owner --no-privileges "${DATABASE_URL/+psycopg/}" > /tmp/soea-content.sql
scp /tmp/soea-content.sql soea@179.198.203.133:/tmp/
tar -czf /tmp/soea-uploads.tar.gz -C instance uploads
scp /tmp/soea-uploads.tar.gz soea@179.198.203.133:/tmp/
```

**On the VPS:**

```bash
sudo -u postgres psql soeaweb -c "SET ROLE soeaweb;" -f /tmp/soea-content.sql
sudo tar -xzf /tmp/soea-uploads.tar.gz -C /srv/soeaweb
sudo chown -R soeaweb:soeaweb /srv/soeaweb/uploads
rm /tmp/soea-content.sql /tmp/soea-uploads.tar.gz
```

Then bring the database up to date (does nothing if it already is):

```bash
cd /srv/soeaweb/SOEANEW/backend
sudo -u soeaweb bash -c 'set -a; source /srv/soeaweb/backend.env; set +a; FLASK_APP=wsgi.py .venv/bin/flask db upgrade'
```

Your dashboard accounts come across with their passwords. Before launch, delete any
test messages, subscribers or stories from the dashboard.

## 6. Start the API

```bash
sudo cp /srv/soeaweb/SOEANEW/deploy/soea-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now soea-backend
sudo systemctl status soea-backend          # active (running)
curl http://127.0.0.1:8020/api/v1/health     # answers
```

Logs: `sudo journalctl -u soea-backend -f`

## 7. Build and start the website

`deploy.sh` builds the site into `/srv/soeaweb/releases/` and points
`/srv/soeaweb/frontend-current` at it. It restarts the two services itself, so first let
`soeaweb` do that (and nothing else):

```bash
echo 'soeaweb ALL=(root) NOPASSWD: /usr/bin/systemctl restart soea-backend, /usr/bin/systemctl restart soea-frontend' | sudo tee /etc/sudoers.d/soeaweb
sudo chmod 440 /etc/sudoers.d/soeaweb && sudo visudo -c
sudo cp /srv/soeaweb/SOEANEW/deploy/soea-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable soea-frontend
sudo -u soeaweb /srv/soeaweb/SOEANEW/deploy/deploy.sh     # a few minutes
curl -sI http://127.0.0.1:3020 | head -1      # HTTP/1.1 200 OK
```

## 8. nginx and HTTPS for api. and new.

```bash
sudo cp /srv/soeaweb/SOEANEW/deploy/nginx-soea.conf /etc/nginx/sites-available/soeaweb
sudo ln -s /etc/nginx/sites-available/soeaweb /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.sq1ecoafrica.org -d new.sq1ecoafrica.org
```

`nginx -t` checks everything before reloading, so a mistake can't take the old site or
BiYo down.

### Test on https://new.sq1ecoafrica.org

- [ ] `curl https://api.sq1ecoafrica.org/api/v1/health` answers
- [ ] Every page opens; photos and the Mathare video show
- [ ] Sign in at `/admin`; programs, stories and partner logos show their images
- [ ] Contact form → alert reaches info@; partnership → partnerships@; volunteer → career@
- [ ] Newsletter sign-up → confirmation email arrives, and the link confirms
- [ ] Upload a photo in the dashboard; it appears on the site

## 9. Switch sq1ecoafrica.org to the new site

The old static site is `/etc/nginx/sites-available/soea` (only `sq1ecoafrica.org` and
`www.`). It is switched off, not deleted, so you can switch back.

1. Grow the existing `sq1ecoafrica.org` certificate to cover all four names (the old
   site keeps working meanwhile):
   ```bash
   sudo certbot certonly --nginx --cert-name sq1ecoafrica.org --expand \
     -d sq1ecoafrica.org -d www.sq1ecoafrica.org -d new.sq1ecoafrica.org -d api.sq1ecoafrica.org \
     --deploy-hook "systemctl reload nginx"
   ```
2. Keep copies, install the live config, switch the old site off, check, apply:
   ```bash
   sudo cp /etc/nginx/sites-available/soea    /srv/soeaweb/old-site-nginx.conf.bak
   sudo cp /etc/nginx/sites-available/soeaweb /srv/soeaweb/staging-nginx.conf.bak
   sudo cp /srv/soeaweb/SOEANEW/deploy/nginx-soea-live.conf /etc/nginx/sites-available/soeaweb
   sudo rm /etc/nginx/sites-enabled/soea
   sudo nginx -t && sudo systemctl reload nginx
   ```
   If `nginx -t` fails, nothing has changed yet: put things back with
   `sudo ln -s /etc/nginx/sites-available/soea /etc/nginx/sites-enabled/soea` and
   `sudo cp /srv/soeaweb/staging-nginx.conf.bak /etc/nginx/sites-available/soeaweb`.
3. The staging certificate is no longer used: `sudo certbot delete --cert-name api.sq1ecoafrica.org`

**To switch back later:** restore the two `.bak` files to `sites-available/`, run
`sudo ln -s /etc/nginx/sites-available/soea /etc/nginx/sites-enabled/soea`, then
`sudo nginx -t && sudo systemctl reload nginx`.

## 10. Backups and updates

```bash
sudo -u soeaweb crontab -e
# nightly at 02:30: database + uploads, keep 14 days
30 2 * * * /srv/soeaweb/SOEANEW/deploy/backup.sh
```

Copy `/srv/soeaweb/backups` off the VPS now and then (`scp` to your laptop). A backup
that only lives on the server is lost along with the server.

**Updates:** merge to `main`, then either press **Run workflow** in
GitHub (next section) or, on the VPS:

```bash
sudo -u soeaweb /srv/soeaweb/SOEANEW/deploy/deploy.sh
```

This pulls the code, installs requirements, applies migrations and restarts the API, then
builds the website in a new folder under `/srv/soeaweb/releases/` while the current one
keeps serving. Only when the build succeeds does `/srv/soeaweb/frontend-current` switch
to it, so a failed build never touches the live site. The last 3 builds are kept.

**Roll back the website** to an earlier build:

```bash
ls -1t /srv/soeaweb/releases/            # newest first
sudo -u soeaweb ln -sfn /srv/soeaweb/releases/OLDER_FOLDER/frontend /srv/soeaweb/frontend-current
sudo systemctl restart soea-frontend
```

## 11. Automatic checks and deploys (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`) runs on every push and pull request: backend tests,
  then the website's type check, lint and build.
- **Deploy** (`.github/workflows/deploy.yml`) runs only when someone presses
  **Actions → Deploy → Run workflow** on `main`. It runs CI again, then connects to the
  VPS and runs `deploy.sh`, then checks the live site. That button is the approval step.

The key GitHub uses can only run `deploy.sh`: the VPS ignores any other command sent
with it, and it can't open a shell or forward ports.

**One-time setup.** On your laptop, make the key:

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f ~/soea-gh-deploy
cat ~/soea-gh-deploy.pub
```

On the VPS, allow it to run `deploy.sh` and nothing else (paste the `.pub` line where shown):

```bash
echo 'restrict,command="/srv/soeaweb/SOEANEW/deploy/deploy.sh" PASTE_PUB_KEY_HERE' | sudo -u soeaweb tee -a /srv/soeaweb/.ssh/authorized_keys
sudo chmod 600 /srv/soeaweb/.ssh/authorized_keys
```

In GitHub, **SOEANEW → Settings → Secrets and variables → Actions → New repository
secret**, add:

| Name | Value |
| --- | --- |
| `VPS_HOST` | `179.198.203.133` |
| `VPS_SSH_KEY` | everything in `~/soea-gh-deploy` (the file **without** `.pub`) |
| `VPS_KNOWN_HOSTS` | the output of `ssh-keyscan -t ed25519 179.198.203.133` |

Then delete the key files from your laptop: `rm ~/soea-gh-deploy ~/soea-gh-deploy.pub`.
To revoke GitHub's access at any time, delete its line from
`/srv/soeaweb/.ssh/authorized_keys`.

## After launch

- **DMARC:** add a TXT record `_dmarc` with value
  `v=DMARC1; p=none; rua=mailto:info@sq1ecoafrica.org`. It helps newsletters avoid spam
  folders (SPF and DKIM are already set up).
- `sudo systemctl status soea-backend soea-frontend` should still say running after a VPS reboot.
