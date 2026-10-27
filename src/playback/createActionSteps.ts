import type { SteppableAction } from '@fullstackcraftllc/codevideo-types';
import type { PlaybackContinuation, PlaybackPrimitive, TypingSettings } from './types.js';
import { characterRandom, withTypos } from './withTypos.js';

export function validateTypingSettings(base: number, jitter: number): void {
  if (!Number.isFinite(jitter) || !Number.isInteger(jitter) || jitter < 0 || jitter > base) {
    throw new Error('keyboardTypingJitterMs must be a finite nonnegative integer no greater than keyboardTypingPauseMs');
  }
}

export function typingText(action: SteppableAction): string {
  // Retain terminal playback's existing last-line semantics and UTF-16 units.
  return action.name === 'terminal-type' ? action.value.split('\n').slice(-1)[0] : action.value;
}

/** Only materialize the current source character's (at most six) primitives. */
export function createActionSteps(cursor: PlaybackContinuation, settings: TypingSettings): PlaybackPrimitive[] {
  if (cursor.action.name === 'author-wait') {
    return cursor.sourceOffset === 0 ? [{ kind: 'wait', durationMs: Math.max(0, parseInt(cursor.action.value) || 1000) }] : [];
  }
  const text = typingText(cursor.action);
  if (cursor.sourceOffset >= text.length) return [];
  const jitter = settings.jitterMs
    ? Math.floor(characterRandom(settings, cursor.sourceOffset, 'jitter') * (settings.jitterMs * 2 + 1)) - settings.jitterMs : 0;
  return [
    ...withTypos(text[cursor.sourceOffset], cursor.sourceOffset, settings, cursor.typosAllowed),
    { kind: 'wait', durationMs: settings.baseDelayMs + jitter },
  ];
}
