import { useEffect, useRef } from 'react';
import { GUIMode, IAction, IPoint, Project } from '@fullstackcraftllc/codevideo-types';
import * as monaco from 'monaco-editor';
import { executeActionPlaybackForMonacoInstance } from '../utils/executeActionPlaybackForMonacoInstance.js';
import { getActionAtIndex } from '../utils/extractActions.js';
import { sleep } from '../utils/sleep.js';
import { debugLog } from '../utils/debugLog.js';

export interface UseReplayPlaybackParams {
  mode: GUIMode;
  project: Project;
  currentActionIndex: number;
  currentLessonIndex: number | null;

  // from useStableActions - the epoch-stable view over the actions
  actions: Array<IAction>;
  actionsEpoch: number;
  hasActionAtCurrentIndex: boolean;

  /**
   * Streaming mode: when playback runs out of actions, idle and wait for more
   * instead of calling playBackCompleteCallback. When the producer is done,
   * the consumer sets this back to false and a still-starved playback then
   * completes normally. Default false = legacy completion semantics.
   */
  isStreaming: boolean;

  isSoundOn: boolean;
  speakActionAudios: Array<{ text: string; mp3Url: string }>;

  monacoEditorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  targetMousePosition: IPoint;

  setEditors: (value: any) => void;
  setCurrentEditor: (value: any) => void;
  setCurrentFileName: (value: any) => void;
  setCurrentCode: (value: any) => void;
  setCurrentCaretPosition: (value: any) => void;
  setTerminalBuffer: (value: any) => void;
  setTargetMousePosition: (value: any) => void;
  setCaptionText: (value: any) => void;
  setNewFileInputValue: React.Dispatch<React.SetStateAction<string>>;
  setNewFolderInputValue: React.Dispatch<React.SetStateAction<string>>;
  setRenameFileInputValue: React.Dispatch<React.SetStateAction<string>>;
  setRenameFolderInputValue: React.Dispatch<React.SetStateAction<string>>;
  setCurrentExternalBrowserScrollPosition: React.Dispatch<React.SetStateAction<number>>;

  keyboardTypingPauseMs: number;
  standardPauseMs: number;
  longPauseMs: number;

  /** Full state reconstitution (lives in the component until its own extraction step). */
  updateState: () => void;
  actionFinishedCallback?: () => void;
  playBackCompleteCallback?: () => void;
}

/**
 * Owns the replay-mode playback loop: which action animates, when, and exactly
 * once per (content epoch, action index).
 *
 * Why the guard machinery exists: the legacy effect depended on `project`, so
 * any new array reference - in particular every append from a streaming
 * producer - re-fired the effect at the SAME index and restarted the
 * animation (with overlapping un-cancelled async runs). The deps below change
 * only when something playback-relevant changes:
 *   - `actionsEpoch` bumps only on non-append content changes (reset),
 *   - `hasActionAtCurrentIndex` flips when a starved index becomes available.
 *
 * Guard design (do not "simplify" - each piece covers a real case):
 *   - lastStartedKeyRef: single most-recent `${epoch}:${index}` that STARTED
 *     animating. A single key, not a Set: seeking 5 -> 4 -> 5 must re-animate 5.
 *   - pendingTimerRef: index 0's 1s initial delay, claim-on-fire. The key is
 *     claimed when the timeout FIRES, not when scheduled, and the effect
 *     cleanup cancels only a still-pending timer. Under React StrictMode's
 *     mount -> cleanup -> remount, invocation 1's timer is cancelled and
 *     invocation 2 schedules cleanly: exactly one animation. (Claiming before
 *     scheduling + clearTimeout in cleanup deadlocks: the timer is cancelled
 *     but the guard says "already handled" and playback never starts.)
 *   - runIdRef: bumped on epoch change / replay exit. applyAnimation captures
 *     it at entry and re-checks before mutating state or signalling the
 *     parent, so a mid-animation reset cannot advance the index afterwards.
 */
