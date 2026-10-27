# Scaling benchmark: 5-minute fixture — 20 October 2026

Does the deterministic renderer's advantage grow with video length? Measured on
Apple M3 Max, 16 logical CPUs, 64 GiB RAM, Node v23.11.0, with the binary from the
[atomic checkpoint report](atomic-benchmark-2026-10-20.md) (`/tmp/codevideo-atomic-fix`).

`fixture-5min.json` builds a small TypeScript task tracker from an empty folder:
87 actions, five files (4,541 typed characters), terminal commands with output,
scrolling and two slides, no narration and no web previews. Its deterministic
timeline is 17,837 frames (4:57.28); the legacy video runs 5:10. One run per
configuration, legacy first, then workers in descending order (8, 4, 2, 1).

| Renderer | Workers | 5-minute video | vs legacy | Time saved | Golden test (0:29) | vs legacy | Predicted for 5 min |
|---|---:|---:|---:|---:|---:|---:|---:|
| Legacy realtime | 1 | 337.6 s (5:38) | 1.00× | — | 40.8 s | 1.00× | ~5.5 min |
| Checkpoints (ab-initio) | 1 | 283.2 s (4:43) | 1.19× | 16% | 34.6 s | 1.18× | ~4.7 min |
| Checkpoints (ab-initio) | 2 | 170.4 s (2:50) | 1.98× | 50% | 23.8 s | 1.71× | ~2.8 min |
| Checkpoints (ab-initio) | 4 | 109.2 s (1:49) | 3.09× | 68% | 19.3 s | 2.11× | ~1.8 min |
| Checkpoints (ab-initio) | 8 | **92.2 s (1:32)** | **3.66×** | **73%** | 22.7 s | 1.80× | ~1.6 min |
| Sequential seek | 1 | 286.1 s (4:46) | 1.18× | 15% | 35.3 s | 1.16× | — |
| Sequential seek | 2 | 182.5 s (3:03) | 1.85× | 46% | 28.0 s | 1.46× | — |
| Sequential seek | 4 | 135.8 s (2:16) | 2.49× | 60% | 21.6 s | 1.90× | — |
| Sequential seek | 8 | 151.1 s (2:31) | 2.23× | 55% | 27.2 s | 1.50× | — |

Golden checkpoint times are three-run medians; golden sequential-seek times are
single runs from the same day. Predictions were made from the golden fixture
before this run: within 4 s for every checkpoint render, 8 s short for legacy.

## Verdict: linear, not compounding

Every configuration grows linearly with video length. The speedup still improves,
because fixed costs (CLI and browser startup, 5–15 s) stop mattering once there
are 18,000 frames to render. Marginal cost per extra second of video, from the two
fixtures:

| | Legacy | Checkpoints, 1 / 2 / 4 / 8 workers | Sequential seek, 1 / 2 / 4 / 8 workers |
|---|---:|---|---|
| Wall seconds per video second | 1.10 | 0.93 / 0.55 / 0.33 / 0.26 | 0.93 / 0.58 / 0.43 / 0.46 |
| Implied ceiling vs legacy for very long videos | 1.00× | 1.2× / 2.0× / 3.3× / 4.3× | 1.2× / 1.9× / 2.6× / 2.4× |

- Eight workers now beat four (92 s vs 109 s). Their 13 s startup is amortized.
- Planning grew to about 25 s. Checkpoint planning (620 resume points) took
  23.6–26.9 s against 23.1–26.1 s for sequential seek's planning without
  checkpoints, so snapshot cost is not a concern at this length.
- Sequential seek falls further behind as videos grow: every worker replays the
  whole video (142,696 evaluated frames at 8 workers vs 17,837). At 8 workers it
  is 64% slower than checkpoints, and its best is 4 workers.
- The legacy video comes out 4% longer than the deterministic timeline (5:10 vs
  4:57; 0:29.9 vs 0:28.7 for the golden test).

## Validation: one cross-strategy pixel difference

All eight deterministic renders have identical traces and frame counts. All four
checkpoint renders (1, 2, 4 and 8 workers) are frame-for-frame identical to each
other, so resuming mid-action is exact even with 620 resume points and seven
mid-action cuts. All four sequential-seek renders are identical to each other.

The two strategies differ in 97 of 17,837 frames: four bursts of 24–25 frames
(0.4 s). Each starts when a newly created file is opened while the mouse cursor
rests over the file explorer, and ends when the cursor jumps to the editor. In
the exact source frame 13080, 123 pixels differ in a 16×16 area at the cursor, by
at most 13 of 255 levels. Nobody can see it, but it breaks the identical-frames
guarantee. The golden fixture never parks the cursor over the explorer during a
new-file open, which is why it never showed up there.

Cursor positions are identical (the traces include every mouse path), so the
browser rasterizes the same cursor slightly differently. The likely trigger,
not yet verified: checkpoint-mode workers run a boundary handshake about every
500 ms, which calls `document.getAnimations()` (forcing a style recalculation)
and subdivides waits, while sequential-seek workers never do.

Separately, `MouseOverlay` skips the animation when the new target equals the
start of the previous move, so moving the cursor back to where it came from
teleports it, in realtime too. That jump is where each burst ends.

The first strict run (`out/scaling-5min-2026-10-20`) stopped at this difference.
These measurements come from a rerun with `CODEVIDEO_BENCHMARK_ALLOW_PIXEL_DIFFS=1`,
which records differing frames instead of failing. Traces stay strict. The
default remains strict.

## Reproduction and artifacts

```bash
CODEVIDEO_BENCHMARK_ALLOW_PIXEL_DIFFS=1 CODEVIDEO_CLI_BINARY=/tmp/codevideo-atomic-fix \
CODEVIDEO_BENCHMARK_FIXTURES=fixture-5min.json \
CODEVIDEO_BENCHMARK_STRATEGIES=sequential-seek,ab-initio \
CODEVIDEO_BENCHMARK_WORKERS=8,4,2,1 ./bench.sh quick out/<new-dir>
```

[Measurements](out/scaling-5min-2026-10-20b/benchmark.json) and
[phase report](out/scaling-5min-2026-10-20b/README.md). Exact sample frames from
both strategies, including 13080, are in `out/diag-5min-sequential-seek/samples`
and `out/diag-5min-ab-initio/samples`. The out directory is gitignored.
