#!/usr/bin/env bash
# Render the golden fixture to out/<name>.mp4 using the sibling codevideo-cli.
#
# Usage: ./render.sh golden|candidate
#
# Renders with WHATEVER example site is currently embedded in the CLI
# (cli/staticserver/public). Ordering is the caller's responsibility:
# the golden must be rendered BEFORE embed-local.sh refreshes the embedded
# site to the local build. See README.md in this directory.
#
# No ELEVEN_LABS_API_KEY or S3 credentials needed: the fixture contains no
# author-speak actions, and the CLI only calls ElevenLabs/S3 for those.
set -euo pipefail

NAME="${1:?usage: ./render.sh golden|candidate}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="${CODEVIDEO_CLI_DIR:-$SCRIPT_DIR/../../../codevideo-cli}"

if [ ! -d "$CLI_DIR" ]; then
  echo "codevideo-cli not found at $CLI_DIR (override with CODEVIDEO_CLI_DIR)" >&2
  exit 1
fi

mkdir -p "$SCRIPT_DIR/out"

echo "==> building codevideo CLI"
(cd "$CLI_DIR" && go build -o codevideo)

echo "==> rendering $NAME.mp4 (this records in real time - expect a few minutes)"
(cd "$CLI_DIR" && ./codevideo --verbose \
  -p "$(cat "$SCRIPT_DIR/fixture.json")" \
  -o "$SCRIPT_DIR/out/$NAME.mp4")

echo "==> done:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "$SCRIPT_DIR/out/$NAME.mp4"
