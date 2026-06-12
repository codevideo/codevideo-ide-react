#!/usr/bin/env bash
# Embed the LOCAL (unpublished) build of codevideo-ide-react into the sibling
# CLI's static site, so `render.sh candidate` renders exactly what the next
# npm publish will ship - no publish (and no alpha version) required.
#
# !! Render the GOLDEN first (./render.sh golden) - this script OVERWRITES the
# !! CLI's embedded site, and the pre-change golden can't be regenerated after.
# The user's normal fullbuild.sh restores the published-version flow later.
#
# Steps: build lib -> overlay dist into example/node_modules -> gatsby build
# (Node 20/22 only - lmdb breaks on 23+) -> copy example/public into the CLI
# -> go build (go:embed picks up the new site).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$SCRIPT_DIR/../.."
CLI_DIR="${CODEVIDEO_CLI_DIR:-$REPO/../codevideo-cli}"

case "$(node -v)" in
  v20.*|v22.*) ;;
  *) echo "example/ needs Node 20 or 22 (lmdb breaks on 23+). Try: nvm use 22" >&2; exit 1 ;;
esac

echo "==> building library"
(cd "$REPO" && npm run build)

if [ ! -d "$REPO/example/node_modules" ]; then
  echo "==> installing example dependencies"
  (cd "$REPO/example" && npm install --legacy-peer-deps)
fi

echo "==> overlaying local dist into example/node_modules"
rsync -a --delete "$REPO/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/dist/"

echo "==> building example site (gatsby)"
(cd "$REPO/example" && npx gatsby clean && npx gatsby build)

echo "==> embedding into CLI static server"
rsync -a --delete "$REPO/example/public/" "$CLI_DIR/cli/staticserver/public/"

echo "==> rebuilding CLI (go:embed)"
(cd "$CLI_DIR" && go build -o codevideo)

echo "==> done - 'render.sh candidate' now renders the local build"
