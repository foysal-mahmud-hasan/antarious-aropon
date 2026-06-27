# Deploying Aropon (test build) — no Docker

Lightweight for a small droplet: **PostgreSQL + a single bundled Node API (systemd) + nginx**
serving the prebuilt web. The RAM-heavy web build runs on your **dev machine / CI**, not the
droplet — the droplet only stores static files and runs a ~750 KB self-contained API bundle.

> **Test build:** login uses a dev OTP (the 6-digit code is shown in the app — no SMS gateway),
> FB/IG inbox runs on demo data, and the app runs online. Production roadmap (Supabase Auth + SMS,
> Meta Graph, PowerSync) is in `.claude/`.

## On the droplet
- **PostgreSQL** (apt)
- **/opt/aropon/server.mjs** — the bundled API (one file, needs only Node), run by systemd on
  `127.0.0.1:8787`. It **auto-applies migrations + demo seed on start**.
- **nginx** — serves `/var/www/aropon` (web static) and proxies `/trpc` + `/health` → the API.

## 1. One-time droplet setup (Ubuntu)
```bash
# Node 20 + Postgres + nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx

# Postgres: db + user
sudo -u postgres psql -c "CREATE USER aropon WITH PASSWORD 'CHANGE_THIS';"
sudo -u postgres psql -c "CREATE DATABASE aropon OWNER aropon;"

# app user + dirs
sudo useradd -r -s /usr/sbin/nologin aropon || true
sudo mkdir -p /opt/aropon/migrations /var/www/aropon
sudo chown -R aropon /opt/aropon

# env (set DB password + a long random AUTH_JWT_SECRET)
sudo cp infra/api.env.example /opt/aropon/api.env
sudo nano /opt/aropon/api.env
sudo chmod 600 /opt/aropon/api.env

# systemd service
sudo cp infra/aropon-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable aropon-api

# nginx site
sudo cp infra/nginx.conf.example /etc/nginx/sites-available/aropon
sudo ln -sf /etc/nginx/sites-available/aropon /etc/nginx/sites-enabled/aropon
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 2. Build & ship (from your dev machine)
```bash
scripts/deploy.sh user@droplet-ip
```
Builds the API bundle + web export locally, rsyncs them to the droplet, restarts the API. On first
start the API migrates the DB and seeds demo data.

## 3. HTTPS (optional)
Point a domain A-record at the droplet, set `server_name your-domain.com;` in the nginx site, then:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 4. Demo logins (testers)
Open `http://<droplet-ip>/` (or your domain). Enter a phone, tap "Send code", the 6-digit code
appears on screen (test mode), then verify.

| Account | Phone | Tier |
|---|---|---|
| Demo shop (bookkeeping only) | `+8801700000000` | T0 |
| Demo shop (social commerce) | `+8801700000001` | T1 |

Testers can also sign up with their own phone, and switch **T0 ↔ T1** in **Settings → প্যাকেজ (টেস্ট)**.

## Update / operate
```bash
scripts/deploy.sh user@host        # deploy an update
sudo journalctl -u aropon-api -f   # API logs
sudo systemctl restart aropon-api  # restart
```

## Notes / limits
- The API bundle is **self-contained** (only Node required) — no `node_modules` on the droplet.
- Data persists in Postgres. Keep `NODE_ENV=development` for the dev-OTP login while testing.
- Don't build the web on a tiny droplet (Expo export needs RAM) — that's why `deploy.sh` builds
  locally and ships static files. If you must build on the box, add swap first.