export const useReplayPlayback = (params: UseReplayPlaybackParams): void => {
  const {
    mode,
    project,
    currentActionIndex,
    currentLessonIndex,
    actions,
    actionsEpoch,
    hasActionAtCurrentIndex,
    isStreaming,
    isSoundOn,
    speakActionAudios,
    monacoEditorRef,
    containerRef,
    targetMousePosition,
    setEditors,
    setCurrentEditor,
    setCurrentFileName,
    setCurrentCode,
    setCurrentCaretPosition,
    setTerminalBuffer,
    setTargetMousePosition,
    setCaptionText,
    setNewFileInputValue,
    setNewFolderInputValue,
    setRenameFileInputValue,
    setRenameFolderInputValue,
    setCurrentExternalBrowserScrollPosition,
    keyboardTypingPauseMs,
    standardPauseMs,
    longPauseMs,
    updateState,
    actionFinishedCallback,
    playBackCompleteCallback,
  } = params;

  const lastStartedKeyRef = useRef<string | null>(null);
  const pendingTimerRef = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const runIdRef = useRef<number>(0);
  const lastEpochRef = useRef<number>(actionsEpoch);

  const applyAnimation = async () => {
    const runId = runIdRef.current;

    debugLog("[applyAnimation] Starting animation for action index:", currentActionIndex, "in lesson index:", currentLessonIndex);
    debugLog("[applyAnimation] Extracted actions for current lesson:", actions.length, "actions.");

    // If we don't have any actions, it likely means the project isn't fully loaded yet
    if (actions.length === 0) {
      debugLog("[applyAnimation] No actions found - project may not be fully loaded yet. Skipping animation.");
      return;
    }

    const currentAction = getActionAtIndex(actions, currentActionIndex);

    if (!currentAction) {
      debugLog("[applyAnimation] No current action found, calling playback complete callback.");
      playBackCompleteCallback && playBackCompleteCallback();
      return;
    }

    debugLog("[applyAnimation] About to execute action:", currentAction.name, "with value:", currentAction.value?.substring(0, 100) + '...');

    if (monacoEditorRef.current) {
      await executeActionPlaybackForMonacoInstance(
        monacoEditorRef.current,
        project,
        currentActionIndex,
        currentLessonIndex,
        currentAction,
        isSoundOn,
        setEditors,
        setCurrentEditor,
        setCurrentFileName,
        setCurrentCode,
        setCurrentCaretPosition,
        setTerminalBuffer,
        targetMousePosition,
        containerRef,
        setTargetMousePosition,
        setCaptionText,
        speakActionAudios,
        setNewFileInputValue,
        setNewFolderInputValue,
        setRenameFileInputValue,
        setRenameFolderInputValue,
        keyboardTypingPauseMs,
        standardPauseMs,
        longPauseMs
      );

      // Handle external browser scroll actions in replay mode
      if (currentAction.name === "external-browser-scroll") {
        const scrollPosition = parseInt(currentAction.value) || 0;
        setCurrentExternalBrowserScrollPosition(scrollPosition);
        await sleep(standardPauseMs);
      }
    }

    // staleness seam: a reset (epoch change / mode exit) during the animation
    // means this run must neither smear stale state nor advance the parent
    if (runIdRef.current !== runId) {
      debugLog("[applyAnimation] Run invalidated during animation, skipping state update and callback.");
      return;
    }
    updateState();
    if (runIdRef.current !== runId) {
      return;
    }
    actionFinishedCallback && actionFinishedCallback();
  };

  useEffect(() => {
    debugLog("[useReplayPlayback] Triggered with:", { mode, currentActionIndex, actionsEpoch, hasActionAtCurrentIndex });

    // a content reset invalidates any in-flight animation and all guards
    if (lastEpochRef.current !== actionsEpoch) {
      lastEpochRef.current = actionsEpoch;
      runIdRef.current += 1;
      lastStartedKeyRef.current = null;
    }

    if (mode !== 'replay') {
      // leaving replay invalidates guards so re-entering animates from scratch
      runIdRef.current += 1;
      lastStartedKeyRef.current = null;

      // normal step by step mode - can update state immediately
      if (mode === 'step') {
        // Don't proceed if project is empty (not loaded yet)
        if (!project || (Array.isArray(project) && project.length === 0)) {
          debugLog("[useReplayPlayback] Project is empty or not loaded yet, skipping update");
          return;
        }
        updateState();
      }
      return;
    }

    // replay mode from here on

    if (actions.length === 0) {
      // project not loaded yet - idle, never complete
      debugLog("[useReplayPlayback] No actions found in project - waiting for project to be loaded");
      return;
    }

    if (!hasActionAtCurrentIndex) {
      if (isStreaming) {
        // starved mid-stream: idle without claiming the guard key, so the
        // index animates as soon as an append makes it available (the
        // hasActionAtCurrentIndex dep flips and re-fires this effect)
        debugLog("[useReplayPlayback] Starved at index", currentActionIndex, "while streaming - waiting for more actions");
        return;
      }
      // past the end of the available actions: legacy completion semantics
      debugLog("[useReplayPlayback] No current action at index", currentActionIndex, "- calling playback complete callback");
      playBackCompleteCallback && playBackCompleteCallback();
      return;
    }

    const key = `${actionsEpoch}:${currentActionIndex}`;
    if (lastStartedKeyRef.current === key || pendingTimerRef.current?.key === key) {
      // this exact action already animated (or is scheduled) for this content
      // epoch - e.g. a StrictMode double-invoke or a spurious re-render
      debugLog("[useReplayPlayback] Action", key, "already started/scheduled, skipping");
      return;
    }

    // need to handle the first reset - ensure initial state is properly established
    if (currentActionIndex === 0) {
      debugLog("[useReplayPlayback] First action (index 0) in replay mode, updating state first");
      updateState();
      // Don't start animation immediately for the first action: allow the
      // initial state to be rendered before starting animations
      const timer = setTimeout(() => {
        // claim-on-fire (see guard design note above)
        pendingTimerRef.current = null;
        lastStartedKeyRef.current = key;
        debugLog("[useReplayPlayback] Initial 1s timeout expired, calling applyAnimation");
        applyAnimation();
      }, 1000);
      pendingTimerRef.current = { key, timer };
      return () => {
        // cancel only a scheduled-but-not-yet-started initial animation
        if (pendingTimerRef.current?.timer === timer) {
          clearTimeout(timer);
          pendingTimerRef.current = null;
        }
      };
    }

    // normal animation flow (non-first action): claim-on-start
    lastStartedKeyRef.current = key;
    applyAnimation();
  }, [mode, currentActionIndex, actionsEpoch, hasActionAtCurrentIndex, isStreaming]);
};
