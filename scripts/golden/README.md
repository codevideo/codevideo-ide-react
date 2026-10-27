# Golden render — visual/timing regression check

## Experimental deterministic / parallel benchmark

Measured results: [atomic (mid-action) checkpoints vs legacy, 1/2/4/8 workers,
20 October 2026](atomic-benchmark-2026-10-20.md), [how the speedup scales on a
5-minute video](scaling-benchmark-2026-10-20.md), and the earlier
[action-boundary checkpoints, 19 October 2026](checkpoint-benchmark-2026-10-19.md).

The local embed builds the sibling `codevideo-types` and `codevideo-virtual-keyboard`
first and overlays the unpublished packages. With dependencies installed and
Node 20/22 active:

```bash
./embed-local.sh       # only after changing React/types/keyboard code
./bench.sh             # quick: legacy vs ab-initio at 1/2/4/8 workers, ~3 min
./bench.sh full        # the release matrix: 54 renders, both typing profiles
```

`bench.sh` rebuilds the CLI around the currently embedded site (unless
`CODEVIDEO_CLI_BINARY` is set), runs `benchmark.mjs` and prints the median table
with speedup and time saved against the same profile's legacy realtime render.
`quick` renders once per configuration; `full` measures legacy, sequential-seek
and checkpoint (`ab-initio`) rendering at 1, 2, 4 and 8 workers, three times
each in rotated order, for two profiles:

- `compat`: no typing options. The golden fixture must stay at 1,719 frames.
- `humanized`: `includeTypos: true`, `keyboardTypingJitterMs: 8`, 40 ms base delay,
  passed through `--config`. Its timeline is longer, so its frame count differs.

To check a change against a known-good build, point the benchmark at that
build's output directory. Each profile's deterministic frames and trace must
then match it exactly, in addition to the in-run checks:

```bash
CODEVIDEO_BENCHMARK_REFERENCE=out/<known-good-run> ./bench.sh
```

Every `CODEVIDEO_BENCHMARK_*` variable (`WORKERS`, `STRATEGIES`, `PROFILES`,
`FIXTURES`, `REPEATS`, `REFERENCE`) overrides the preset; `node benchmark.mjs`
alone defaults to the compat profile, both strategies and three repeats.
`CODEVIDEO_BENCHMARK_ALLOW_PIXEL_DIFFS=1` records differing source frames in the
report instead of failing, for timing a known pixel bug; traces stay strict.

Every deterministic run verifies all source JPEG hashes, the full planning trace,
and the encoded frame count at 60 fps. Checkpoint workers also verify their event
slice and evaluate exactly the output frame count in total. Logs, videos, metrics,
`README.md` medians and `benchmark.json` (including binary and runner hashes)
remain in a new `out/` folder. No TTS service, credentials, Slack or publication
is needed. `CODEVIDEO_BUILD_OUTPUT` controls the embed script's output.

Sequential-seek workers replay from zero. Checkpoint workers restore a saved
execution cursor (an action boundary, or a point inside typing and waits about
every 500 ms) and stop at their assigned endpoint. Planning and per-worker
browser startup limit scaling; compare end-to-end wall time. Legacy and
deterministic pipelines use different capture/compression formats.

The CLI's opt-in `puppeteer-runner/checkpoints.integration.test.js` resumes at
every eligible boundary and compares every source frame. `fixture-checkpoints.json`
adds initial models, multiple tabs, scrolling, menus, rename inputs and slide
continuation; `fixture-full.json` uses synthetic speech durations in this test,
so the browser validation does not call TTS.

See the sibling CLI's `docs/deterministic-rendering.md` for implementation details,
limitations and the types → React → Gatsby → CLI release order. Local overlays
are deliberately unpublished; update the normal dependency lockfiles once the
upstream releases exist. Always clean Gatsby before rebuilding overlaid packages.

The jest suite can't see Monaco timing, mouse animation, or caret behavior in
a real browser. This workflow can: render a fixed, deterministic fixture to
video with the sibling [codevideo-cli](https://github.com/codevideo/codevideo-cli),
once with the known-good build ("golden") and once with the changed build
("candidate"), then compare.

There are three main fixtures:

- **`fixture.json`** — minimal, speak-free, ~30s. Needs **no API keys** (the
  CLI only calls ElevenLabs/S3 for author-speak actions, and this has none).
  This is the one used for the 0.0.179-vs-refactor regression comparison.
- **`fixture-5min.json`** — speak-free, 4:57: builds a small TypeScript task
  tracker (five files, terminal commands with output, scrolling, slides). Use
  it to measure how renderer speedups scale with video length:
  `CODEVIDEO_BENCHMARK_FIXTURES=fixture-5min.json ./bench.sh`.
- **`fixture-full.json`** — comprehensive, ~34 actions: narration, mouse moves
  between panels, right-click context menus, folder + nested-file creation,
  editor typing + save, and terminal commands with output, all from an empty
  workspace. It **contains author-speak actions**, so rendering it needs
  `ELEVEN_LABS_API_KEY`, `ELEVEN_LABS_VOICE_ID`, and S3 credentials. Use it as
  a thorough manual smoke test of the full interaction set.

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

### Comprehensive render (full interaction set)

To exercise narration, right-click context menus, folder/file creation, and
terminal commands in one render, use the full fixture (keys required):

```bash
export ELEVEN_LABS_API_KEY=... ELEVEN_LABS_VOICE_ID=...
export CODEVIDEO_S3_KEY_ID=... CODEVIDEO_S3_SECRET=...
./render.sh full fixture-full.json
open out/full.mp4
```

There is no pre-refactor baseline for this fixture (the 0.0.179 embedded site
is gone), so it is a forward-looking smoke test rather than a diff. After a
clean render against the current build, check in its contact sheet as the
baseline for future regressions:

```bash
ffmpeg -i out/full.mp4 -vf "select='not(mod(n,120))',scale=480:-1,tile=4x4" \
  -frames:v 1 full-sheet-v4.png
```

## Artifacts

`out/` is gitignored (mp4s are large and regenerable — except the golden of a
version whose embedded site is gone, so **archive `out/golden.mp4` somewhere
durable** after rendering it). The golden's contact sheet IS checked in as the
durable visual reference, named for the version it was rendered from, e.g.
`golden-sheet-0.0.179.png`.
