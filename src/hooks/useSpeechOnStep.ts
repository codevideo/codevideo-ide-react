import { useEffect } from 'react';
import { GUIMode, IAction, Project } from '@fullstackcraftllc/codevideo-types';
import { speakText, stopSpeaking } from '../utils/speakText.js';

export interface UseSpeechOnStepParams {
  project: Project;
  mode: GUIMode;
  isSoundOn: boolean;
  /** The current action from useStableActions. */
  currentAction: IAction | null;
  currentActionIndex: number;
  actionsEpoch: number;
  currentLessonIndex: number | null;
  speakActionAudios: Array<{ text: string; mp3Url: string }>;
}

/**
 * Step-mode speech: whenever sound is on and the current action is an author
 * action, speak it (preferring a pre-generated mp3 matched by text);
 * otherwise stop any ongoing speech.
 *
 * Deps are append-stable (a streamed append must not re-speak the current
 * action). NOTE: `mode` is deliberately NOT a dependency - long-standing
 * quirk of the original effect, preserved verbatim.
 */
export const useSpeechOnStep = (params: UseSpeechOnStepParams): void => {
  const {
    project,
    mode,
    isSoundOn,
    currentAction,
    currentActionIndex,
    actionsEpoch,
    currentLessonIndex,
    speakActionAudios,
  } = params;

  useEffect(() => {
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      return;
    }

    if (isSoundOn && mode === 'step' && currentAction && currentAction.name.startsWith('author-')) {
      // try to find a match by the sha256 hash of the action.value in the speakActionAudios array
      const action = currentAction;
      const mp3Url = speakActionAudios.find((audio) => audio.text === action.value)?.mp3Url;

      // if audio element was not found, it is undefined and we default to the speech synthesis
      speakText(currentAction.value, 1, mp3Url);
    } else {
      stopSpeaking();
    }
  }, [isSoundOn, currentAction?.name, currentAction?.value, actionsEpoch, currentActionIndex, currentLessonIndex]);
};
