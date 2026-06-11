import { useMemo, useRef } from 'react';
import { IAction, Project } from '@fullstackcraftllc/codevideo-types';
import { extractActions, getActionAtIndex } from '../utils/extractActions.js';

export interface UseStableActionsResult {
  /** The actions extracted from the project (fresh reference on every project change). */
  actions: Array<IAction>;
  /**
   * Increments ONLY when the actions changed in a way that invalidates playback
   * history: an earlier action was edited, the list was truncated or replaced
   * with different content, or the lesson changed. Pure appends (the streaming
   * case) and wholesale replacements with identical content (Redux-style
   * immutable updates) do NOT bump the epoch.
   */
  actionsEpoch: number;
  /** The action at currentActionIndex, or null when out of range. */
  currentAction: IAction | null;
  /** False when playback is "starved": the index points past the available actions. */
  hasActionAtCurrentIndex: boolean;
}

const actionsMatch = (a: IAction, b: IAction): boolean =>
  a === b || (a.name === b.name && a.value === b.value);

/**
 * True when `prev` is a prefix of `next` - i.e. the change is append-only
 * (or content-identical). Compared by reference first, then by name+value,
 * because streaming consumers (e.g. codevideo-genie's Redux store) rebuild
 * the array with all-new element references on every chunk.
 */
const isPrefixOf = (prev: Array<IAction>, next: Array<IAction>): boolean => {
  if (next.length < prev.length) {
    return false;
  }
  for (let i = 0; i < prev.length; i++) {
    if (!actionsMatch(prev[i], next[i])) {
      return false;
    }
  }
  return true;
};

/**
 * Stable view over a possibly-growing actions array.
 *
 * The core problem this solves: every append to a streamed actions array
 * produces a new `project` reference, and effects that depend on `project`
 * re-fire at the same action index, restarting animations and re-running
 * side effects (speech, overlays). Effects should instead depend on
 * `actionsEpoch` (changes only on genuine resets) plus whatever per-action
 * primitives they need.
 *
 * The epoch computation is idempotent under React StrictMode double-renders:
 * re-running with the same inputs compares the just-stored array against
 * itself and never double-bumps.
 */
export const useStableActions = (
  project: Project,
  currentLessonIndex: number | null,
  currentActionIndex: number
): UseStableActionsResult => {
  const prevActionsRef = useRef<Array<IAction>>([]);
  const prevLessonIndexRef = useRef<number | null>(currentLessonIndex);
  const epochRef = useRef<number>(0);

  const { actions, actionsEpoch } = useMemo(() => {
    const next = extractActions(project, currentLessonIndex);
    const lessonChanged = prevLessonIndexRef.current !== currentLessonIndex;
    if (lessonChanged || !isPrefixOf(prevActionsRef.current, next)) {
      epochRef.current += 1;
    }
    prevActionsRef.current = next;
    prevLessonIndexRef.current = currentLessonIndex;
    return { actions: next, actionsEpoch: epochRef.current };
  }, [project, currentLessonIndex]);

  const currentAction = getActionAtIndex(actions, currentActionIndex);

  return {
    actions,
    actionsEpoch,
    currentAction,
    hasActionAtCurrentIndex: currentAction !== null,
  };
};
