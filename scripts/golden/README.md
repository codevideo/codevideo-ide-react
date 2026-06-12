# Golden render — visual/timing regression check

The jest suite can't see Monaco timing, mouse animation, or caret behavior in
a real browser. This workflow can: render a fixed, deterministic fixture to
video with the sibling [codevideo-cli](https://github.com/codevideo/codevideo-cli),
once with the known-good build ("golden") and once with the changed build
("candidate"), then compare.

No API keys needed: `fixture.json` contains **no author-speak actions**, and
the CLI only calls ElevenLabs/S3 for those.

## Prerequisites

- sibling checkout of `codevideo-cli` (or set `CODEVIDEO_CLI_DIR`), with its
  `puppeteer-runner` installed (`npm install` there) and a Chrome for Testing
  under `puppeteer-runner/chrome/` (see the CLI README)
- `go`, `ffmpeg`/`ffprobe`, Node 20 or 22 for the example build

## Procedure

```bash
# 1. golden: renders with whatever site the CLI currently embeds
#    (the last published version) - ALWAYS do this before step 2!
./render.sh golden

# 2. embed the local, unpublished build into the CLI
#    (overwrites the embedded site - the golden can't be re-made after this)
./embed-local.sh

# 3. candidate: renders the local build
./render.sh candidate

# 4. compare: durations + keyframe contact sheets + stacked diff sheet
./compare.sh
open out/diff-sheet.png

# 5. final judge: watch both side by side
open out/golden.mp4 out/candidate.mp4
```

What to look for: typing cadence, caret position after file switches, mouse
path timing, terminal output pacing, overlay (slide) transitions, total
duration drift beyond ~1s.

## Artifacts

`out/` is gitignored (mp4s are large and regenerable — except the golden of a
version whose embedded site is gone, so **archive `out/golden.mp4` somewhere
durable** after rendering it). The golden's contact sheet IS checked in as the
durable visual reference, named for the version it was rendered from, e.g.
`golden-sheet-0.0.179.png`.
