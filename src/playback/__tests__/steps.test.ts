import type { SteppableAction } from '@fullstackcraftllc/codevideo-types';
import { executePlaybackSteps } from '../executePlaybackSteps';
import { createActionSteps, validateTypingSettings } from '../createActionSteps';
import { withTypos } from '../withTypos';
import { textTarget } from '../targets';
import { PlaybackStopped, PlaybackContinuation, TypingSettings } from '../types';
import { createActionRandom } from '../../utils/deterministicRandom';

const settings: TypingSettings = { seed: 'atomic-test', lessonIndex: 0, actionIndex: 4, baseDelayMs: 40, jitterMs: 8, includeTypos: true };
type Saved = { cursor: PlaybackContinuation; time: number; value: string; changes: number };

async function run(action: SteppableAction, options: Partial<TypingSettings> = {}, saved?: Saved, allowed = true) {
  let time = saved?.time ?? 200, value = saved?.value ?? 'prefix:';
  const changes: Array<{ time: number; value: string }> = [], checkpoints: Saved[] = [];
  const target = textTarget(() => value, update => { value = update(value); changes.push({ time, value }); });
  target.allowsTypos = () => allowed;
  await executePlaybackSteps({
    action, settings: { ...settings, ...options }, target, continuation: saved?.cursor,
    now: () => time, sleep: async ms => { time += ms; }, checkpointIntervalMs: 17,
    checkpoint: async cursor => {
      checkpoints.push({ cursor: JSON.parse(JSON.stringify(cursor)), time, value, changes: changes.length });
      return true;
    },
  });
  return { time, value, changes, checkpoints };
}

test.each([
  'editor-type', 'terminal-type', 'file-explorer-type-new-file-input', 'file-explorer-type-new-folder-input',
  'file-explorer-type-rename-file-input', 'file-explorer-type-rename-folder-input',
] as const)('%s resumes every sampled primitive/deadline with identical edits and final timing', async name => {
  const action = { name, value: 'HelloWorld'.repeat(10) };
  const whole = await run(action);
  expect(whole.value).toBe('prefix:' + action.value);
  expect(whole.changes.length).toBeGreaterThan(action.value.length);
  expect(whole.checkpoints.some(cp => cp.cursor.pendingCorrection)).toBe(true);
  expect(whole.checkpoints.some(cp => cp.cursor.nextPrimitive === 3)).toBe(true);
  for (const saved of whole.checkpoints) {
    const resumed = await run(action, {}, saved);
    expect(resumed.time).toBe(whole.time);
    expect(resumed.value).toBe(whole.value);
    expect(resumed.changes).toEqual(whole.changes.slice(saved.changes));
  }
});

test('wait restoration retains its deadline and adds no setup pause', async () => {
  const action = { name: 'author-wait', value: '1234' } as const;
  const whole = await run(action);
  expect(whole.time).toBe(1434);
  for (const saved of whole.checkpoints) {
    const resumed = await run(action, {}, saved);
    expect(resumed.time).toBe(1434);
    expect(resumed.changes).toEqual([]);
  }
});

test('zero jitter/no typos preserves UTF-16 units, terminal last-line behavior and final delay', async () => {
  const plain = { includeTypos: false, jitterMs: 0 };
  const result = await run({ name: 'editor-type', value: 'a🙂é\n' }, plain);
  expect(result.time).toBe(200 + 5 * 40);
  expect(result.changes).toHaveLength(5);
  expect((await run({ name: 'editor-type', value: '' }, plain)).time).toBe(200);
  expect((await run({ name: 'terminal-type', value: 'ignored\nfinal' }, plain)).value).toBe('prefix:final');
});

test('jitter validation rejects fractional, negative, non-finite and larger-than-base values', () => {
  for (const value of [-1, .5, NaN, Infinity, 41]) expect(() => validateTypingSettings(40, value)).toThrow(/keyboardTypingJitterMs/);
  for (const value of [0, 8, 40]) expect(() => validateTypingSettings(40, value)).not.toThrow();
});

test('letters alone receive typos; case and noncollapsed selection policy are preserved', () => {
  let seed = 0;
  while (withTypos('a', 0, { ...settings, seed: String(seed) }, true).length === 1) seed++;
  const configured = { ...settings, seed: String(seed) };
  const lower = withTypos('a', 0, configured, true), upper = withTypos('A', 0, configured, true);
  expect(lower).toHaveLength(5);
  expect(upper[0]).toEqual({ ...lower[0], text: (lower[0] as any).text.toUpperCase() });
  for (const char of ['a', 'é', '🙂', ' ', '1']) expect(withTypos(char, 0, configured, false)).toHaveLength(1);
  for (const char of ['é', '🙂', ' ', '1']) expect(withTypos(char, 0, configured, true)).toHaveLength(1);
});

test('typing random purposes do not consume mouse draws and jitter does not alter typo choices', () => {
  const mouse = createActionRandom(settings.seed, 4, 'mouse-path', 0);
  const expected = createActionRandom(settings.seed, 4, 'mouse-path', 0);
  for (let offset = 0; offset < 200; offset++) {
    const cursor: PlaybackContinuation = { action: {name: 'editor-type', value: 'a'.repeat(200)}, phase: 'steps', sourceOffset: offset, nextPrimitive: 0, pendingCorrection: null, nextDeadlineMs: null, typosAllowed: true };
    const varied = createActionSteps(cursor, settings), fixed = createActionSteps(cursor, { ...settings, jitterMs: 0 });
    expect(varied.slice(0, -1)).toEqual(fixed.slice(0, -1));
    const delay = varied.at(-1) as { durationMs: number };
    expect(delay.durationMs).toBeGreaterThanOrEqual(32); expect(delay.durationMs).toBeLessThanOrEqual(48);
    expect(mouse()).toBe(expected());
  }
});

test('PlaybackStopped remains instanceof-detectable in the ES5 library build', () => {
  // ts-jest emits native classes, so compile types.ts the way rollup does.
  const ts = require('typescript');
  const source = require('fs').readFileSync(require('path').join(__dirname, '../types.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS } });
  const compiled: { exports: any } = { exports: {} };
  new Function('module', 'exports', outputText)(compiled, compiled.exports);
  expect(new compiled.exports.PlaybackStopped()).toBeInstanceOf(compiled.exports.PlaybackStopped);
});

test('cancellation and segment stopping prevent later primitives from mutating the target', async () => {
  let time = 0, value = '', cancelled = false;
  const promise = executePlaybackSteps({
    action: {name: 'editor-type', value: 'hello'}, settings,
    target: textTarget(() => value, update => { value = update(value); }),
    now: () => time, sleep: async ms => { time += ms; cancelled = true; }, cancelled: () => cancelled,
  });
  await expect(promise).rejects.toBeInstanceOf(PlaybackStopped);
  expect(value).toBe('h');
  await expect(executePlaybackSteps({
    action: {name: 'author-wait', value: '5000'}, settings,
    target: textTarget(() => '', () => {}), now: () => time, sleep: async ms => { time += ms; },
    checkpoint: async () => false,
  })).rejects.toBeInstanceOf(PlaybackStopped);
  expect(time).toBe(500);
});
