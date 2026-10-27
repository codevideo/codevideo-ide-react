// Local, speech-free end-to-end measurements of the golden fixture. Run after
// embed-local.sh, or through bench.sh, which applies a preset and builds the CLI.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const directory = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(process.env.CODEVIDEO_CLI_DIR || path.join(directory, '../../../codevideo-cli'));
const binary = path.resolve(process.env.CODEVIDEO_CLI_BINARY || path.join(cli, 'codevideo'));
const output = path.resolve(process.argv[2] || path.join(directory, 'out', `checkpoints-${Date.now()}`));
if (fs.existsSync(output)) throw new Error(`Choose a new output directory: ${output}`);
const list = (name, fallback) => (process.env[name] || fallback).split(',').map(value => value.trim()).filter(Boolean);
const repeats = Number(process.env.CODEVIDEO_BENCHMARK_REPEATS || 3);
const workers = list('CODEVIDEO_BENCHMARK_WORKERS', '1,2,4,8').map(Number);
const strategies = list('CODEVIDEO_BENCHMARK_STRATEGIES', 'sequential-seek,ab-initio');
const fixtures = list('CODEVIDEO_BENCHMARK_FIXTURES', 'fixture.json');
// The CLI's --config struct serializes unset booleans as false, so humanized
// typing restates the v3 page's display defaults and changes typing alone.
const PROFILES = {
  compat: null,
  humanized: { theme: 'dark', defaultLanguage: 'python', allowFocusInEditor: true, withCaptions: true, keyboardTypingPauseMs: 40, includeTypos: true, keyboardTypingJitterMs: 8 },
};
const profiles = list('CODEVIDEO_BENCHMARK_PROFILES', 'compat');
// An earlier benchmark directory (e.g. the last known-good build) whose frames
// and trace each profile's deterministic output must reproduce exactly.
const reference = process.env.CODEVIDEO_BENCHMARK_REFERENCE ? path.resolve(process.env.CODEVIDEO_BENCHMARK_REFERENCE) : null;
// Opt-in for timing a known pixel bug: record differing frames instead of failing.
// Traces, frame counts and the reference check stay strict.
const allowPixelDiffs = process.env.CODEVIDEO_BENCHMARK_ALLOW_PIXEL_DIFFS === '1';
if (!Number.isInteger(repeats) || repeats < 1 || workers.some(w => !Number.isInteger(w) || w < 1 || w > 32)) throw new Error('Invalid benchmark repeats/workers');
if (strategies.some(strategy => !['sequential-seek', 'ab-initio'].includes(strategy))) throw new Error('Invalid benchmark strategies');
if (profiles.some(profile => !Object.hasOwn(PROFILES, profile))) throw new Error(`Invalid benchmark profiles; choose from ${Object.keys(PROFILES).join(', ')}`);
if (!fs.existsSync(binary)) throw new Error(`CLI binary not found: ${binary}; run embed-local.sh or set CODEVIDEO_CLI_BINARY`);
if (reference && !fs.statSync(reference, { throwIfNoEntry: false })?.isDirectory()) throw new Error(`Reference directory not found: ${reference}`);
fs.mkdirSync(output, { recursive: true });
const envFile = path.join(output, 'empty.env'); fs.writeFileSync(envFile, '');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const provenance = Object.fromEntries([binary, ...['recordVideoV3.js', 'renderFramesV1.js', 'renderSegments.js', 'virtualClock.js'].map(file => path.join(cli, 'puppeteer-runner', file))]
  .filter(file => fs.existsSync(file)).map(file => [file, sha256(fs.readFileSync(file))]));
const settings = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('CODEVIDEO_BENCHMARK_') || key === 'CODEVIDEO_CLI_BINARY'));
const summary = { date: new Date().toISOString(), platform: `${process.platform}/${process.arch}`, cpu: os.cpus()[0]?.model, logicalCPUs: os.availableParallelism(), memoryGiB: os.totalmem() / 2 ** 30, node: process.version, seed: 'codevideo-golden-v1', repeats, settings, provenance, profiles: Object.fromEntries(profiles.map(profile => [profile, PROFILES[profile]])), fixtures: {}, references: {}, runs: [] };
const median = values => { const sorted = [...values].sort((a,b) => a-b), m = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2; };
const persist = () => fs.writeFileSync(path.join(output, 'benchmark.json'), JSON.stringify(summary, null, 2));

