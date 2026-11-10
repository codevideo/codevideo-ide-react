import { sleep } from './sleep.js';
import { debugWarn } from './debugLog.js';
import { PlaybackStopped } from '../playback/types.js';

/**
 * An author-speak-during clip that keeps playing while the next actions run.
 * Deterministic renders know when it ends, on performance.now()'s virtual
 * clock; realtime ones wait for the audio itself.
 */
export interface PendingSpeech {
  untilMs?: number;
  done?: Promise<void>;
}

// A realtime clip that never reports its end (say, a stalled download) stops
// holding the next speech back after this long.
const MAX_REALTIME_WAIT_MS = 120_000;

/**
 * Waits until a speak-during clip that is still playing has finished, so
 * voices never overlap and each caption stays up while its own speech plays.
 */
export const waitForSpeech = async (speechRef: { current: PendingSpeech | null } | undefined, cancelled?: () => boolean): Promise<void> => {
  const pending = speechRef?.current;
  if (!pending) return;
  if (pending.untilMs !== undefined) {
    const remainingMs = pending.untilMs - performance.now();
    if (remainingMs > 0) await sleep(remainingMs);
  } else if (pending.done) {
    let finished = false;
    void pending.done.then(() => { finished = true; });
    const startedMs = performance.now();
    while (!finished) {
      if (cancelled?.()) throw new PlaybackStopped();
      if (performance.now() - startedMs > MAX_REALTIME_WAIT_MS) {
        debugWarn('A speak-during clip never reported its end; the next speech goes ahead');
        break;
      }
      await Promise.race([pending.done, sleep(100)]);
    }
  }
  if (speechRef?.current === pending) speechRef.current = null;
};
