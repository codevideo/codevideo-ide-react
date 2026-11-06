#!/usr/bin/env bash
# Embed the LOCAL (unpublished) build of codevideo-ide-react into the sibling
# CLI's static site, so `render.sh candidate` renders exactly what the next
# npm publish will ship - no publish (and no alpha version) required.
#
# !! Render the GOLDEN first (./render.sh golden) - this script OVERWRITES the
# !! CLI's embedded site, and the pre-change golden can't be regenerated after.
# The user's normal fullbuild.sh restores the published-version flow later.
#
# Steps: build lib -> overlay dist into example/node_modules -> next build
# -> copy example/out into the CLI -> go build (go:embed picks up the new site).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$SCRIPT_DIR/../.."
CLI_DIR="${CODEVIDEO_CLI_DIR:-$REPO/../codevideo-cli}"
TYPES_DIR="${CODEVIDEO_TYPES_DIR:-$REPO/../codevideo-types}"

echo "==> building and overlaying local shared types"
(cd "$TYPES_DIR" && npm run build)
rsync -a --delete "$TYPES_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-types/dist/"

KEYBOARD_DIR="$REPO/../codevideo-virtual-keyboard"
(cd "$KEYBOARD_DIR" && npm run build)
mkdir -p "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard"
rsync -a --delete "$KEYBOARD_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/dist/"
cp "$KEYBOARD_DIR/package.json" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/package.json"

echo "==> building and overlaying local virtual editor and IDE"
EDITOR_DIR="$REPO/../codevideo-virtual-editor"
IDE_DIR="$REPO/../codevideo-virtual-ide"
for target in "$EDITOR_DIR" "$IDE_DIR"; do
  rsync -a --delete "$TYPES_DIR/dist/" "$target/node_modules/@fullstackcraftllc/codevideo-types/dist/"
done
(cd "$EDITOR_DIR" && npm run build)
rsync -a --delete "$EDITOR_DIR/dist/" "$IDE_DIR/node_modules/@fullstackcraftllc/codevideo-virtual-editor/dist/"
(cd "$IDE_DIR" && npm run build)
rsync -a --delete "$IDE_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-ide/dist/"
rsync -a --delete "$EDITOR_DIR/dist/" "$REPO/node_modules/@fullstackcraftllc/codevideo-virtual-editor/dist/"

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
rsync -a --delete "$EDITOR_DIR/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-editor/dist/"
cp "$TYPES_DIR/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-types/package.json"
cp "$REPO/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/package.json"

mkdir -p "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard"
rsync -a --delete "$KEYBOARD_DIR/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/dist/"
cp "$KEYBOARD_DIR/package.json" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-virtual-keyboard/package.json"

# Clean first: Next's on-disk build cache can otherwise keep the overlaid
# packages' previous versions.
echo "==> building example site (next)"
(cd "$REPO/example" && npm run clean && npm run build)

echo "==> embedding into CLI static server"
rsync -a --delete "$REPO/example/out/" "$CLI_DIR/cli/staticserver/public/"

echo "==> rebuilding CLI (go:embed)"
(cd "$CLI_DIR" && go build -o "${CODEVIDEO_BUILD_OUTPUT:-codevideo}")

echo "==> done - 'render.sh candidate' now renders the local build"
