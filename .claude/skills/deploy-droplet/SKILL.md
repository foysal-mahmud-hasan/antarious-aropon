---
name: deploy-droplet
description: Deploy or update the Aropon app on a resource-limited droplet / Ubuntu VPS WITHOUT Docker — PostgreSQL + a bundled Node API (systemd) + nginx serving the prebuilt web. Use when the user says "deploy", "go live", "ship it to the droplet", "update the server", or similar.
---

# Deploy Aropon to a droplet (no Docker)

Aropon runs Docker-free for low-resource droplets:
- **PostgreSQL** (apt) holds the data.
- **API** = one self-contained bundle `server.mjs` (esbuild, ~750 KB, needs only Node — no
  node_modules) run by **systemd** on `127.0.0.1:8787`. It auto-applies migrations + demo seed on start.
- **nginx** serves the prebuilt web (`/var/www/aropon`) and proxies `/trpc` + `/health` to the API.
- The **web build runs off-droplet** (Expo export is RAM-heavy); `scripts/deploy.sh` builds locally
  and rsyncs static files + the API bundle, then restarts the service.

Key files: `scripts/deploy.sh`, `infra/aropon-api.service`, `infra/nginx.conf.example`,
`infra/api.env.example`, `DEPLOY.md`. Build commands: `pnpm --filter @aropon/api-server build`
(→ `services/api/dist/server.mjs` + `dist/migrations/`), and the web export in `apps/mobile`.

## Inputs to gather (ask only if unknown)
- **Droplet**: `user@host` you can SSH to (with sudo).
- **Domain** (optional): for HTTPS, a domain whose A-record points at the droplet (ports 80/443 open).
- **Secrets**: Postgres password + `AUTH_JWT_SECRET` (generate with `openssl rand -hex 32` if not given).
- **Repo**: this working tree (deploy.sh ships from local build) — no git remote needed on the droplet.

## First-time setup (run on the droplet, once)
Follow `DEPLOY.md` §1 — in short:
1. `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs postgresql nginx`
2. Create the DB + user: `CREATE USER aropon WITH PASSWORD '…'; CREATE DATABASE aropon OWNER aropon;`
3. `sudo useradd -r -s /usr/sbin/nologin aropon; sudo mkdir -p /opt/aropon/migrations /var/www/aropon; sudo chown -R aropon /opt/aropon`
4. Env: `sudo cp infra/api.env.example /opt/aropon/api.env`, edit DB password + `AUTH_JWT_SECRET`, `chmod 600`.
5. systemd: `sudo cp infra/aropon-api.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable aropon-api`
6. nginx: copy `infra/nginx.conf.example` → `/etc/nginx/sites-available/aropon`, symlink into
   sites-enabled, remove the default site, `sudo nginx -t && sudo systemctl reload nginx`.

## Deploy / update (from the dev machine)
```bash
scripts/deploy.sh user@droplet-ip
```
This builds the API bundle + web export locally, rsyncs `server.mjs` + `migrations/` to
`/opt/aropon` and the web to `/var/www/aropon`, then `systemctl restart aropon-api`. The API
migrates + seeds on start. Verify: open the URL; `curl http://<ip>/health` → `{"ok":true}`.

Report back the URL + demo logins: `+8801700000000` (T0), `+8801700000001` (T1); OTP shows on
screen in test mode; tier is switchable in Settings.

## HTTPS
Set `server_name` to the domain in the nginx site, then
`sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d <domain>`.

## Operate / troubleshoot
- Logs: `sudo journalctl -u aropon-api -f`. Restart: `sudo systemctl restart aropon-api`.
- **API won't start**: check `api.env` `DATABASE_URL` (host `127.0.0.1:5432`, the password matches
  the Postgres user); check `journalctl`. Migrations need `/opt/aropon/migrations` present (the
  service sets `MIGRATIONS_DIR`).
- **Blank/404 web**: confirm `/var/www/aropon/index.html` exists and nginx `try_files … /index.html`;
  `sudo nginx -t`.
- **/trpc 502**: API not running on 8787 — `systemctl status aropon-api`.
- **Low RAM on web build**: build on the dev machine (default) — don't run the Expo export on a tiny droplet.

## Guardrails
- Never commit a real `api.env`; generate secrets, don't reuse examples.
- This is the **test build** (`NODE_ENV=development` → dev OTP, tester tier-toggle enabled). Going
  production = wire Supabase Auth + SMS, set `NODE_ENV=production`, disable `billing.setTier`.
- Confirm before destructive DB actions; migrations are forward-only.
