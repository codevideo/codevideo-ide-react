#!/usr/bin/env bash
# Render a fixture to out/<name>.mp4 using the sibling codevideo-cli.
#
# Usage: ./render.sh <name> [fixture-file]
#   ./render.sh golden                      # default fixture.json (speak-free)
#   ./render.sh candidate                   # default fixture.json (speak-free)
#   ./render.sh full fixture-full.json      # comprehensive fixture (needs keys)
#
# Renders with WHATEVER example site is currently embedded in the CLI
# (cli/staticserver/public). Ordering is the caller's responsibility:
# the golden must be rendered BEFORE embed-local.sh refreshes the embedded
# site to the local build. See README.md in this directory.
#
# The default fixture.json is speak-free and needs no credentials. A fixture
# containing author-speak actions (e.g. fixture-full.json) requires
# ELEVEN_LABS_API_KEY (+ ELEVEN_LABS_VOICE_ID) and S3 credentials, because the
# CLI generates and uploads TTS audio for those actions.
set -euo pipefail

NAME="${1:?usage: ./render.sh <name> [fixture-file]}"
FIXTURE_FILE="${2:-fixture.json}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="${CODEVIDEO_CLI_DIR:-$SCRIPT_DIR/../../../codevideo-cli}"
FIXTURE_PATH="$SCRIPT_DIR/$FIXTURE_FILE"

if [ ! -d "$CLI_DIR" ]; then
  echo "codevideo-cli not found at $CLI_DIR (override with CODEVIDEO_CLI_DIR)" >&2
  exit 1
fi
if [ ! -f "$FIXTURE_PATH" ]; then
  echo "fixture not found: $FIXTURE_PATH" >&2
  exit 1
fi

# warn early if the fixture needs TTS keys but they are not set
if grep -q "author-speak" "$FIXTURE_PATH" && [ -z "${ELEVEN_LABS_API_KEY:-}" ]; then
  echo "WARNING: $FIXTURE_FILE contains author-speak actions but ELEVEN_LABS_API_KEY is unset." >&2
  echo "         The render will fail when it tries to generate TTS audio." >&2
fi

mkdir -p "$SCRIPT_DIR/out"

echo "==> building codevideo CLI"
(cd "$CLI_DIR" && go build -o codevideo)

echo "==> rendering $NAME.mp4 from $FIXTURE_FILE (records in real time - expect a few minutes)"
(cd "$CLI_DIR" && ./codevideo --verbose \
  -p "$(cat "$FIXTURE_PATH")" \
  -o "$SCRIPT_DIR/out/$NAME.mp4")

echo "==> done:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "$SCRIPT_DIR/out/$NAME.mp4"
