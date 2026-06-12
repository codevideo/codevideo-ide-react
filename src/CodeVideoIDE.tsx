import React from 'react';
import { Editor } from '@monaco-editor/react';
import { Box, Flex } from '@radix-ui/themes';
// TODO: add multiple theme support later
// import Monokai from "monaco-themes/themes/Monokai.json";

// types
import { ICodeVideoIDEProps } from '@fullstackcraftllc/codevideo-types';

// editor tabs
import { EditorTabs } from './Editor/EditorTabs.jsx';

// external web viewer
import { ExternalWebViewer } from './ExternalWebViewer/ExternalWebViewer.jsx';

// File explorer
import { FileExplorer } from './FileExplorer/FileExplorer.jsx';

// Terminal
import { Terminal } from './Terminal/Terminal.jsx';

// MouseOverlay
import { MouseOverlay } from './MouseOverlay/MouseOverlay.jsx';

// CaptionOverlay
import { CaptionOverlay } from './CaptionOverlay/CaptionOverlay.jsx';

// embed overlay
import { EmbedOverlay } from './EmbedOverlay/EmbedOverlay.jsx';

// unsaved changes dialog
import { UnsavedChangesDialog } from './UnsavedChangesDialog/UnsavedChangesDialog.jsx';

// dev box
import { DevBox } from './DevBox/DevBox.jsx';

// slide viewer
import { SlideViewer } from './SlideViewer/SlideViewer.jsx';

// web preview
import { WebPreview } from './WebPreview/WebPreview.jsx';

// util functions
import { setDebugLogging } from './utils/debugLog.js';

// ids and constants
import { CODEVIDEO_IDE_ID, KEYBOARD_TYPING_PAUSE_MS, LONG_PAUSE_MS, STANDARD_PAUSE_MS } from './constants/CodeVideoIDEConstants.js';
import { EDITOR_AREA_ID, EDITOR_ID } from './constants/CodeVideoDataIds.js';

// hooks
import { useStableActions } from './hooks/useStableActions.js';
import { useReplayPlayback } from './hooks/useReplayPlayback.js';
import { useTerminalCaret } from './hooks/useTerminalCaret.js';
import { useSpeechOnStep } from './hooks/useSpeechOnStep.js';
import { useEmbedKeyboard } from './hooks/useEmbedKeyboard.js';
import { useOverlayDisplay } from './hooks/useOverlayDisplay.js';
import { useStepModeState } from './hooks/useStepModeState.js';
import { useCodeVideoIDEState } from './state/useCodeVideoIDEState.js';
import { useMonacoModelManagement } from './hooks/useMonacoModelManagement.js';

/**
 * Props for CodeVideoIDE: everything from codevideo-types' ICodeVideoIDEProps
 * plus locally-added flags (to be upstreamed to codevideo-types later).
 */
export interface CodeVideoIDEProps extends ICodeVideoIDEProps {
  /**
   * Streaming mode (e.g. actions generated live by an LLM): appends to the
   * actions array continue playback seamlessly, and when playback runs out of
   * actions it idles instead of calling playBackCompleteCallback. Set this
   * back to false once the stream ends to get normal completion semantics.
   * Default false = exact legacy behavior.
   */
  isStreaming?: boolean;
  /** Enable the component's verbose internal console logging. Default false. */
  debug?: boolean;
}

/**
 * Represents a powerful IDE with file explorer, multiple editors, and terminal
 * @param props
 * @returns
 */
