import { getEditorModelPath } from './getEditorModelPath.js';
import { moveEditorSelection } from './editorSelection.js';
import { Project, IAction, IPoint, IAudioItem, RenderMode, isSteppableAction, isRepeatableAction } from "@fullstackcraftllc/codevideo-types";
import { KEYBOARD_TYPING_PAUSE_MS, STANDARD_PAUSE_MS, LONG_PAUSE_MS } from "src/constants/CodeVideoIDEConstants";
import { getNewMousePosition } from "src/MouseOverlay/utils/getNewMousePosition";
import { reconstituteAllPartsOfState } from "./reconstituteAllPartsOfState";
import { sleep } from "./sleep";
import { speakText } from "./speakText";
import { simulateHumanTypingWithReactSetterCallback } from "./simulateHumanTypingWithReactSetterCallback";
import { simulateHumanTypingInMonaco } from "./simulateHumanTypingInMonaco";
import type * as monaco from 'monaco-editor';
import { debugLog, debugWarn } from './debugLog.js';

/**
 * Everything executeActionPlaybackForMonacoInstance needs to animate one
 * action against a live Monaco instance. Replaces the former 24 positional
 * parameters; the execution body is unchanged.
 */
import { createActionRandom } from './deterministicRandom.js';
import { RenderCallbacks } from '../rendering/types.js';

import { executePlaybackSteps } from '../playback/executePlaybackSteps.js';
import { monacoTarget, textTarget } from '../playback/targets.js';
import { PlaybackStopped } from '../playback/types.js';
import type { PlaybackContinuation } from '../playback/types.js';

export interface IPlaybackContext extends RenderCallbacks {
  includeTypos?: boolean;
  keyboardTypingJitterMs?: number;
  continuation?: PlaybackContinuation | null;
  checkpointStep?: (cursor: PlaybackContinuation) => Promise<boolean>;
  cancelled?: () => boolean;
  typingValues?: Record<string, string>;
  renderMode?: RenderMode;
  renderSeed?: string;
  editor: monaco.editor.IStandaloneCodeEditor;
  project: Project;
  currentActionIndex: number;
  currentLessonIndex: number | null;
  action: IAction;
  isSoundOn: boolean;
  setEditors: (value: any) => void;
  setCurrentEditor: (value: any) => void;
  setCurrentFileName: (value: any) => void;
  setCurrentCode: (value: any) => void;
  setCurrentCaretPosition: (value: any) => void;
  setTerminalBuffer: (value: any) => void;
  mousePosition: IPoint;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setMousePosition: (value: any) => void;
  setCaptionText: (value: any) => void;
  speakActionAudios: Array<IAudioItem>;
  setNewFileInputValue: React.Dispatch<React.SetStateAction<string>>;
  setNewFolderInputValue: React.Dispatch<React.SetStateAction<string>>;
  setRenameFileInputValue: React.Dispatch<React.SetStateAction<string>>;
  setRenameFolderInputValue: React.Dispatch<React.SetStateAction<string>>;
  keyboardTypingPauseMs?: number;
  standardPauseMs?: number;
  longPauseMs?: number;
}

