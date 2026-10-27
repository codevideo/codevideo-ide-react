import { getNeighborKeys } from '@fullstackcraftllc/codevideo-virtual-keyboard';
import { createActionRandom } from '../utils/deterministicRandom.js';
import type { PlaybackPrimitive, TypingSettings } from './types.js';

/** Each purpose has its own stream; resuming never consumes a mouse/random stream. */
export function characterRandom(settings: TypingSettings, offset: number, purpose: string): number {
  return createActionRandom(settings.seed, settings.actionIndex, `typing-v1:${offset}:${purpose}`, settings.lessonIndex)();
}

export function withTypos(text: string, offset: number, settings: TypingSettings, allowed: boolean): PlaybackPrimitive[] {
  const neighbors = getNeighborKeys(text);
  if (!settings.includeTypos || !allowed || !neighbors.length || characterRandom(settings, offset, 'occurrence') >= 0.025) {
    return [{ kind: 'insert', text, correction: false }];
  }
  const wrong = neighbors[Math.floor(characterRandom(settings, offset, 'neighbor') * neighbors.length)];
  return [
    { kind: 'insert', text: wrong, correction: true },
    { kind: 'wait', durationMs: 120 + Math.floor(characterRandom(settings, offset, 'hesitation') * 121) },
    { kind: 'delete' },
    { kind: 'wait', durationMs: 60 + Math.floor(characterRandom(settings, offset, 'correction') * 61) },
    { kind: 'insert', text, correction: false },
  ];
}