export function CodeVideoIDE(props: CodeVideoIDEProps) {
  const {
    theme,
    project,
    mode,
    allowFocusInEditor,
    defaultLanguage,
    currentActionIndex,
    currentLessonIndex,
    isSoundOn,
    withCaptions,
    actionFinishedCallback,
    playBackCompleteCallback,
    speakActionAudios,
    fileExplorerWidth,
    terminalHeight,
    mouseColor,
    fontSizePx,
    monacoLoadedCallback,
    isEmbedMode,
    requestStepModeCallback,
    requestNextActionCallback,
    requestPreviousActionCallback,
    requestPlaybackStartCallback,
    isFileExplorerVisible = true,
    isTerminalVisible = true,
    keyboardTypingPauseMs = KEYBOARD_TYPING_PAUSE_MS,
    standardPauseMs = STANDARD_PAUSE_MS,
    longPauseMs = LONG_PAUSE_MS,
    resolution = '1080p',
    showDevBox = false,
    isStreaming = false,
    debug = false
  } = props;
  // module-level log gate; set during render so even render-scope logging is
  // covered. Idempotent, so safe under StrictMode double-renders.
  setDebugLogging(debug);
  const isRecording = mode === 'record'
  // all mutable state and refs, en bloc (called first - see hook doc)
  const {
    editors, setEditors,
    currentEditor, setCurrentEditor,
    currentFileName, setCurrentFileName,
    currentFileStructure, setCurrentFileStructure,
    currentCode, setCurrentCode,
    terminalBuffer, setTerminalBuffer,
    targetMousePosition, setTargetMousePosition,
    currentMousePosition, setCurrentMousePosition,
    currentCaretPosition, setCurrentCaretPosition,
    captionText, setCaptionText,
    currentEditorLanguage, setCurrentEditorLanguage,
    isFileExplorerContextMenuVisible, setIsFileExplorerContextMenuVisible,
    isFileContextMenuVisible, setIsFileContextMenuVisible,
    isFolderContextMenuVisible, setIsFolderContextMenuVisible,
    isNewFileInputVisible, setIsNewFileInputVisible,
    isNewFolderInputVisible, setIsNewFolderInputVisible,
    newFileInputValue, setNewFileInputValue,
    newFolderInputValue, setNewFolderInputValue,
    originalFileBeingRenamed, setOriginalFileBeingRenamed,
    originalFolderBeingRenamed, setOriginalFolderBeingRenamed,
    renameFileInputValue, setRenameFileInputValue,
    renameFolderInputValue, setRenameFolderInputValue,
    currentHoveredFileName, setCurrentHoveredFileName,
    currentHoveredFolderName, setCurrentHoveredFolderName,
    newFileParentPath, setNewFileParentPath,
    newFolderParentPath, setNewFolderParentPath,
    currentHoveredEditorTabFileName, setCurrentHoveredEditorTabFileName,
    isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen,
    unsavedFileName, setUnsavedFileName,
    currentExternalBrowserScrollPosition, setCurrentExternalBrowserScrollPosition,
    containerRef,
    monacoEditorRef,
    globalMonacoRef,
    editorViewStateRef,
    isRestoringViewStateRef,
  } = useCodeVideoIDEState(defaultLanguage);

  // for cleanup TODO
  // const modelUrisRef = useRef<Set<string>>(new Set());
  // const prevMode = useRef<GUIMode>(mode);
  // const isInitialMount = useRef(true);

  // single source of action extraction for the whole component; the epoch only
  // changes on non-append content changes (see useStableActions)
  const { actions: stableActions, actionsEpoch, currentAction: stableCurrentAction, hasActionAtCurrentIndex } = useStableActions(project, currentLessonIndex, currentActionIndex);

  // Handle scroll actions for step mode
  // step-mode state derivation: reconstitutes the full VirtualIDE snapshot at
  // the current index and distributes it into component state
  const { updateState } = useStepModeState({
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
  });

  // slide / web-preview / external-browser overlay routing, including
  // continuation through author actions when stepping forward
  const {
    isSlideDisplayStep,
    slideMarkdown,
    isExternalWebPreviewDisplayStep,
    webPreviewFilesState,
    isExternalBrowserDisplayStep,
    externalBrowserStepUrlState,
  } = useOverlayDisplay({
    project,
    mode,
    currentAction: stableCurrentAction,
    currentActionIndex,
    actions: stableActions,
    actionsEpoch,
    currentLessonIndex,
  });

  // terminal block caret: on for 2s after any terminal action
  const showBlockCaret = useTerminalCaret({
    project,
    currentAction: stableCurrentAction,
    currentActionIndex,
    actionsEpoch,
    currentLessonIndex,
  });

  // step-mode speech: speak the current author action when sound is on
  useSpeechOnStep({
    project,
    mode,
    isSoundOn,
    currentAction: stableCurrentAction,
    currentActionIndex,
    actionsEpoch,
    currentLessonIndex,
    speakActionAudios,
  });

  // the replay playback loop: animates the current action exactly once per
  // (content epoch, index), handles the 1s initial delay, and signals the
  // parent via actionFinishedCallback / playBackCompleteCallback. In step
  // mode it updates state immediately. Appends to a streamed actions array
  // do NOT re-trigger it (see useStableActions).
  useReplayPlayback({
    mode,
    project,
    currentActionIndex,
    currentLessonIndex,
    actions: stableActions,
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
  });

  // everything that talks to Monaco directly: mount wiring, caret
  // positioning, view-state preservation across overlays, model
  // creation/switching, language sync. Timing hacks preserved verbatim -
  // see the hook's doc comment before touching.
  const { handleEditorDidMount } = useMonacoModelManagement({
    mode,
    allowFocusInEditor,
    currentEditor,
    currentFileName,
    currentCode,
    currentCaretPosition,
    isSlideDisplayStep,
    isExternalWebPreviewDisplayStep,
    isExternalBrowserDisplayStep,
    monacoEditorRef,
    globalMonacoRef,
    editorViewStateRef,
    isRestoringViewStateRef,
    setCurrentEditorLanguage,
    monacoLoadedCallback,
  });

  // if embedMode is 'true', we use space bar to request playback, left arrow to request previous frame, and right arrow to request next frame
  const showEmbedOverlay = useEmbedKeyboard({
    isEmbedMode,
    requestStepModeCallback,
    requestNextActionCallback,
    requestPreviousActionCallback,
    requestPlaybackStartCallback,
  });

  // useful for debugging
  // // before rendering log out all relevant stuff
  // // current file
  // console.log('currentFile', currentFile);
  // // current file structure
  // console.log('currentFileStructure', currentFileStructure);
  // // current code
  console.log('currentCode', currentCode);
  // // terminal buffer
  // console.log('terminalBuffer', terminalBuffer);
  // // mouse position
  // console.log('mousePosition', mousePosition);
  // // current caret position
  // console.log('currentCaretPosition', currentCaretPosition);
  // // caption text
  // console.log('captionText', captionText);
  // current filepath
  // console.log("currentFileName", currentFileName)
  // console.log("isUnsavedChangesDialogOpen", isUnsavedChangesDialogOpen)
  // console.log("unsavedFileName", unsavedFileName)

  // if we are in 4k mode, double the fontsize
  const renderFontSizePx = fontSizePx && resolution === "4K" ? fontSizePx * 2 : fontSizePx

  // Use state variables for web preview and external browser display
  // These are now managed by the useEffect above to support continuation during author actions
  const webPreviewFiles = webPreviewFilesState;
  const externalBrowserStepUrl = externalBrowserStepUrlState;
  const extractedActions = stableActions;
  const currentAction = stableCurrentAction;

  return (
    <Flex
      direction="column"
      style={{
        height: '100%',
        width: '100%',
        fontSize: renderFontSizePx ? `${renderFontSizePx}px` : undefined,
        // necessary so embed overlay can be positioned absolutely
        position: 'relative'
      }}
      id={CODEVIDEO_IDE_ID}>
      <Flex direction="row"
        style={{
          height: '100%',
          // borderTopLeftRadius: 'var(--radius-3)',
          // borderTopRightRadius: 'var(--radius-3)',
          overflow: 'hidden',
          // necessary so mouse overlay can be positioned absolutely
          position: 'relative',
        }}
        ref={containerRef}
      >
        {/* Always render the IDE components */}
        {isFileExplorerVisible && <FileExplorer
          theme={theme}
          currentFileName={currentFileName}
          fileStructure={currentFileStructure}
          fileExplorerWidth={fileExplorerWidth}
          currentMousePosition={currentMousePosition}
          isFileExplorerContextMenuVisible={isFileExplorerContextMenuVisible}
          isFileContextMenuVisible={isFileContextMenuVisible}
          isFolderContextMenuVisible={isFolderContextMenuVisible}
          isNewFileInputVisible={isNewFileInputVisible}
          isNewFolderInputVisible={isNewFolderInputVisible}
          newFileInputValue={newFileInputValue}
          newFolderInputValue={newFolderInputValue}
          originalFileBeingRenamed={originalFileBeingRenamed}
          originalFolderBeingRenamed={originalFolderBeingRenamed}
          renameFileInputValue={renameFileInputValue}
          renameFolderInputValue={renameFolderInputValue}
          currentHoveredFileName={currentHoveredFileName}
          currentHoveredFolderName={currentHoveredFolderName}
          newFileParentPath={newFileParentPath}
          newFolderParentPath={newFolderParentPath}
        />}

        {/* Editor Tabs, Main Editor, and Terminal stack on top of each other */}
        <Flex
          data-codevideo-id={EDITOR_AREA_ID}
          data-testid="editor-area"
          direction="column"
          width="100%">
          <EditorTabs
            theme={theme}
            editors={editors || []}
            currentEditor={currentEditor}
          />
          {/* Editor */}
          <Box
            data-codevideo-id={EDITOR_ID}
            style={{
              flex: 1,
              position: 'relative',
              userSelect: isRecording ? 'auto' : 'none'
            }}
          >
            <Box style={{
              display: editors && editors.length === 0 ? 'block' : 'none',
              backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
              height: '100%',
              width: '100%'
            }} />
            <Box style={{
              display: editors && editors.length === 0 ? 'none' : 'block',
              backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
              height: '100%',
              width: '100%',
              pointerEvents: isRecording ? 'auto' : 'none',
              cursor: isRecording ? 'auto' : 'none',
              userSelect: isRecording ? 'auto' : 'none',
            }}>
              <Editor
                path={currentEditor?.filename}
                theme={theme === 'light' ? 'vs' : 'vs-dark'}
                className={`no-mouse ${editors && editors.length === 0 ? 'display-none' : 'display-block'}`}
                // value in replay mode is handled by setting the model value directly
                // in step mode, we use the currentCode state variable
                value={isRecording || mode === 'replay' ? undefined : currentCode}
                defaultValue={isRecording ? currentCode : undefined}
                defaultLanguage={defaultLanguage}
                options={{
                  automaticLayout: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: true,
                  fontSize: renderFontSizePx ? renderFontSizePx : 14,
                  fontFamily: 'Fira Code, monospace',
                  fontLigatures: true,
                  readOnly: mode === 'step',
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  wrappingStrategy: 'advanced',
                  wordWrap: 'on',
                  wordWrapColumn: 80,
                  bracketPairColorization: { enabled: true },
                  matchBrackets: 'never',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                onMount={handleEditorDidMount}
              />
            </Box>
          </Box>
          {/* Terminal - TODO: add support for multiple terminals in the future */}
          {isTerminalVisible && <Terminal
            theme={theme}
            terminalBuffer={terminalBuffer}
            terminalHeight={terminalHeight}
            fontSizePx={renderFontSizePx}
            showBlockCaret={showBlockCaret} />}
        </Flex>

        {/* OVERLAY COMPONENTS - These render on top of the IDE when needed */}
        {isSlideDisplayStep && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1000,
              backgroundColor: 'var(--gray-1)' // Ensure solid background
            }}
          >
            <SlideViewer
              hljsTheme='monokai'
              slideMarkdown={slideMarkdown}
              fontSizePx={renderFontSizePx} />
          </Box>
        )}

        {isExternalBrowserDisplayStep && externalBrowserStepUrl && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1000,
              backgroundColor: 'var(--gray-1)' // Ensure solid background
            }}
          >
            <ExternalWebViewer
              url={externalBrowserStepUrl}
              mode={mode}
              scrollPosition={currentExternalBrowserScrollPosition}
            />
          </Box>
        )}

        {isExternalWebPreviewDisplayStep && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1000,
              backgroundColor: 'var(--gray-1)' // Ensure solid background
            }}
          >
            <WebPreview files={webPreviewFiles} />
          </Box>
        )}
      </Flex>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog isUnsavedChangesDialogOpen={isUnsavedChangesDialogOpen} unsavedFileName={unsavedFileName} />

      {/* Mouse Overlay */}
      {!showEmbedOverlay && <MouseOverlay
        mode={mode}
        mouseVisible={true}
        targetMousePosition={targetMousePosition}
        maximumAnimationDuration={standardPauseMs}
        onCurrentPositionChange={setCurrentMousePosition}
        onAnimationFinished={() => {
          // TOOD?
        }}
        mouseColor={mouseColor} />}

      {/* Caption Overlay */}
      {!showEmbedOverlay && withCaptions && <CaptionOverlay captionText={captionText} fontSizePx={renderFontSizePx} />}

      {/* Dev Box - positioned after captions to appear above them */}
      {showDevBox && <DevBox variables={{
        // currentCode,
        // terminalBuffer,
        currentMousePosition,
        currentCaretPosition,
        // captionText,
        currentFileName,
        currentCode: currentCode.substring(0, 50) + '...',
        actionLength: extractedActions.length,
        currentActionIndex,
        currentAction
        // isUnsavedChangesDialogOpen,
        // unsavedFileName,
        // currentFileStructure
      }} />}

      {/* Embed start overlay */}
      {showEmbedOverlay && <EmbedOverlay />}
    </Flex>
  );
}