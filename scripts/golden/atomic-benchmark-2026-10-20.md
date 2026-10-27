# Atomic checkpoint benchmark — 20 October 2026

Measured locally on Apple M3 Max, 16 logical CPUs, 64 GiB RAM, Node v23.11.0, with
the harness, golden fixture, seed and settings of the
[19 October action-boundary report](checkpoint-benchmark-2026-10-19.md). Three runs
per configuration; medians include CLI startup, planning, browser startup, capture,
encoding and final output. Every requested worker count was used.

| Renderer | Workers | Median wall time | Speedup vs legacy | Time saved | All measured wall times (s) | 19 Oct (action boundaries) |
|---|---:|---:|---:|---:|---|---:|
| Legacy realtime | 1 | 40.77 s | 1.00× | — | 41.48, 40.74, 40.77 | 40.70 s |
| Atomic checkpoints | 1 | 34.56 s | 1.18× | 15.2% | 31.75, 35.76, 34.56 | 33.45 s |
| Atomic checkpoints | 2 | 23.81 s | 1.71× | 41.6% | 23.71, 23.81, 24.19 | 27.68 s |
| Atomic checkpoints | 4 | 19.31 s | 2.11× | 52.6% | 18.98, 19.31, 21.48 | 26.01 s |
| Atomic checkpoints | 8 | 22.66 s | 1.80× | 44.4% | 22.66, 21.34, 25.69 | 31.36 s |

Four workers remain fastest: 19.31 s, 52.6% less time than legacy and 25.8% less
than the best action-boundary result (26.01 s, also at four workers). A single
worker cannot use checkpoints; its spread (31.75–35.76 s) covers the 19 October median.

Planning now offers 56 resume points instead of 13, including points inside the
15.04-second `editor-type` action. At four workers the largest segment fell from
903 frames to 450: segments of 450/450/450/369 frames, cut at characters 57 and 245
of the typing action and at character 6 of the terminal command.

| Workers | Planning | Capture incl. bootstrap/encoding | Slowest worker bootstrap | Largest segment (19 → 20 Oct) | Mid-action cuts |
|---|---:|---:|---:|---:|---:|
| 1 | 6.01 s | 27.87 s | 3.65 s | 1,719 → 1,719 | 0 |
| 2 | 6.04 s | 17.34 s | 4.32 s | 1,203 → 870 | 1 |
| 4 | 5.26 s | 13.35 s | 5.84 s | 903 → 450 | 3 |
| 8 | 5.57 s | 16.53 s | 10.59 s | 903 → 231 | 4 |

Phase columns are independent medians and need not sum to the wall time; bootstrap
is included in capture. The serial planning pass (5–6 s) and per-worker Chrome and
Monaco startup (about 5.5 s at four workers, about 10 s when eight start together)
now bound the result. At eight workers, startup contention costs more than the
smaller segments save. Background load (Spotlight indexing, a VM) was present
during the runs.

## Validation and scope

All 12 deterministic runs have identical planning traces and identical SHA-256
hashes for every source JPEG frame. Each output contains exactly 1,719 frames at
1920×1080 and 60 fps (28.65 s), with no missing or duplicated frame indices, and
checkpoint workers evaluated 1,719 capture frames in total. The one-worker atomic
render also matches the 19 October action-boundary render frame for frame and
trace for trace: with typos and jitter disabled, the atomic executor leaves the
golden output unchanged.

The first attempt (`out/atomic-2026-10-20`) failed at two workers. `PlaybackStopped`
lost `instanceof` in the ES5 library build, so the worker that reached its
mid-action endpoint reported an error instead of stopping. The fix
(`Object.setPrototypeOf` in `src/playback/types.ts`, with an ES5 regression test)
was rebuilt into `/tmp/codevideo-atomic-fix` before these measurements.

Legacy uses realtime WebM capture followed by MP4 transcoding; deterministic
rendering uses JPEG quality 92 and H.264 CRF 18. This compares end-to-end
throughput of the two pipelines, not equivalent codec quality.

## Single-run pass: humanized typing and sequential seek

`CODEVIDEO_BENCHMARK_REPEATS=1 CODEVIDEO_BENCHMARK_REFERENCE=out/checkpoints-2026-10-19 ./bench.sh full`
([report](out/bench-full-1x-2026-10-20/README.md)). One run per configuration under
heavier background load (the slowest worker's bootstrap reached 9.9–18.8 s at four
and eight workers), so these wall times are indicative only.

| Profile (frames) | Legacy | Sequential seek, 1 / 2 / 4 / 8 workers | Atomic checkpoints, 1 / 2 / 4 / 8 workers |
|---|---:|---|---|
| compat (1,719) | 40.91 s | 35.31 / 27.98 / 21.55 / 27.22 s | 38.05 / 23.05 / 20.51 / 24.85 s |
| humanized (1,824) | 42.38 s | 34.53 / 24.77 / 27.35 / 30.57 s | 33.67 / 23.50 / 24.52 / 28.92 s |

- compat output again matched the 19 October render frame for frame, now through
  the harness's `CODEVIDEO_BENCHMARK_REFERENCE` check.
- Humanized typing (`includeTypos`, 8 ms jitter, 40 ms base) runs 1,824 frames
  (30.40 s), 105 frames longer than compat. All eight deterministic renders, both
  strategies at 1–8 workers, produced identical frames and traces, so typo and
  jitter choices do not depend on worker count or strategy.
- On this 16-core machine sequential seek nearly matches checkpoints at four
  workers (21.55 s vs 20.51 s) but evaluates four times the frames (6,876 vs
  1,719). The checkpoint advantage is mostly CPU per job, which matters once jobs
  run concurrently. Use three repeats (`./bench.sh full`) before drawing a firm
  sequential-seek conclusion.

## Reproduction and artifacts

```bash
./bench.sh                                # quick: one run per configuration
CODEVIDEO_BENCHMARK_REPEATS=3 ./bench.sh  # this report's matrix
./bench.sh full                           # adds sequential seek and humanized typing
```

[Measurements](out/atomic-fix-2026-10-20/benchmark.json),
[phase report](out/atomic-fix-2026-10-20/README.md) and
[binary/runtime fingerprints](out/atomic-fix-2026-10-20/provenance.json). Videos,
logs, frame hashes and traces are alongside. The out directory is gitignored;
retain it locally for verification and as a `CODEVIDEO_BENCHMARK_REFERENCE`.
