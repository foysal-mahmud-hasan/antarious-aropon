#!/usr/bin/env bash
# Build off-droplet (the web export is RAM-heavy) and ship artifacts to the droplet.
# Usage: scripts/deploy.sh user@droplet-host
set -euo pipefail

HOST="${1:?usage: scripts/deploy.sh user@host}"
APP_DIR=/opt/aropon
WEB_DIR=/var/www/aropon
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ building API bundle"
pnpm --filter @aropon/api-server build

echo "→ building web (same-origin API)"
( cd "$ROOT/apps/mobile" && EXPO_PUBLIC_API_URL="" pnpm exec expo export --platform web --output-dir web-build )

echo "→ shipping to $HOST"
ssh "$HOST" "sudo mkdir -p $APP_DIR/migrations $WEB_DIR && sudo chown -R \$USER $APP_DIR $WEB_DIR"
rsync -az "$ROOT/services/api/dist/server.mjs" "$HOST:$APP_DIR/server.mjs"
rsync -az --delete "$ROOT/services/api/dist/migrations/" "$HOST:$APP_DIR/migrations/"
rsync -az --delete "$ROOT/apps/mobile/web-build/" "$HOST:$WEB_DIR/"

echo "→ restarting api"
ssh "$HOST" "sudo systemctl restart aropon-api && sleep 1 && curl -fsS http://127.0.0.1:8787/health && echo ' ok'"
echo "✅ deployed"
