import React, { useEffect, useRef, useState } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { Box, Flex } from '@radix-ui/themes';
import * as monaco from 'monaco-editor';
// TODO: add multiple theme support later
// import Monokai from "monaco-themes/themes/Monokai.json";

// types
import { ICodeVideoIDEProps, IEditor, IEditorPosition, IFileStructure, IPoint } from '@fullstackcraftllc/codevideo-types';

// editor tabs
import { EditorTabs } from './Editor/EditorTabs.jsx';

// external web viewer
import { ExternalWebViewer } from './ExternalWebViewer/ExternalWebViewer.jsx';

// utils
import { getLanguageFromFilename } from './utils/getLanguageFromFilename.js';

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
import { CODEVIDEO_IDE_ID, DEFAULT_CARET_POSITION, DEFAULT_MOUSE_POSITION, KEYBOARD_TYPING_PAUSE_MS, LONG_PAUSE_MS, STANDARD_PAUSE_MS } from './constants/CodeVideoIDEConstants.js';
import { EDITOR_AREA_ID, EDITOR_ID } from './constants/CodeVideoDataIds.js';

// hooks
import { useStableActions } from './hooks/useStableActions.js';
import { useReplayPlayback } from './hooks/useReplayPlayback.js';
import { useTerminalCaret } from './hooks/useTerminalCaret.js';
import { useSpeechOnStep } from './hooks/useSpeechOnStep.js';
import { useEmbedKeyboard } from './hooks/useEmbedKeyboard.js';
import { useOverlayDisplay } from './hooks/useOverlayDisplay.js';
import { useStepModeState } from './hooks/useStepModeState.js';

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
  const [editors, setEditors] = useState<Array<IEditor>>();
  const [currentEditor, setCurrentEditor] = useState<IEditor>();
  const [currentFileName, setCurrentFileName] = useState<string>();
  const [currentFileStructure, setCurrentFileStructure] = useState<IFileStructure>();
  const [currentCode, setCurrentCode] = useState<string>('');
  const [terminalBuffer, setTerminalBuffer] = useState<string>('');
  const [targetMousePosition, setTargetMousePosition] = useState<IPoint>(DEFAULT_MOUSE_POSITION);
  const [currentMousePosition, setCurrentMousePosition] = useState<IPoint>(DEFAULT_MOUSE_POSITION);
  const [currentCaretPosition, setCurrentCaretPosition] = useState<IEditorPosition>(DEFAULT_CARET_POSITION);
  const [captionText, setCaptionText] = useState<string>('');
  const [currentEditorLanguage, setCurrentEditorLanguage] = useState<string>(defaultLanguage);
  const [isFileExplorerContextMenuVisible, setIsFileExplorerContextMenuVisible] = useState<boolean>(false);
  const [isFileContextMenuVisible, setIsFileContextMenuVisible] = useState<boolean>(false)
  const [isFolderContextMenuVisible, setIsFolderContextMenuVisible] = useState<boolean>(false)
  const [isNewFileInputVisible, setIsNewFileInputVisible] = useState<boolean>(false)
  const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState<boolean>(false)
  const [newFileInputValue, setNewFileInputValue] = useState<string>("")
  const [newFolderInputValue, setNewFolderInputValue] = useState<string>("")
  const [originalFileBeingRenamed, setOriginalFileBeingRenamed] = useState<string>("")
  const [originalFolderBeingRenamed, setOriginalFolderBeingRenamed] = useState<string>("")
  const [renameFileInputValue, setRenameFileInputValue] = useState<string>("")
  const [renameFolderInputValue, setRenameFolderInputValue] = useState<string>("")
  const [currentHoveredFileName, setCurrentHoveredFileName] = useState<string>("")
  const [currentHoveredFolderName, setCurrentHoveredFolderName] = useState<string>("")
  const [newFileParentPath, setNewFileParentPath] = useState<string>("")
  const [newFolderParentPath, setNewFolderParentPath] = useState<string>("")
  const [currentHoveredEditorTabFileName, setCurrentHoveredEditorTabFileName] = useState<string>("")
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState<boolean>(false);
  const [unsavedFileName, setUnsavedFileName] = useState<string>("");
  const [currentExternalBrowserScrollPosition, setCurrentExternalBrowserScrollPosition] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  const globalMonacoRef = useRef<Monaco | undefined>(undefined);

  // Store editor view state to preserve caret position when overlays are shown/hidden
  const editorViewStateRef = useRef<monaco.editor.ICodeEditorViewState | null>(null);
  const isRestoringViewStateRef = useRef<boolean>(false);

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

  const handleEditorDidMount = (
    monacoEditor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    monacoEditorRef.current = monacoEditor;
    globalMonacoRef.current = monaco;

    // Don't create a model here - let the model management useEffect handle it
    // This ensures proper file switching behavior in replay mode

    // Ensure theme is applied after a short delay
    // monaco.editor.defineTheme(
    //   "Monokai",
    //   Monokai as monaco.editor.IStandaloneThemeData
    // );
    // setTimeout(() => {
    //   monaco.editor.setTheme('Monokai');
    // }, 1);
    monacoLoadedCallback && monacoLoadedCallback();
  };

  // caret position effect - now works for both replay and step modes since Monaco editor is always rendered
  useEffect(() => {
    // Don't interfere if we're in the middle of restoring view state
    if (isRestoringViewStateRef.current) {
      return;
    }

    if (monacoEditorRef.current && (mode === 'step' || mode === 'replay')) {
      // Use setTimeout to ensure caret positioning happens after Monaco has finished updating content
      // This is especially important in step mode where content can change significantly
      const timer = setTimeout(() => {
        if (monacoEditorRef.current) {
          monacoEditorRef.current.setPosition({
            lineNumber: currentCaretPosition.row,
            column: currentCaretPosition.col
          });

          // This only scrolls if the position is not already visible.
          monacoEditorRef.current.revealPosition({
            lineNumber: currentCaretPosition.row,
            column: currentCaretPosition.col
          });

          // trigger a focus to actually highlight where the caret is - if allowFocusInEditor is true
          if (allowFocusInEditor) {
            monacoEditorRef.current.focus();
          }
        }
      }, 0); // Execute on next tick to ensure Monaco has finished content updates

      return () => clearTimeout(timer);
    }
  }, [currentCaretPosition, allowFocusInEditor, mode]);

  // Additional effect to handle caret positioning after content changes in step mode
  useEffect(() => {
    if (mode === 'step' && monacoEditorRef.current && !isRestoringViewStateRef.current) {
      // Use a longer timeout for content changes to ensure Monaco has finished all updates
      const timer = setTimeout(() => {
        if (monacoEditorRef.current) {
          monacoEditorRef.current.setPosition({
            lineNumber: currentCaretPosition.row,
            column: currentCaretPosition.col
          });

          monacoEditorRef.current.revealPositionInCenter({
            lineNumber: currentCaretPosition.row,
            column: currentCaretPosition.col
          });

          if (allowFocusInEditor) {
            monacoEditorRef.current.focus();
          }
        }
      }, 10); // Slightly longer delay for content changes

      return () => clearTimeout(timer);
    }
  }, [currentCode, mode, currentCaretPosition, allowFocusInEditor]);

  // Save/restore editor view state when overlays are shown/hidden to prevent caret position regression
  useEffect(() => {
    const isOverlayActive = isSlideDisplayStep || isExternalWebPreviewDisplayStep || isExternalBrowserDisplayStep;

    if (monacoEditorRef.current) {
      if (isOverlayActive && !editorViewStateRef.current) {
        // Save view state before showing overlay (only if not already saved)
        console.log('Saving editor view state before overlay, current position:', monacoEditorRef.current.getPosition());
        editorViewStateRef.current = monacoEditorRef.current.saveViewState();
      } else if (!isOverlayActive && editorViewStateRef.current) {
        // Restore view state after hiding overlay
        const savedState = editorViewStateRef.current;
        console.log('Restoring editor view state after overlay');

        // Clear the saved state first to prevent re-triggering
        editorViewStateRef.current = null;

        // Set flag to prevent caret position effect from interfering
        isRestoringViewStateRef.current = true;

        // Use setTimeout to ensure the editor has finished any re-rendering
        setTimeout(() => {
          if (monacoEditorRef.current && savedState) {
            console.log('Actually restoring view state, current position before restore:', monacoEditorRef.current.getPosition());

            // First restore the view state to get scroll position and other state
            monacoEditorRef.current.restoreViewState(savedState);

            console.log('Position after restore:', monacoEditorRef.current.getPosition());
            console.log('Expected position:', { row: currentCaretPosition.row, col: currentCaretPosition.col });

            // Then set the current caret position to ensure it's at the right place
            monacoEditorRef.current.setPosition({
              lineNumber: currentCaretPosition.row,
              column: currentCaretPosition.col
            });

            // Reveal the position to ensure it's visible
            monacoEditorRef.current.revealPositionInCenter({
              lineNumber: currentCaretPosition.row,
              column: currentCaretPosition.col
            });

            console.log('Final position after manual set:', monacoEditorRef.current.getPosition());

            // Clear the flag after restoration is complete
            isRestoringViewStateRef.current = false;
          }
        }, 0);
      }
    }
  }, [isSlideDisplayStep, isExternalWebPreviewDisplayStep, isExternalBrowserDisplayStep, currentCaretPosition]);

  // TODO: figure out highlights! (breaks due to SSR)
  // const currentHighlightCoordinates = currentFile ? currentFile.highlightCoordinates : null;
  // // highlight effect (only when not recording)
  // useEffect(() => {
  //   // if (typeof window !== "undefined" && !isRecording && monacoEditorRef.current && currentHighlightCoordinates) {
  //   // TODO: this line breaks SSR:
  //   // maybe we can hack our own highlight functionality...
  //   //   monacoEditorRef.current.createDecorationsCollection([
  //   //     {
  //   //       range: new monaco.Range(
  //   //         currentHighlightCoordinates.start.row,
  //   //         currentHighlightCoordinates.start.col,
  //   //         currentHighlightCoordinates.end.row,
  //   //         currentHighlightCoordinates.end.col
  //   //       ),
  //   //       options: { inlineClassName: 'highlighted-code' }
  //   //     }
  //   //   ]);

  //   //   // log out decorations for debugging
  //   //   // console.log(monacoEditorRef.current.getVisibleRanges());

  //   //   // trigger a focus to actually highlight where the highlight is
  //   //   // monacoEditorRef.current.focus();
  //   // }
  // }, [currentHighlightCoordinates]);

  // Gemini says this is not needed: let's see:
  // always auto-scroll to line in center when the caret row position changes
  // useEffect(() => {
  //   if (monacoEditorRef.current) {
  //     monacoEditorRef.current.revealLineInCenter(currentCaretPosition.row);
  //   }
  // }, [currentCaretPosition.row]);

  // Monaco model management for proper file switching
  // this useEffect FROM CLAUDE:
  useEffect(() => {
    if (monacoEditorRef.current && globalMonacoRef.current) {
      const monaco = globalMonacoRef.current;
      const editor = monacoEditorRef.current;

      // If there's no current editor filename, clear the model
      if (!currentEditor?.filename) {
        if (editor.getModel()) {
          editor.setModel(null);
          console.log('Cleared Monaco editor model - no active editor');
        }
        return;
      }

      // Handle normal file switching when we have a current editor
      const filename = currentEditor.filename;

      // Create a unique URI for this file
      const uri = monaco.Uri.file(filename);

      // Check if a model already exists for this file
      let model = monaco.editor.getModel(uri);

      if (!model) {
        // Create a new model for this file
        const language = getLanguageFromFilename(filename);
        model = monaco.editor.createModel(currentCode || '', language, uri);
        console.log(`Created new Monaco model for file: ${filename} with language: ${language}, uri: ${uri} content length: ${(currentCode || '').length}`);
      } else {
        // In replay mode, don't update model content here since executeActionPlaybackForMonacoInstance
        // handles the typing animation. Only update in step mode or when file content changes significantly.
        if (mode === 'step' && model.getValue() !== currentCode) {
          model.setValue(currentCode || '');
          console.log(`Updated Monaco model content for file: ${filename} (step mode), content length: ${(currentCode || '').length}`);
        } else if (mode === 'replay') {
          // In replay mode, only update if the model is completely empty or if we're switching files
          if (model.getValue() === '' && currentCode && currentCode !== '') {
            model.setValue(currentCode);
            console.log(`Initialized Monaco model content for file: ${filename} (replay mode), content length: ${currentCode.length}`);
          }
        }
      }

      // Set the model on the editor if it's not already set
      if (editor.getModel() !== model) {
        editor.setModel(model);
        console.log(`Switched Monaco editor to model for file: ${filename}`);
      }
    }
  }, [currentEditor?.filename, currentCode, mode]);

  // update the language of the editor based on the current filename every time it changes
  useEffect(() => {
    if (currentFileName) {
      const detectedLanguage = getLanguageFromFilename(currentFileName);
      setCurrentEditorLanguage(detectedLanguage);

      // If we have an active editor model, update its language
      if (monacoEditorRef.current && globalMonacoRef.current) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          globalMonacoRef.current.editor.setModelLanguage(model, detectedLanguage);
        }
      }
    }
  }, [currentFileName]);

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