function loadReference(profile, fixtureKey) {
  const escaped = fixtureKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), files = fs.readdirSync(reference).sort();
  // Directories from before profiles existed hold unprefixed compat runs.
  for (const prefix of profile === 'compat' ? ['compat-', ''] : [`${profile}-`]) {
    const pattern = new RegExp(`^${prefix}${escaped}-(sequential-seek|ab-initio)-\\d+-r\\d+\\.render-metrics\\.json$`);
    for (const file of files.filter(file => pattern.test(file))) {
      const metrics = JSON.parse(fs.readFileSync(path.join(reference, file)));
      if (metrics.sampledFrames?.length !== metrics.frameCount) continue;
      const trace = JSON.parse(fs.readFileSync(path.join(reference, file.replace('.render-metrics.json', '.render-trace.json'))));
      return { file: path.join(reference, file), frameCount: metrics.frameCount, frames: new Map(metrics.sampledFrames.map(s => [s.frame, s.sha256])), trace };
    }
  }
  return null;
}

for (const profile of profiles) {
  const config = PROFILES[profile] && path.join(output, `${profile}.config.json`);
  if (config) fs.writeFileSync(config, JSON.stringify(PROFILES[profile], null, 2));
  for (const fixtureName of fixtures) {
    const fixture = fs.readFileSync(path.resolve(directory, fixtureName), 'utf8');
    const fixtureKey = path.basename(fixtureName, '.json');
    if (JSON.parse(fixture).some(a => a.name.startsWith('author-speak'))) throw new Error('Benchmark fixtures must be speech-free');
    summary.fixtures[fixtureKey] = sha256(fixture);
    const golden = reference && loadReference(profile, fixtureKey);
    if (reference) {
      summary.references[`${profile}/${fixtureKey}`] = golden?.file ?? null;
      console.log(golden ? `Reference for ${profile}/${fixtureKey}: ${golden.file}` : `No ${profile}/${fixtureKey} run in ${reference}; validating within this run only`);
    }
    const cases = [['legacy', 'realtime', 1]];
    for (const count of workers) for (const strategy of strategies) cases.push([strategy, 'deterministic', count]);
    let baseline, expectedTrace;
    for (let repeat = 1; repeat <= repeats; repeat++) {
      // Rotate between repetitions so warm-up and thermal drift don't favor one configuration.
      const offset = (repeat - 1) % cases.length;
      for (const [strategy, mode, count] of [...cases.slice(offset), ...cases.slice(0, offset)]) {
        const name = `${profile}-${fixtureKey}-${strategy}-${count}-r${repeat}`, video = path.join(output, name + '.mp4');
        console.log(`Rendering ${name}...`);
        const env = { ...process.env, CODEVIDEO_ENV_FILE: envFile, SLACK_WEBHOOK_URL: '', CODEVIDEO_SLACK_WEBHOOK_URL: '', ENVIRONMENT: 'local', CODEVIDEO_WORK_DIR: path.join(output, name + '-work'), CODEVIDEO_LOG_DIR: output, CODEVIDEO_RENDER_HASH_ALL: mode === 'deterministic' ? '1' : '0', CODEVIDEO_RENDER_SAMPLE_DIR: '', CODEVIDEO_PUPPETEER_RUNNER_PATH: path.join(cli, 'puppeteer-runner/recordVideoV3.js') };
        const args = ['--project', fixture, '--output', video, '--render-mode', mode, '--render-workers', String(count), '--render-seed', summary.seed];
        if (mode === 'deterministic') args.push('--render-strategy', strategy);
        if (config) args.push('--config', config);
        const log = fs.openSync(path.join(output, name + '.log'), 'w'), started = performance.now();
        let result;
        try { result = spawnSync(binary, args, { env, stdio: ['ignore', log, log], timeout: 20 * 60 * 1000 }); }
        finally { fs.closeSync(log); }
        const wallSeconds = (performance.now() - started) / 1000;
        if (result.error || result.status !== 0) throw new Error(`${name} failed; inspect its log: ${result.error || result.status}`);
        const probe = spawnSync(process.env.CODEVIDEO_FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,nb_frames,r_frame_rate,width,height', '-of', 'json', video], {encoding:'utf8'});
        if (probe.status !== 0) throw new Error(probe.stderr);
        const media = JSON.parse(probe.stdout), run = { name, profile, fixture: fixtureKey, mode, strategy, requestedWorkers: count, repeat, wallSeconds, durationSeconds: Number(media.format.duration) };
        if (mode === 'deterministic') {
          const metrics = JSON.parse(fs.readFileSync(video.replace('.mp4', '.render-metrics.json')));
          Object.assign(run, metrics);
          const stream = media.streams.find(s => s.codec_type === 'video');
          assert.equal(Number(stream.nb_frames), run.frameCount);
          assert.equal(stream.r_frame_rate, '60/1');
          // Humanized typing lengthens the timeline; only compat keeps the golden length.
          if (profile === 'compat' && fixtureName === 'fixture.json') assert.equal(run.frameCount, 1719);
          assert.equal(metrics.sampledFrames.length, run.frameCount);
          assert.deepEqual(metrics.sampledFrames.map(sample => sample.frame), Array.from({length: run.frameCount}, (_, frame) => frame), `${name}: missing or duplicated source frames`);
          if (strategy === 'ab-initio') assert.equal(metrics.evaluatedFrames, run.frameCount);
          const trace = JSON.parse(fs.readFileSync(video.replace('.mp4', '.render-trace.json')));
          if (!baseline) {
            baseline = new Map(metrics.sampledFrames.map(s => [s.frame, s.sha256])); expectedTrace = trace;
            if (golden) {
              assert.equal(run.frameCount, golden.frameCount, `${name}: ${run.frameCount} frames; reference has ${golden.frameCount}`);
              const differing = metrics.sampledFrames.filter(s => s.sha256 !== golden.frames.get(s.frame)).map(s => s.frame);
              assert.equal(differing.length, 0, `${name}: ${differing.length} frames differ from ${golden.file}, starting at ${differing.slice(0, 20).join(',')}`);
              assert.deepEqual(trace, golden.trace, `${name}: trace differs from ${golden.file}`);
            }
          }
          assert.deepEqual(trace, expectedTrace, `${name}: trace mismatch`);
          const differing = metrics.sampledFrames.filter(sample => sample.sha256 !== baseline.get(sample.frame)).map(sample => sample.frame);
          if (differing.length) {
            const ranges = differing.reduce((all, frame) => { const last = all.at(-1); if (last && frame === last[1] + 1) last[1] = frame; else all.push([frame, frame]); return all; }, []).map(([a, b]) => a === b ? `${a}` : `${a}-${b}`);
            if (!allowPixelDiffs) assert.fail(`${name}: different pixels at ${differing.length} frames: ${ranges.slice(0, 10).join(', ')}`);
            Object.assign(run, { pixelDiffFrames: differing.length, pixelDiffRanges: ranges });
            console.log(`${name}: WARNING ${differing.length} frames differ from the baseline: ${ranges.join(', ')}`);
          }
          run.largestSegmentFrames = Math.max(...metrics.segments.map(s => s.endFrame - s.startFrame));
          run.midActionCuts = metrics.segments.filter(s => s.startCursor?.continuation).length;
          delete run.sampledFrames;
        }
        summary.runs.push(run); persist();
        console.log(`${name}: ${wallSeconds.toFixed(2)}s; used ${run.workers || 1} workers; evaluated ${run.evaluatedFrames || 'realtime'} frames`);
      }
    }
  }
}
const groups = new Map();
for (const run of summary.runs) { const key = `${run.profile}/${run.fixture}/${run.strategy}/${run.requestedWorkers}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(run); }
summary.medians = [...groups.values()].map(runs => {
  const [first] = runs, wallSeconds = median(runs.map(r => r.wallSeconds));
  const legacySeconds = median(summary.runs.filter(r => r.profile === first.profile && r.fixture === first.fixture && r.mode === 'realtime').map(r => r.wallSeconds));
  const slowest = field => median(runs.map(r => Math.max(0, ...(r.segments || []).map(s => s[field])) / 1000));
  return { profile: first.profile, fixture: first.fixture, strategy: first.strategy, requestedWorkers: first.requestedWorkers, actualWorkers: first.workers || 1,
    wallSeconds, wallTimes: runs.map(r => r.wallSeconds), speedupVsLegacy: legacySeconds / wallSeconds, timeSavedPercent: 100 * (1 - wallSeconds / legacySeconds),
    planningSeconds: median(runs.map(r => (r.planningMs || 0) / 1000)), captureSeconds: median(runs.map(r => (r.captureMs || 0) / 1000)),
    bootstrapSeconds: slowest('bootstrapMs'), restoreSeconds: slowest('restoreMs'), largestSegmentFrames: first.largestSegmentFrames ?? null, midActionCuts: first.midActionCuts ?? null,
    frameCount: first.frameCount ?? null, videoSeconds: median(runs.map(r => r.durationSeconds)), evaluatedFrames: first.evaluatedFrames ?? null,
    planningPlusCaptureFrames: first.evaluatedFrames ? first.evaluatedFrames + first.planningEvaluatedFrames : null };
});
const pixelDiffRuns = summary.runs.filter(run => run.pixelDiffFrames);
summary.validation = [
  pixelDiffRuns.length
    ? `PIXEL DIFFERENCES (allowed by CODEVIDEO_BENCHMARK_ALLOW_PIXEL_DIFFS): ${pixelDiffRuns.map(run => `${run.name} differs from the baseline at ${run.pixelDiffFrames} frames (${run.pixelDiffRanges.join(', ')})`).join('; ')}. Traces and encoded frame counts match.`
    : 'All deterministic traces, all source frames and encoded frame counts match the first deterministic run of each profile and fixture.',
  ...Object.entries(summary.references).map(([key, file]) => file ? `${key} also matches every frame and the trace of ${file}.` : `${key} had no reference run to compare against.`),
].join(' ');
persist();
const label = { legacy: 'Legacy realtime', 'sequential-seek': 'Sequential seek', 'ab-initio': 'Atomic checkpoints (ab-initio)' };
const order = ['legacy', ...strategies];
const fixed = (value, digits = 2) => value === null || value === undefined || Number.isNaN(value) ? '—' : value.toFixed(digits);
const sections = [...new Set(summary.medians.map(m => `${m.profile}/${m.fixture}`))].map(key => {
  const rows = summary.medians.filter(m => `${m.profile}/${m.fixture}` === key)
    .sort((a, b) => order.indexOf(a.strategy) - order.indexOf(b.strategy) || a.requestedWorkers - b.requestedWorkers);
  const frames = rows.find(m => m.frameCount)?.frameCount, legacy = rows.find(m => m.strategy === 'legacy');
  const lines = rows.map(m => {
    const realtime = m.strategy === 'legacy', blank = value => realtime ? '—' : value;
    return `| ${label[m.strategy] ?? m.strategy} | ${m.requestedWorkers}/${m.actualWorkers} | ${fixed(m.wallSeconds)} | ${fixed(m.speedupVsLegacy)}× | ${realtime ? '—' : fixed(m.timeSavedPercent, 1) + '%'} | ${blank(fixed(m.planningSeconds))} | ${blank(fixed(m.captureSeconds))} | ${blank(fixed(m.bootstrapSeconds))} | ${blank(fixed(m.restoreSeconds, 3))} | ${m.largestSegmentFrames ?? '—'} | ${m.midActionCuts ?? '—'} | ${m.evaluatedFrames ? `${m.evaluatedFrames} / ${m.planningPlusCaptureFrames}` : '—'} | ${m.wallTimes.map(t => t.toFixed(2)).join(', ')} |`;
  });
  return `## ${key.replace('/', ': ')}${frames ? ` (${frames} frames, ${(frames / 60).toFixed(2)} s deterministic timeline)` : ''}\n\n${legacy ? `Legacy realtime video: ${fixed(legacy.videoSeconds)} s.\n\n` : ''}| Renderer | Workers requested/used | Median wall s | Speedup vs legacy | Time saved | Planning s | Capture s | Slowest bootstrap s | Slowest restore s | Largest segment (frames) | Mid-action cuts | Evaluated frames (capture / with planning) | All wall times s |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${lines.join('\n')}`;
});
const readme = `# Renderer benchmark\n\n${summary.date}; ${summary.cpu}; ${summary.platform}; ${summary.memoryGiB} GiB RAM; Node ${summary.node}. Medians of ${repeats} measured run(s) per configuration at 1080p/60 fps. Configurations run sequentially and rotate order between repetitions. Speedup compares median wall time with the same profile's legacy realtime render. Bootstrap and restore are the slowest worker in each run; capture includes parallel bootstrap and encoding, so do not add them again.\n\n${sections.join('\n\n')}\n\n${summary.validation}\n\nLegacy uses realtime WebM followed by transcoding; deterministic uses JPEG 92 and H.264 CRF 18. These measurements compare throughput, not codec quality equivalence. Full logs, traces, per-worker timings, videos and build fingerprints (benchmark.json) accompany this report.\n`;
fs.writeFileSync(path.join(output, 'README.md'), readme);
console.log(`\n${readme}\nVerified benchmark: ${output}`);
