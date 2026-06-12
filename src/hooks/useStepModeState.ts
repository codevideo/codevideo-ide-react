import { GUIMode, IAction, IPoint, Project } from '@fullstackcraftllc/codevideo-types';
import * as monaco from 'monaco-editor';
import { reconstituteAllPartsOfState } from '../utils/reconstituteAllPartsOfState.js';
import { extractActions, getActionAtIndex } from '../utils/extractActions.js';
import { getNewMousePosition } from '../MouseOverlay/utils/getNewMousePosition.js';
import { debugLog, debugWarn } from '../utils/debugLog.js';

export interface UseStepModeStateParams {
  project: Project;
  mode: GUIMode;
  currentActionIndex: number;
  currentLessonIndex: number | null;

  monacoEditorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  targetMousePosition: IPoint;

  setEditors: (value: any) => void;
  setCurrentEditor: (value: any) => void;
  setCurrentFileName: (value: any) => void;
  setCurrentFileStructure: (value: any) => void;
  setCurrentCode: (value: any) => void;
  setCurrentCaretPosition: (value: any) => void;
  setTerminalBuffer: (value: any) => void;
  setCaptionText: (value: any) => void;
  setTargetMousePosition: (value: any) => void;
  setNewFileInputValue: React.Dispatch<React.SetStateAction<string>>;
  setNewFolderInputValue: React.Dispatch<React.SetStateAction<string>>;
  setIsFileExplorerContextMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFileContextMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFolderContextMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewFileInputVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewFolderInputVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setOriginalFileBeingRenamed: React.Dispatch<React.SetStateAction<string>>;
  setOriginalFolderBeingRenamed: React.Dispatch<React.SetStateAction<string>>;
  setCurrentHoveredFileName: React.Dispatch<React.SetStateAction<string>>;
  setCurrentHoveredFolderName: React.Dispatch<React.SetStateAction<string>>;
  setNewFileParentPath: React.Dispatch<React.SetStateAction<string>>;
  setNewFolderParentPath: React.Dispatch<React.SetStateAction<string>>;
  setCurrentHoveredEditorTabFileName: React.Dispatch<React.SetStateAction<string>>;
  setIsUnsavedChangesDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUnsavedFileName: React.Dispatch<React.SetStateAction<string>>;
  setCurrentExternalBrowserScrollPosition: React.Dispatch<React.SetStateAction<number>>;
}

export interface UseStepModeStateResult {
  /**
   * Full state reconstitution at the current action index: builds a VirtualIDE,
   * applies the action prefix, and distributes the snapshot into component
   * state. In step mode it additionally syncs code/caret (with the original
   * setTimeout(0) Monaco-race workarounds), file-explorer input values, scroll
   * actions, and the mouse position.
   */
  updateState: () => void;
}

/**
 * Step-mode state derivation, extracted verbatim from CodeVideoIDE. The state
 * itself stays with the component (these setters are shared with the replay
 * animation path); this hook owns the derivation and distribution logic.
 */
