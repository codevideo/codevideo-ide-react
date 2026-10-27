# Action-boundary checkpoint benchmark — 19 October 2026

Measured locally on Apple M3 Max, 16 logical CPUs, 64 GiB RAM. Three runs per configuration; medians below include CLI startup, planning, browser startup, capture, encoding and final output. Every requested worker count was actually used.

| Renderer | Workers | Median wall time | Speedup vs legacy | All measured wall times (s) |
|---|---:|---:|---:|---|
| Legacy realtime | 1 | 40.70 s | 1.00× | 42.56, 40.65, 40.70 |
| Action-boundary checkpoints | 1 | 33.45 s | 1.22× | 32.84, 33.45, 33.94 |
| Action-boundary checkpoints | 2 | 27.68 s | 1.47× | 29.51, 27.68, 27.31 |
| Action-boundary checkpoints | 4 | 26.01 s | 1.56× | 25.69, 26.43, 26.01 |
| Action-boundary checkpoints | 8 | 31.36 s | 1.30× | 29.50, 34.97, 31.36 |

Four workers were fastest, taking 36.1% less time than legacy. Eight workers add browser startup cost without splitting the longest action: the golden fixture has one 15.04-second typing action, occupying a 903-frame segment at both four and eight workers.

| Workers | Planning | Capture including bootstrap/encoding | Slowest worker bootstrap | Slowest worker restore |
|---|---:|---:|---:|---:|
| 1 | 5.56 s | 27.21 s | 3.55 s | 7 ms |
| 2 | 5.66 s | 21.32 s | 4.34 s | 26 ms |
| 4 | 5.57 s | 19.56 s | 6.29 s | 33 ms |
| 8 | 5.34 s | 25.28 s | 11.68 s | 37 ms |

These phase columns are independent medians and need not sum exactly to median wall time. Bootstrap and restore are included in capture; do not add them again.

## Validation and scope

All 12 deterministic runs have identical planning traces and identical SHA-256 hashes for every source JPEG frame. Each output contains exactly 1,719 frames at 1920×1080 and 60 fps (28.65 seconds), with no missing or duplicated frame indices. Each configuration evaluates 1,719 capture frames in total across workers plus 1,719 planning frames: 3,438 evaluated frames overall. No fallback occurred.

The one-worker checkpoint run provides the uninterrupted baseline; the separate golden browser integration also passed comparison against sequential-seek at every eligible boundary (14 segments). The broader restoration fixture still has a rename-input glyph pixel mismatch; that validation remains unresolved, so this is not a release-readiness claim.

All renders use the same golden fixture and seed, with no narration, at 1080p/60 fps. Legacy uses realtime WebM capture followed by MP4 transcoding; deterministic rendering uses JPEG quality 92 and H.264 CRF 18. This compares end-to-end throughput of the two pipelines, not equivalent codec quality. Historical sequential-seek timings used an earlier renderer build and are not a controlled comparison with these results. Sequential-seek and the balanced-action fixture were not measured in this matrix.

## Reproduction and artifacts

Run from codevideo-ide-react after building the local embedded CLI:

```bash
CODEVIDEO_CLI_BINARY=/tmp/codevideo-checkpoints \
CODEVIDEO_BENCHMARK_WORKERS=1,2,4,8 \
CODEVIDEO_BENCHMARK_STRATEGIES=ab-initio \
CODEVIDEO_BENCHMARK_FIXTURES=fixture.json \
CODEVIDEO_BENCHMARK_REPEATS=3 \
node scripts/golden/benchmark.mjs scripts/golden/out/checkpoints-NEW-RUN
```

[Full measurements](out/checkpoints-2026-10-19/benchmark.json), [phase report](out/checkpoints-2026-10-19/README.md), and [binary/runtime fingerprints](out/checkpoints-2026-10-19/provenance.json). Videos, logs, frame hashes and traces are alongside these files. The out directory is gitignored; retain it locally for verification.
