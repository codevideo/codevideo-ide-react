#!/usr/bin/env bash
# One-command golden benchmark: legacy realtime vs deterministic rendering of
# fixture.json. Every deterministic source frame and the full trace must match
# the uninterrupted run (and the reference run, if one is given).
#
# Usage: ./bench.sh [quick|full] [output-dir]
#   quick (default)  legacy + atomic checkpoints (ab-initio) at 1/2/4/8 workers,
#                    compat typing, one repeat: 5 renders, about 3 minutes
#   full             compat and humanized typing; legacy, sequential-seek and
#                    ab-initio at 1/2/4/8 workers; 3 rotated repeats: 54 renders
#
# Renders whatever site the CLI currently embeds - run ./embed-local.sh first to
# measure local changes. The CLI is rebuilt unless CODEVIDEO_CLI_BINARY is set.
# Any CODEVIDEO_BENCHMARK_* variable overrides the preset, for example
#   CODEVIDEO_BENCHMARK_REFERENCE=out/<known-good-run> ./bench.sh
# fails unless every frame and the trace match that earlier run.
set -euo pipefail

PRESET="${1:-quick}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="${CODEVIDEO_CLI_DIR:-$SCRIPT_DIR/../../../codevideo-cli}"

case "$PRESET" in
  quick)
    : "${CODEVIDEO_BENCHMARK_PROFILES:=compat}"
    : "${CODEVIDEO_BENCHMARK_STRATEGIES:=ab-initio}"
    : "${CODEVIDEO_BENCHMARK_REPEATS:=1}" ;;
  full)
    : "${CODEVIDEO_BENCHMARK_PROFILES:=compat,humanized}"
    : "${CODEVIDEO_BENCHMARK_STRATEGIES:=sequential-seek,ab-initio}"
    : "${CODEVIDEO_BENCHMARK_REPEATS:=3}" ;;
  *) echo "usage: ./bench.sh [quick|full] [output-dir]" >&2; exit 1 ;;
esac
: "${CODEVIDEO_BENCHMARK_WORKERS:=1,2,4,8}"
: "${CODEVIDEO_BENCHMARK_FIXTURES:=fixture.json}"
export CODEVIDEO_BENCHMARK_PROFILES CODEVIDEO_BENCHMARK_STRATEGIES CODEVIDEO_BENCHMARK_REPEATS \
  CODEVIDEO_BENCHMARK_WORKERS CODEVIDEO_BENCHMARK_FIXTURES

if [ -z "${CODEVIDEO_CLI_BINARY:-}" ]; then
  echo "==> building codevideo CLI (embeds the current cli/staticserver/public site)"
  (cd "$CLI_DIR" && go build -o codevideo)
  export CODEVIDEO_CLI_BINARY="$CLI_DIR/codevideo"
fi

OUT="${2:-$SCRIPT_DIR/out/bench-$PRESET-$(date +%Y%m%d-%H%M%S)}"
node "$SCRIPT_DIR/benchmark.mjs" "$OUT"
echo "==> to require later runs to match this one: CODEVIDEO_BENCHMARK_REFERENCE=$OUT ./bench.sh"
