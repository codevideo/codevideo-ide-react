import type { SteppableAction } from '@fullstackcraftllc/codevideo-types';

/** Exact insertion to undo; never invoke an editor's smart backspace command. */
export type CorrectionTarget =
  | { kind: 'editor'; uri: string; start: number; text: string }
  | { kind: 'text'; start: number; text: string };

export type PlaybackPrimitive =
  | { kind: 'insert'; text: string; correction: boolean }
  | { kind: 'delete' }
  | { kind: 'wait'; durationMs: number };

export interface PlaybackContinuation {
  action: SteppableAction;
  phase: 'steps';
  /** UTF-16 offset, deliberately retaining the existing typing unit. */
  sourceOffset: number;
  nextPrimitive: number;
  pendingCorrection: CorrectionTarget | null;
  nextDeadlineMs: number | null;
  /** Remember the original selection policy, including after restoration. */
  typosAllowed: boolean;
}

export interface TypingSettings {
  seed: string;
  lessonIndex: number | null;
  actionIndex: number;
  baseDelayMs: number;
  jitterMs: number;
  includeTypos: boolean;
}

export interface PlaybackTarget {
  allowsTypos(): boolean;
  insert(text: string, correction: boolean): CorrectionTarget | null;
  deleteExact(target: CorrectionTarget): void;
}

export class PlaybackStopped extends Error {
  constructor() {
    super('Playback stopped at a segment endpoint or cancellation');
    // The library build targets ES5, where Error subclasses otherwise fail instanceof.
    Object.setPrototypeOf(this, PlaybackStopped.prototype);
  }
}
