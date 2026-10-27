import { useEffect, useState, useRef } from 'react';
import { IAction, Project } from '@fullstackcraftllc/codevideo-types';

export interface UseTerminalCaretParams {
  suspended?: boolean;
  deadlineRef?: React.MutableRefObject<number | null>;
  initialDeadlineMs?: number | null;
  initialTimestampMs?: number;
  initialActionIndex?: number;
  project: Project;
  /** The current action from useStableActions. */
  currentAction: IAction | null;
  currentActionIndex: number;
  actionsEpoch: number;
  currentLessonIndex: number | null;
}

/**
 * Shows the terminal block caret for 2 seconds after any terminal action.
 * Deps are append-stable: a streamed append must not restart the 2s window.
 */
export const useTerminalCaret = (params: UseTerminalCaretParams): boolean => {
  const { suspended, deadlineRef, initialDeadlineMs, initialTimestampMs = 0, project, currentAction, currentActionIndex, actionsEpoch, currentLessonIndex } = params;
  const [showBlockCaret, setShowBlockCaret] = useState<boolean>(initialDeadlineMs != null && initialDeadlineMs > initialTimestampMs);

  const restoredAction = useRef(params.initialActionIndex);

  useEffect(() => {
    if (suspended) return;
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      return;
    }

    if (restoredAction.current === currentActionIndex) {
      const remaining = Math.max(0, (initialDeadlineMs ?? 0) - performance.now());
      setShowBlockCaret(remaining > 0);
      if (deadlineRef) deadlineRef.current = remaining > 0 ? initialDeadlineMs! : null;
      if (!remaining) return;
      const timer = setTimeout(() => {
        setShowBlockCaret(false);
        if (deadlineRef) deadlineRef.current = null;
      }, remaining);
      return () => clearTimeout(timer);
    }
    restoredAction.current = undefined;
    if (currentAction && currentAction.name.startsWith('terminal-')) {
      setShowBlockCaret(true);
      if (deadlineRef) deadlineRef.current = ((window as any).__virtualNow?.() ?? performance.now()) + 2000;

      // Keep block caret for 2 seconds after terminal action
      const timer = setTimeout(() => {
        setShowBlockCaret(false);
        if (deadlineRef) deadlineRef.current = null;
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowBlockCaret(false);
      if (deadlineRef) deadlineRef.current = null;
    }
  }, [currentActionIndex, currentAction?.name, actionsEpoch, currentLessonIndex, suspended]);

  return showBlockCaret;
};