export const useStepModeState = (params: UseStepModeStateParams): UseStepModeStateResult => {
  const {
    project,
    mode,
    currentActionIndex,
    currentLessonIndex,
    monacoEditorRef,
    containerRef,
    targetMousePosition,
    setEditors,
    setCurrentEditor,
    setCurrentFileName,
    setCurrentFileStructure,
    setCurrentCode,
    setCurrentCaretPosition,
    setTerminalBuffer,
    setCaptionText,
    setTargetMousePosition,
    setNewFileInputValue,
    setNewFolderInputValue,
    setIsFileExplorerContextMenuVisible,
    setIsFileContextMenuVisible,
    setIsFolderContextMenuVisible,
    setIsNewFileInputVisible,
    setIsNewFolderInputVisible,
    setOriginalFileBeingRenamed,
    setOriginalFolderBeingRenamed,
    setCurrentHoveredFileName,
    setCurrentHoveredFolderName,
    setNewFileParentPath,
    setNewFolderParentPath,
    setCurrentHoveredEditorTabFileName,
    setIsUnsavedChangesDialogOpen,
    setUnsavedFileName,
    setCurrentExternalBrowserScrollPosition,
  } = params;

  const handleStepModeScrollActions = () => {
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      return;
    }

    const extractedActions = extractActions(project, currentLessonIndex);

    const currentAction = getActionAtIndex(extractedActions, currentActionIndex);

    if (!currentAction) {
      return;
    }

    switch (currentAction.name) {
      case "editor-scroll-up":
        if (monacoEditorRef.current) {
          const scrollUpDistance = parseInt(currentAction.value) || 3; // Default to 3 lines
          const currentPosition = monacoEditorRef.current.getPosition();
          const currentLine = currentPosition?.lineNumber || 1;
          monacoEditorRef.current.revealLineInCenter(Math.max(1, currentLine - scrollUpDistance));
        }
        break;
      case "editor-scroll-down":
        if (monacoEditorRef.current) {
          const scrollDownDistance = parseInt(currentAction.value) || 3; // Default to 3 lines
          const currentPositionDown = monacoEditorRef.current.getPosition();
          const currentLineDown = currentPositionDown?.lineNumber || 1;
          monacoEditorRef.current.revealLineInCenter(currentLineDown + scrollDownDistance);
        }
        break;
      case "external-browser-scroll":
        const scrollPosition = parseInt(currentAction.value) || 0;
        setCurrentExternalBrowserScrollPosition(scrollPosition);
        break;
      default:
        // No scroll action to handle
        break;
    }
  };

  // This is copied basically in animation way down logic below, could be refactored
  const updateMouseStateAndSideEffects = (actions: Array<IAction>) => {
    if (currentActionIndex === 0 && mode === 'step') {
      if (!containerRef?.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setTargetMousePosition({
        x: rect.width / 2,
        y: rect.height / 2,
      });
      return;
    }
    const currentAction = getActionAtIndex(actions, currentActionIndex);
    if (!currentAction) return;

    const newPosition = getNewMousePosition(targetMousePosition, currentAction, containerRef);

    // Safety check to prevent undefined coordinates
    if (!newPosition || isNaN(newPosition.x) || isNaN(newPosition.y) ||
      newPosition.x === undefined || newPosition.y === undefined) {
      debugWarn('Invalid mouse position detected, keeping current position:', newPosition);
      return;
    }

    debugLog(`Action: ${currentAction.name}, New position: x=${newPosition.x}, y=${newPosition.y}`);

    setTargetMousePosition(newPosition);
  }

  const updateState = () => {
    // Don't proceed if project is empty (not loaded yet)
    if (!project || (Array.isArray(project) && project.length === 0)) {
      debugLog("[updateState] Project is empty or not loaded yet, skipping state update");
      debugLog("[updateState] Project:", project);
      return;
    }

    debugLog("[updateState] Updating state for action index:", currentActionIndex, "lesson index:", currentLessonIndex);
    debugLog("[updateState] Project type:", Array.isArray(project) ? 'actions array' : typeof project);

    const {
      editors,
      currentEditor,
      currentFilename,
      fileExplorerSnapshot,
      currentCode,
      currentCaretPosition,
      currentTerminalBuffer,
      captionText,
      actions,
      mouseSnapshot,
      isUnsavedChangesDialogOpen,
      unsavedFileName
    } = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex);

    debugLog("[updateState] Reconstituted state:");
    debugLog("  - editors count:", editors?.length || 0);
    debugLog("  - currentEditor:", currentEditor?.filename || 'none');
    debugLog("  - actions count:", actions?.length || 0);
    debugLog("  - fileStructure keys:", Object.keys(fileExplorerSnapshot?.fileStructure || {}));
    setEditors(editors)
    setCurrentEditor(currentEditor);
    setCurrentFileName(currentFilename);
    setCurrentFileStructure(fileExplorerSnapshot.fileStructure);

    // In step mode, update code first, then caret position after a brief delay
    if (mode === 'step') {
      setCurrentCode(currentCode);
      // Use setTimeout to ensure caret is set after Monaco processes the content change
      setTimeout(() => {
        setCurrentCaretPosition(currentCaretPosition);
      }, 0);

      // Only set input values in step mode, not replay mode where animation handles it
      setNewFileInputValue(fileExplorerSnapshot.newFileInputValue);
      setNewFolderInputValue(fileExplorerSnapshot.newFolderInputValue);

      // Handle scroll actions for step mode after state update
      setTimeout(() => {
        handleStepModeScrollActions();
      }, 0); // Execute on next tick to ensure editor is ready

      // Only update mouse position in step mode, not in replay mode
      // This prevents double mouse movement animations in replay mode
      updateMouseStateAndSideEffects(actions);
    }

    setTerminalBuffer(currentTerminalBuffer);
    setCaptionText(captionText);
    setIsFileExplorerContextMenuVisible(fileExplorerSnapshot.isFileExplorerContextMenuOpen);
    setIsFileContextMenuVisible(fileExplorerSnapshot.isFileContextMenuOpen);
    setIsFolderContextMenuVisible(fileExplorerSnapshot.isFolderContextMenuOpen);
    setIsNewFileInputVisible(fileExplorerSnapshot.isNewFileInputVisible);
    setIsNewFolderInputVisible(fileExplorerSnapshot.isNewFolderInputVisible);
    setOriginalFileBeingRenamed(fileExplorerSnapshot.originalFileBeingRenamed);
    setOriginalFolderBeingRenamed(fileExplorerSnapshot.originalFolderBeingRenamed);
    setCurrentHoveredFileName(mouseSnapshot.currentHoveredFileName);
    setCurrentHoveredFolderName(mouseSnapshot.currentHoveredFolderName);
    setNewFileParentPath(fileExplorerSnapshot.newFileParentPath);
    setNewFolderParentPath(fileExplorerSnapshot.newFolderParentPath);
    setCurrentHoveredEditorTabFileName(mouseSnapshot.currentHoveredEditorTabFileName);
    setIsUnsavedChangesDialogOpen(isUnsavedChangesDialogOpen);
    setUnsavedFileName(unsavedFileName);
  }

  return { updateState };
};
