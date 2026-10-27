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
TYPES_DIR="${CODEVIDEO_TYPES_DIR:-$REPO/../codevideo-types}"

case "$(node -v)" in
  v20.*|v22.*) ;;
  *) echo "example/ needs Node 20 or 22 (lmdb breaks on 23+). Try: nvm use 22" >&2; exit 1 ;;
esac

echo "==> building and overlaying local shared types"
(cd "$TYPES_DIR" && npm run build)
rsync -a --delete "$TYPES_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-types/dist/"

KEYBOARD_DIR="$REPO/../codevideo-virtual-keyboard"
(cd "$KEYBOARD_DIR" && npm run build)
mkdir -p "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard"
rsync -a --delete "$KEYBOARD_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/dist/"
cp "$KEYBOARD_DIR/package.json" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/package.json"

echo "==> building library"
(cd "$REPO" && npm run build)

if [ ! -d "$REPO/example/node_modules" ]; then
  echo "==> installing example dependencies"
  (cd "$REPO/example" && npm install --legacy-peer-deps)
fi

echo "==> overlaying local dist into example/node_modules"
rsync -a --delete "$TYPES_DIR/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-types/dist/"
rsync -a --delete "$REPO/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/dist/"

# The overlaid React build requires the already-published VirtualIDE version
# installed by this repo. The example's older React lock can retain 1.0.42,
# whose lesson constructor is incompatible with current shared type guards.
rsync -a --delete "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-ide/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-ide/"
cp "$TYPES_DIR/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-types/package.json"
cp "$REPO/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/package.json"

mkdir -p "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard"
rsync -a --delete "$KEYBOARD_DIR/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/dist/"
cp "$KEYBOARD_DIR/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/package.json"

echo "==> building example site (gatsby)"
(cd "$REPO/example" && npx gatsby clean && npx gatsby build)

echo "==> embedding into CLI static server"
rsync -a --delete "$REPO/example/public/" "$CLI_DIR/cli/staticserver/public/"

echo "==> rebuilding CLI (go:embed)"
(cd "$CLI_DIR" && go build -o "${CODEVIDEO_BUILD_OUTPUT:-codevideo}")

echo "==> done - 'render.sh candidate' now renders the local build"
