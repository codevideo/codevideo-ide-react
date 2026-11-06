#!/usr/bin/env bash
# Run the example Next.js app against the LOCAL (unpublished) library build.
#
# The example normally installs the published npm package; this script builds
# the library and overlays its dist into example/node_modules so local source
# changes are visible. Usage: npm run example:local
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$SCRIPT_DIR/.."

echo "==> building library"
(cd "$REPO" && npm run build)

if [ ! -d "$REPO/example/node_modules" ]; then
  echo "==> installing example dependencies (first run)"
  (cd "$REPO/example" && npm install --legacy-peer-deps)
fi

echo "==> overlaying local dist into example/node_modules"
rsync -a --delete "$REPO/dist/" "$REPO/example/node_modules/@fullstackcraftllc/codevideo-ide-react/dist/"

echo "==> starting next dev server (http://localhost:8000)"
(cd "$REPO/example" && npm run clean && npm run dev)
