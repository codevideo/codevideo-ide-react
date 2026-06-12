#!/usr/bin/env bash
# Compare out/golden.mp4 and out/candidate.mp4:
#  - prints both durations and the delta (ffprobe)
#  - extracts one frame per 5 seconds from each into a 4x4 contact sheet
#  - stacks both sheets into out/diff-sheet.png (golden on top)
#
# The judge is your eyeball: open out/diff-sheet.png and watch both videos
# side by side for anything the sheet flags.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$SCRIPT_DIR/out"

for f in golden candidate; do
  [ -f "$OUT/$f.mp4" ] || { echo "missing $OUT/$f.mp4 - run ./render.sh $f first" >&2; exit 1; }
done

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

G=$(dur "$OUT/golden.mp4")
C=$(dur "$OUT/candidate.mp4")
echo "golden:    ${G}s"
echo "candidate: ${C}s"
echo "delta:     $(python3 -c "print(f'{abs($C - $G):.2f}')")s"

# one frame per 2s at 60fps => every 120th frame, 4x4 tile, 480px wide each
# (fills the grid for the ~30s fixture; bump the modulus for longer fixtures)
for f in golden candidate; do
  ffmpeg -y -v error -i "$OUT/$f.mp4" \
    -vf "select='not(mod(n,120))',scale=480:-1,tile=4x4" \
    -frames:v 1 "$OUT/$f-sheet.png"
  echo "wrote $OUT/$f-sheet.png"
done

ffmpeg -y -v error -i "$OUT/golden-sheet.png" -i "$OUT/candidate-sheet.png" \
  -filter_complex vstack "$OUT/diff-sheet.png"
echo "wrote $OUT/diff-sheet.png (golden on top, candidate below)"
