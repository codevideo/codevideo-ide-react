import type { SteppableAction } from '@fullstackcraftllc/codevideo-types';
import { createActionSteps, validateTypingSettings } from './createActionSteps.js';
import { PlaybackStopped } from './types.js';
import type { PlaybackContinuation, PlaybackTarget, TypingSettings } from './types.js';

interface Options {
  action: SteppableAction;
  settings: TypingSettings;
  target: PlaybackTarget;
  continuation?: PlaybackContinuation | null;
  cancelled?: () => boolean;
  /** Called only at selected opportunities, after state has settled. False stops the segment. */
  checkpoint?: (cursor: PlaybackContinuation) => Promise<boolean>;
  checkpointIntervalMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export async function executePlaybackSteps(options: Options): Promise<void> {
  const { action, settings, target } = options;
  validateTypingSettings(settings.baseDelayMs, settings.jitterMs);
  const now = options.now ?? (() => performance.now());
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const cursor: PlaybackContinuation = options.continuation
    ? JSON.parse(JSON.stringify(options.continuation))
    : { action, phase: 'steps', sourceOffset: 0, nextPrimitive: 0, pendingCorrection: null, nextDeadlineMs: null, typosAllowed: target.allowsTypos() };
  if (JSON.stringify(cursor.action) !== JSON.stringify(action)) throw new Error('Checkpoint action does not match the authored action');
  const checkCancelled = () => { if (options.cancelled?.()) throw new PlaybackStopped(); };
  const interval = options.checkpointIntervalMs ?? 500;
  let nextOpportunity = (Math.floor((now() + 1e-7) / interval) + 1) * interval;
  const checkpoint = async () => {
    checkCancelled();
    if (!options.checkpoint || now() + 1e-7 < nextOpportunity) return;
    nextOpportunity = (Math.floor((now() + 1e-7) / interval) + 1) * interval;
    if (!await options.checkpoint(cursor)) throw new PlaybackStopped();
    checkCancelled();
  };
  for (;;) {
    checkCancelled();
    const steps = createActionSteps(cursor, settings);
    if (!steps.length) return;
    if (cursor.nextPrimitive >= steps.length) throw new Error('Invalid checkpoint primitive');
    const step = steps[cursor.nextPrimitive];
    if (step.kind === 'wait') {
      if (cursor.nextDeadlineMs === null) cursor.nextDeadlineMs = now() + step.durationMs;
      // Keep the absolute deadline. Checkpoint opportunities only subdivide the wait.
      do {
        const remaining = Math.max(0, cursor.nextDeadlineMs - now());
        await sleep(options.checkpoint ? Math.min(remaining, Math.max(0, nextOpportunity - now())) : remaining);
        checkCancelled();
        if (now() + 1e-7 < cursor.nextDeadlineMs) await checkpoint();
      } while (now() + 1e-7 < cursor.nextDeadlineMs);
      cursor.nextDeadlineMs = null;
    } else if (step.kind === 'insert') {
      const inserted = target.insert(step.text, step.correction);
      if (step.correction) {
        if (!inserted) throw new Error('Typing target did not record the correction range');
        cursor.pendingCorrection = inserted;
      }
    } else {
      if (!cursor.pendingCorrection) throw new Error('Checkpoint correction range is missing');
      target.deleteExact(cursor.pendingCorrection);
      cursor.pendingCorrection = null;
    }
    cursor.nextPrimitive++;
    if (cursor.nextPrimitive === steps.length) {
      cursor.sourceOffset++;
      cursor.nextPrimitive = 0;
    }
    await checkpoint();
  }
}
