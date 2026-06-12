import { useEffect, useState } from 'react';
import { IAction, Project } from '@fullstackcraftllc/codevideo-types';

export interface UseTerminalCaretParams {
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
  const { project, currentAction, currentActionIndex, actionsEpoch, currentLessonIndex } = params;
  const [showBlockCaret, setShowBlockCaret] = useState<boolean>(false);

  useEffect(() => {
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      return;
    }

    if (currentAction && currentAction.name.startsWith('terminal-')) {
      setShowBlockCaret(true);

      // Keep block caret for 2 seconds after terminal action
      const timer = setTimeout(() => {
        setShowBlockCaret(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowBlockCaret(false);
    }
  }, [currentActionIndex, currentAction?.name, actionsEpoch, currentLessonIndex]);

  return showBlockCaret;
};
