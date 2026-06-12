import { useEffect, useState } from 'react';
import { GUIMode, IAction, IFileEntry, Project } from '@fullstackcraftllc/codevideo-types';
import { VirtualIDE } from '@fullstackcraftllc/codevideo-virtual-ide';
import { deriveOverlayState } from './deriveOverlayState.js';

export interface UseOverlayDisplayParams {
  project: Project;
  mode: GUIMode;
  /** The current action from useStableActions. */
  currentAction: IAction | null;
  currentActionIndex: number;
  actions: Array<IAction>;
  actionsEpoch: number;
  currentLessonIndex: number | null;
}

export interface OverlayDisplayState {
  isSlideDisplayStep: boolean;
  slideMarkdown: string;
  isExternalWebPreviewDisplayStep: boolean;
  webPreviewFilesState: Array<IFileEntry>;
  isExternalBrowserDisplayStep: boolean;
  externalBrowserStepUrlState: string | null;
}

/**
 * Slide / web-preview / external-browser overlay routing.
 *
 * Overlays continue displaying through subsequent author actions when
 * stepping FORWARD, and hide when stepping backward or reaching any other
 * action. Continuation state is carried across renders (it is never
 * reconstituted from action history at mount).
 *
 * Deps are append-stable: a streamed append beyond the current index must
 * not re-route overlays or rebuild the web-preview VirtualIDE.
 */
export const useOverlayDisplay = (params: UseOverlayDisplayParams): OverlayDisplayState => {
  const {
    project,
    mode,
    currentAction,
    currentActionIndex,
    actions,
    actionsEpoch,
    currentLessonIndex,
  } = params;

  const [isSlideDisplayStep, setIsSlideDisplayStep] = useState<boolean>(false);
  const [slideMarkdown, setSlideMarkdown] = useState<string>("");
  const [isExternalWebPreviewDisplayStep, setIsExternalWebPreviewDisplayStep] = useState<boolean>(false);
  const [webPreviewFilesState, setWebPreviewFilesState] = useState<Array<IFileEntry>>([]);
  const [isExternalBrowserDisplayStep, setIsExternalBrowserDisplayStep] = useState<boolean>(false);
  const [externalBrowserStepUrlState, setExternalBrowserStepUrlState] = useState<string | null>(null);
  const [prevActionIndex, setPrevActionIndex] = useState<number>(-1);

  useEffect(() => {
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      return;
    }

    const hideAll = () => {
      setIsSlideDisplayStep(false);
      setSlideMarkdown("");
      setIsExternalWebPreviewDisplayStep(false);
      setWebPreviewFilesState([]);
      setIsExternalBrowserDisplayStep(false);
      setExternalBrowserStepUrlState(null);
    };

    // Determine if we're moving forward or backward through actions
    const isSteppingForward = currentActionIndex > prevActionIndex;
    const patch = deriveOverlayState(currentAction, isSteppingForward);

    switch (patch.type) {
      case 'slide':
        setIsSlideDisplayStep(true);
        setSlideMarkdown(patch.slideMarkdown);
        break;
      case 'web-preview': {
        setIsExternalWebPreviewDisplayStep(true);
        const virtualIDE = new VirtualIDE(project);
        virtualIDE.applyActions(actions.slice(0, currentActionIndex + 1));
        setWebPreviewFilesState(virtualIDE.getFullFilePathsAndContents());
        break;
      }
      case 'external-browser':
        setIsExternalBrowserDisplayStep(true);
        setExternalBrowserStepUrlState(patch.url);
        break;
      case 'keep':
        // author action stepping forward: keep any currently displayed overlay
        break;
      case 'hide':
        hideAll();
        break;
    }

    // Update the previous action index for next comparison - moved to end and add dependency check
    if (mode === 'step' || currentActionIndex > 0) {
      setPrevActionIndex(currentActionIndex);
    }
  }, [currentActionIndex, currentAction?.name, currentAction?.value, actionsEpoch, currentLessonIndex, mode]);

  return {
    isSlideDisplayStep,
    slideMarkdown,
    isExternalWebPreviewDisplayStep,
    webPreviewFilesState,
    isExternalBrowserDisplayStep,
    externalBrowserStepUrlState,
  };
};
