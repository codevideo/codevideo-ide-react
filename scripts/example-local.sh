#!/usr/bin/env bash
# Run the example Gatsby app against the LOCAL (unpublished) library build.
#
# The example normally installs the published npm package; this script builds
# the library and overlays its dist into example/node_modules so local source
# changes are visible. Usage: npm run example:local
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$SCRIPT_DIR/.."

case "$(node -v)" in
  v20.*|v22.*) ;;
  *)
    echo "The example app needs Node 20 or 22 - Gatsby's lmdb dependency crashes on Node 23+." >&2
    echo "Try: nvm use   (an .nvmrc pinning 22 is in the repo root)" >&2
    exit 1
    ;;
esac

echo "==> building library"
(cd "$REPO" && npm run build)

if [ ! -d "$REPO/example/node_modules" ]; then
  echo "==> installing example dependencies (first run)"
  (cd "$REPO/example" && npm install --legacy-peer-deps)
fi

echo "==> overlaying local dist into example/node_modules"
rsync -a --delete "$REPO/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/dist/"

echo "==> starting gatsby dev server (http://localhost:8000)"
(cd "$REPO/example" && npx gatsby develop)