export const executeActionPlaybackForMonacoInstance = async (context: IPlaybackContext) => {
  const {
    editor,
    renderMode = 'realtime', renderSeed = 'codevideo', onRenderEvent,
    project,
    currentActionIndex,
    currentLessonIndex,
    action,
    isSoundOn,
    setEditors,
    setCurrentEditor,
    setCurrentFileName,
    setCurrentCode,
    setCurrentCaretPosition,
    setTerminalBuffer,
    mousePosition,
    containerRef,
    setMousePosition,
    setCaptionText,
    speakActionAudios,
    setNewFileInputValue,
    setNewFolderInputValue,
    setRenameFileInputValue,
    setRenameFolderInputValue,
    keyboardTypingPauseMs = KEYBOARD_TYPING_PAUSE_MS,
    standardPauseMs = STANDARD_PAUSE_MS,
    longPauseMs = LONG_PAUSE_MS,
  } = context;
  let startTime = -1;

  if (!context.continuation) {
  const { editors, currentEditor, currentFilename, currentCaretPosition, currentCode } = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex);


  // OPEN FILE ANIMATION, STATE NEEDS TO BE SET HERE BEFORE TYPING OR WE ALWAYS TYPE ONE CHARACTER TOO LATE
  switch (action.name) {
    case 'file-explorer-open-file':
      debugLog("SET CURRENT FILE to ", action.value)
      setEditors(editors);
      setCurrentEditor(currentEditor);
      setCurrentFileName(currentFilename);
      setCurrentCode(currentCode);
      setCurrentCaretPosition(currentCaretPosition);
      
      // Only initialize the target model. React has not switched away from the
      // previous file yet; writing into that model would corrupt its content/selection.
      const model = editor.getModel();
      if (model && model.uri.toString() === getEditorModelPath(currentFilename) && model.getValue() !== currentCode) {
        model.setValue(currentCode);
      }
      break;
    // for this we actually only need to set when clicking on a file...
    case 'mouse-left-click':
      // if we are clicking on a file, we need to set the editor content to the current
      setCurrentCode(currentCode);
      
      // Also immediately set Monaco editor content for replay mode
      const clickModel = editor.getModel();
      if (clickModel && clickModel.uri.toString() === getEditorModelPath(currentFilename) && clickModel.getValue() !== currentCode) {
        clickModel.setValue(currentCode);
      }
      break;
  }

  // before continuing, wait a little bit so file explorer can update the DOM
  // TODO: how can we do this properly without needing a hardcode sleep?
  // NEED TO DO THIS OR WE GET COORDINATE FINDING ISSUES WITH THE MOUSE
  await sleep(standardPauseMs);

  // MOUSE MOVEMENT ANIMATIONS, PASS THROUGH AND CONTINUE BELOW
  const newPosition = getNewMousePosition(mousePosition, action, containerRef, renderMode === 'deterministic' ? createActionRandom(renderSeed, currentActionIndex, 'mouse-target', currentLessonIndex) : Math.random);
  
  // Safety check before setting mouse position
  if (newPosition && newPosition.x !== undefined && newPosition.y !== undefined && 
      !isNaN(newPosition.x) && !isNaN(newPosition.y)) {
    setMousePosition(newPosition);
  } else {
    debugWarn('Invalid mouse position from getNewMousePosition, keeping current position:', newPosition);
  }

  }
  if (context.cancelled?.()) throw new PlaybackStopped();
  if (isSteppableAction(action) && (renderMode === 'deterministic' || context.includeTypos || context.keyboardTypingJitterMs)) {
    const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      'terminal-type': setTerminalBuffer,
      'file-explorer-type-new-file-input': setNewFileInputValue,
      'file-explorer-type-new-folder-input': setNewFolderInputValue,
      'file-explorer-type-rename-file-input': setRenameFileInputValue,
      'file-explorer-type-rename-folder-input': setRenameFolderInputValue,
    };
    await executePlaybackSteps({
      action,
      settings: { seed: renderSeed, lessonIndex: currentLessonIndex, actionIndex: currentActionIndex,
        baseDelayMs: keyboardTypingPauseMs, jitterMs: context.keyboardTypingJitterMs ?? 0, includeTypos: context.includeTypos ?? false },
      target: action.name === 'editor-type' ? monacoTarget(editor)
        : textTarget(() => context.typingValues?.[action.name] ?? '', setters[action.name] ?? (() => {})),
      continuation: context.continuation, checkpoint: context.checkpointStep, cancelled: context.cancelled,
    });
    return startTime;
  }

  // (highlightText helper graveyarded: findNextMatch/monaco.Range break SSR - see docs/MONACO_QUIRKS.md #1)

  // Repeatable actions use their declared key count; other actions run once.
  const times = isRepeatableAction(action) ? parseInt(action.value, 10) : 1;

  for (let i = 0; i < times; i++) {
    if (context.cancelled?.()) throw new PlaybackStopped();
    // actual logic
    switch (true) {
      case action.name.startsWith("external-"):
      case action.name.startsWith("slides-"):
        // no op - but do a long pause
        // await sleep(longPauseMs);
        break;
      // AUTHOR ACTIONS
      case action.name === "author-speak-before":
      case action.name === "author-speak-during":
      case action.name === "author-speak-after":
        setCaptionText(action.value);
        if (renderMode === 'deterministic') {
          const audio = speakActionAudios.find(a => a.actionIndex === currentActionIndex)
            ?? speakActionAudios.find(a => a.actionIndex === undefined && a.text === action.value);
          if (!audio?.assetId || !Number.isFinite(audio.durationMs) || audio.durationMs! <= 0) {
            throw new Error(`Missing prepared speech asset at action ${currentActionIndex}`);
          }
          onRenderEvent?.({ type: 'speech', actionIndex: currentActionIndex, name: action.name, text: action.value, timestampMs: performance.now(), durationMs: audio.durationMs!, assetId: audio.assetId });
          if (action.name !== 'author-speak-during') await sleep(audio.durationMs!);
          break;
        }
        // try to find a matching mp3 url by matching the text of it to action.value in the speakActionAudios array
        const mp3Url = speakActionAudios.find((audio) => audio.text === action.value)?.mp3Url;

        // Handle different types of author actions
        if (action.name === "author-speak-during") {
          // Fire and forget - don't await
          speakText(action.value, isSoundOn ? 1 : 0, mp3Url);
        } else {
          // Default behavior for author-speak-before and other author actions - await completion
          await speakText(action.value, isSoundOn ? 1 : 0, mp3Url);
        }
        break;
      case action.name === "author-wait":
        // Wait for the specified duration
        const waitDuration = parseInt(action.value) || 1000; // Default to 1000ms if parsing fails
        debugLog(`Waiting for ${waitDuration}ms`);
        await sleep(waitDuration);
        break;
      // BEGIN FILE EXPLORER TYPING ACTIONS
      case action.name === "file-explorer-type-new-file-input":
        if (renderMode === 'deterministic') await simulateHumanTypingWithReactSetterCallback(setNewFileInputValue, action.value, keyboardTypingPauseMs);
        else void simulateHumanTypingWithReactSetterCallback(setNewFileInputValue, action.value, keyboardTypingPauseMs);
        break;
      case action.name === "file-explorer-enter-new-file-input":
        setNewFileInputValue("")
        break;
      case action.name === "file-explorer-type-new-folder-input":
        if (renderMode === 'deterministic') await simulateHumanTypingWithReactSetterCallback(setNewFolderInputValue, action.value, keyboardTypingPauseMs);
        else void simulateHumanTypingWithReactSetterCallback(setNewFolderInputValue, action.value, keyboardTypingPauseMs);
        break;
      case action.name === "file-explorer-enter-new-folder-input":
        setNewFolderInputValue("")
        break;
      case action.name === "file-explorer-type-rename-file-input":
        if (renderMode === 'deterministic') await simulateHumanTypingWithReactSetterCallback(setRenameFileInputValue, action.value, keyboardTypingPauseMs);
        else void simulateHumanTypingWithReactSetterCallback(setRenameFileInputValue, action.value, keyboardTypingPauseMs);
        break;
      case action.name === "file-explorer-enter-rename-file-input":
        setRenameFileInputValue("")
        break;
      case action.name === "file-explorer-type-rename-folder-input":
        if (renderMode === 'deterministic') await simulateHumanTypingWithReactSetterCallback(setRenameFolderInputValue, action.value, keyboardTypingPauseMs);
        else void simulateHumanTypingWithReactSetterCallback(setRenameFolderInputValue, action.value, keyboardTypingPauseMs);
        break;
      case action.name === "file-explorer-enter-rename-folder-input":
        setRenameFolderInputValue("")
        break;
      // BEGIN TERMINAL ACTIONS
      case action.name === 'terminal-type':
        const terminalOutput = action.value;
        const terminalLines = terminalOutput.split('\n');
        const latestLine = terminalLines[terminalLines.length - 1];
        if (latestLine) {
          // loop at character level to simulate typing
          for (let i = 0; i < latestLine.length; i++) {
            setTerminalBuffer((prev: string) => prev + latestLine[i]);
            await sleep(keyboardTypingPauseMs)
          }
        }
        break;
      // BEGIN EDITOR ACTIONS
      case action.name === "editor-arrow-down":
      case action.name === "editor-arrow-up":
      case action.name === "editor-arrow-left":
      case action.name === "editor-arrow-right":
      case action.name === "editor-shift+arrow-right":
      case action.name === "editor-shift+arrow-left":
      case action.name === "editor-shift+arrow-up":
      case action.name === "editor-shift+arrow-down":
      case action.name === "editor-command+shift+arrow-right":
      case action.name === "editor-command+shift+arrow-left":
      case action.name === "editor-shift+end":
      case action.name === "editor-shift+home":
      case action.name === "editor-command-left":
      case action.name === "editor-command-right":
        moveEditorSelection(editor, action.name);
        await sleep(keyboardTypingPauseMs);
        break;
      case action.name === "editor-tab":
        await simulateHumanTypingInMonaco(editor, "\t", keyboardTypingPauseMs);
        break;
      case action.name === "editor-enter":
        await simulateHumanTypingInMonaco(editor, "\n", keyboardTypingPauseMs);
        break;
      // (editor-delete-line graveyarded: monaco.Range breaks SSR - see docs/MONACO_QUIRKS.md #2)
      // (editor-highlight-code graveyarded - see docs/MONACO_QUIRKS.md #1)
      case action.name === "editor-space":
        await simulateHumanTypingInMonaco(editor, " ", keyboardTypingPauseMs);
        break;
      case action.name === "editor-backspace":
        editor.trigger('codevideo', 'deleteLeft', null);
        await sleep(keyboardTypingPauseMs);
        break;
      case action.name === "editor-type":
        await simulateHumanTypingInMonaco(editor, action.value, keyboardTypingPauseMs);
        break;
      // EDITOR SCROLL ACTIONS
      case action.name === "editor-scroll-up":
        const scrollUpDistance = parseInt(action.value) || 3; // Default to 3 lines
        // Smooth scroll animation for replay mode
        const currentLine = editor.getPosition()?.lineNumber || 1;
        const targetLine = Math.max(1, currentLine - scrollUpDistance);

        // Use Monaco's smooth reveal animation
        editor.revealLineInCenterIfOutsideViewport(targetLine);
        await sleep(standardPauseMs); // Small delay for animation
        break;
      case action.name === "editor-scroll-down":
        const scrollDownDistance = parseInt(action.value) || 3; // Default to 3 lines
        // Smooth scroll animation for replay mode
        const currentLineDown = editor.getPosition()?.lineNumber || 1;
        const targetLineDown = currentLineDown + scrollDownDistance;

        // Use Monaco's smooth reveal animation
        editor.revealLineInCenterIfOutsideViewport(targetLineDown);
        await sleep(standardPauseMs); // Small delay for animation
        break;
      case action.name.startsWith("mouse-move-"):
        // do the standard delay for mouse movement - padded with 300ms so it allows time for the animation to complete
        await sleep(standardPauseMs + 300);
        break;
      default:
        // no op - but still do default delay
        // await sleep(standardPauseMs);
        debugWarn("Unable to apply action", JSON.stringify(action));
        break;
    }
  }
  return startTime;
};
