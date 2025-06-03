import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Box, Flex } from '@radix-ui/themes';
import * as monaco from 'monaco-editor';
// TODO: add multiple theme support later
// import Monokai from "monaco-themes/themes/Monokai.json";

// types
import { extractActionsFromProject, ICodeVideoIDEProps, IAction, IEditor, IEditorPosition, IFileStructure, IPoint, Project, isRepeatableAction } from '@fullstackcraftllc/codevideo-types';

// editor tabs
import { EditorTabs } from './Editor/EditorTabs';

// external web viewer
import { ExternalWebViewer } from './ExternalWebViewer/ExternalWebViewer';

// utils
import { sleep } from './utils/sleep';
import { speakText, stopSpeaking } from './utils/speakText';
import { getLanguageFromFilename } from './utils/getLanguageFromFilename';

// File explorer
import { FileExplorer } from './FileExplorer/FileExplorer';

// Terminal
import { Terminal } from './Terminal/Terminal';

// MouseOverlay
import { MouseOverlay } from './MouseOverlay/MouseOverlay';

// CaptionOverlay
import { CaptionOverlay } from './CaptionOverlay/CaptionOverlay';

// embed overlay
import { EmbedOverlay } from './EmbedOverlay/EmbedOverlay';

// unsaved changes dialog
import { UnsavedChangesDialog } from './UnsavedChangesDialog/UnsavedChangesDialog';

// slide viewer
import { SlideViewer } from './SlideViewer/SlideViewer';

// util functions
import { reconstituteAllPartsOfState } from './utils/reconstituteAllPartsOfState';
import { getNewMousePosition } from './MouseOverlay/utils/getNewMousePosition';

// ids and constants
import { CODEVIDEO_IDE_ID, DEFAULT_CARET_POSITION, DEFAULT_MOUSE_POSITION, KEYBOARD_TYPING_PAUSE_MS, LONG_PAUSE_MS, STANDARD_PAUSE_MS } from './constants/CodeVideoIDEConstants';
import { EDITOR_AREA_ID, EDITOR_ID } from './constants/CodeVideoDataIds';

/**
 * Represents a powerful IDE with file explorer, multiple editors, and terminal
 * @param props 
 * @returns 
 */
export function CodeVideoIDE(props: ICodeVideoIDEProps) {
  const {
    theme,
    project,
    mode,
    allowFocusInEditor,
    defaultLanguage,
    isExternalBrowserStepUrl,
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
    resolution = '1080p'
  } = props;
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
  const [showEmbedOverlay, setShowEmbedOverlay] = useState<boolean>(isEmbedMode || false);
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
  const [isSlideDisplayStep, setIsSlideDisplayStep] = useState<boolean>(false);
  const [slideMarkdown, setSlideMarkdown] = useState<string>("");
  const [prevActionIndex, setPrevActionIndex] = useState<number>(-1);
  const [showBlockCaret, setShowBlockCaret] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  const globalMonacoRef = useRef<Monaco | undefined>(undefined);

  // for cleanup TODO
  // const modelUrisRef = useRef<Set<string>>(new Set());
  // const prevMode = useRef<GUIMode>(mode);
  // const isInitialMount = useRef(true);

  const applyAnimation = async () => {
    const actions = extractActionsFromProject(project, currentLessonIndex)
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;

    if (!currentAction) {
      playBackCompleteCallback && playBackCompleteCallback();
      return;
    }

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
    }
    updateState();
    actionFinishedCallback && actionFinishedCallback();
  }

  const updateState = () => {
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
    setEditors(editors)
    setCurrentEditor(currentEditor);
    setCurrentFileName(currentFilename);
    setCurrentFileStructure(fileExplorerSnapshot.fileStructure);
    setCurrentCode(currentCode);
    setCurrentCaretPosition(currentCaretPosition);
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
    
    // Only set input values in step mode, not replay mode where animation handles it
    if (mode !== 'replay') {
      setNewFileInputValue(fileExplorerSnapshot.newFileInputValue);
      setNewFolderInputValue(fileExplorerSnapshot.newFolderInputValue);
    }
    
    setCurrentHoveredEditorTabFileName(mouseSnapshot.currentHoveredEditorTabFileName);
    setIsUnsavedChangesDialogOpen(isUnsavedChangesDialogOpen);
    setUnsavedFileName(unsavedFileName);

    // Only update mouse position in step mode, not in replay mode
    // This prevents double mouse movement animations in replay mode
    if (mode !== 'replay') {
      updateMouseStateAndSideEffects(actions);
    }
  }

  // This is copied basically in animation way down logic below, could be refactored
  const updateMouseStateAndSideEffects = async (actions: Array<IAction>) => {
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
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
    if (!currentAction) return;

    const newPosition = await getNewMousePosition(targetMousePosition, currentAction, containerRef);
    console.log(`Action: ${currentAction.name}, New position: x=${newPosition.x}, y=${newPosition.y}`);

    setTargetMousePosition(newPosition);
  }

  // whenever current action changes, determine if we are still isSlideDisplayStep
  // basically any starts with 'slides-' or 'author-' we keep displaying the slides
  // useEffect(() => {
  //   const actions = extractActionsFromProject(project, currentLessonIndex)
  //   const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
  //   if (currentAction) {
  //     if (currentAction.name === 'slide-display') {
  //       // when the current action is a slide, we show the slide and set the slide markdown
  //       setIsSlideDisplayStep(true);
  //       setSlideMarkdown(currentAction.value);
  //     } else if (isSlideDisplayStep && currentAction.name.startsWith('author-')) {
  //       // if we're already on a slide but speaking, we keep displaying the slide
  //     } else {
  //       // we've moved away from a slide, so we hide it
  //       setIsSlideDisplayStep(false);
  //       setSlideMarkdown("");
  //     }
  //   }
  // }, [currentActionIndex, project, currentLessonIndex]);

  useEffect(() => {
    const actions = extractActionsFromProject(project, currentLessonIndex);
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
    
    // Determine if we're moving forward or backward through actions
    const isSteppingForward = currentActionIndex > prevActionIndex;
    
    if (currentAction) {
      if (currentAction.name === 'slide-display') {
        // When current action is a slide-display, always show it
        setIsSlideDisplayStep(true);
        setSlideMarkdown(currentAction.value);
      } else if (currentAction.name.startsWith('author-')) {
        // For author actions, maintain slide state when stepping forward
        // but hide slide when stepping backward
        if (!isSteppingForward) {
          setIsSlideDisplayStep(false);
          setSlideMarkdown("");
        }
        // When stepping forward, keep any currently displayed slide
      } else {
        // For any other action, always hide the slide
        setIsSlideDisplayStep(false);
        setSlideMarkdown("");
      }
    } else {
      // No action at this index, hide the slide
      setIsSlideDisplayStep(false);
      setSlideMarkdown("");
    }
    
    // Update the previous action index for next comparison - moved to end and add dependency check
    if (mode === 'step' || currentActionIndex > 0) {
      setPrevActionIndex(currentActionIndex);
    }
  }, [currentActionIndex, project, currentLessonIndex, mode]);

  // Effect to handle terminal caret based on current action
  useEffect(() => {
    const actions = extractActionsFromProject(project, currentLessonIndex);
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
    
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
  }, [currentActionIndex, project, currentLessonIndex]);


  // whenever issoundon changes or currentActionIndex, and we are in step mode, and the current action includes 'speak', we should speak
  useEffect(() => {
    const actions = extractActionsFromProject(project, currentLessonIndex)
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
    if (isSoundOn && mode === 'step' && currentAction && currentAction.name.startsWith('author-')) {
      // try to find a match by the sha256 hash of the action.value in the speakActionAudios array
      const action = currentAction;
      const mp3Url = speakActionAudios.find((audio) => audio.text === action.value)?.mp3Url;

      // if audio element was not found, it is undefined and we default to the speech synthesis
      speakText(currentAction.value, 1, mp3Url);
    } else {
      stopSpeaking();
    }
  }, [isSoundOn, project, currentActionIndex, currentLessonIndex]);

  // update virtual when current action index changes
  useEffect(() => {
    // normal step by step mode OR initial replay state - can update state immediately
    if (mode === 'step') {
      updateState();
      return;
    }
    // if playback mode, we need to animate the typing on the editor, then we can apply the action to maintain state, then we call the actionFinishedCallback
    if (mode === 'replay') {
      // need to handle the first reset
      if (currentActionIndex === 0) {
        updateState();
      }
      // this in turn calls updateState once the animation is complete, and then calls actionFinishedCallback
      applyAnimation();
    }
  }, [mode, currentActionIndex, project]);

  const handleEditorDidMount = (
    monacoEditor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    monacoEditorRef.current = monacoEditor;
    globalMonacoRef.current = monaco;

    // Set the model with the current code and language
    // TODO could probably be looped for all files?
    const model = monaco.editor.createModel(
      currentCode,
      currentEditorLanguage
    );
    monacoEditor.setModel(model);

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

  // caret position effect - we don't use in replay mode because it is handled in the animation
  // works fine for step by step mode though!
  useEffect(() => {
    if (monacoEditorRef.current && mode === 'step') {
      monacoEditorRef.current.setPosition({
        lineNumber: currentCaretPosition.row,
        column: currentCaretPosition.col
      });

      monacoEditorRef.current.revealPositionInCenter({
        lineNumber: currentCaretPosition.row,
        column: currentCaretPosition.col
      });

      // trigger a focus to actually highlight where the caret is - if allowFocusInEditor is true
      if (allowFocusInEditor) {
        monacoEditorRef.current.focus();
      }
    }
  }, [currentCaretPosition, allowFocusInEditor]);

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

  // always auto-scroll to line in center when the caret row position changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.revealLineInCenter(currentCaretPosition.row);
    }
  }, [currentCaretPosition.row]);


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
  useEffect(() => {
    if (isEmbedMode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          setShowEmbedOverlay(false);
          requestStepModeCallback && requestStepModeCallback('step');
          requestNextActionCallback && requestNextActionCallback();
        } else if (e.key === 'ArrowLeft') {
          setShowEmbedOverlay(false);
          requestStepModeCallback && requestStepModeCallback('step');
          requestPreviousActionCallback && requestPreviousActionCallback();
        } else if (e.key === ' ') {
          setShowEmbedOverlay(false);
          requestPlaybackStartCallback && requestPlaybackStartCallback();
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isEmbedMode]);

  // monaco cleanup - whenever replay ends, clear all models
  // useEffect(() => {
  //   if (mode !== 'replay' && monacoEditorRef.current) {
  //     monacoEditorRef.current.setModel(null);
  //   }
  // }, [mode]);

  // Comprehensive cleanup function
  // TODO this doesn't fix the playback bug and causes SSR issues anyway
  // const cleanupMonacoState = () => {
  //   console.log('Cleaning up Monaco state');

  //   // 1. Dispose specific tracked models by URI
  //   modelUrisRef.current.forEach(uriString => {
  //     try {
  //       const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
  //       if (model) {
  //         model.dispose();
  //       }
  //     } catch (e) {
  //       console.error('Error disposing model:', e);
  //     }
  //   });

  //   // Reset tracking
  //   modelUrisRef.current.clear();

  //   // 2. Safety check: dispose any remaining models
  //   monaco.editor.getModels().forEach(model => {
  //     try {
  //       console.log('Disposing model:', model.uri.toString());
  //       model.dispose();
  //       console.log('Disposed.');
  //     } catch (e) {
  //       console.error('Error disposing leftover model:', e);
  //     }
  //   });

  //   // 3. Reset editor state but preserve the instance
  //   if (monacoEditorRef.current) {
  //     try {
  //       // Create a temporary empty model with a unique URI
  //       const tempUri = monaco.Uri.parse(`temp-${Date.now()}`);
  //       const emptyModel = monaco.editor.createModel('', defaultLanguage, tempUri);
  //       monacoEditorRef.current.setModel(emptyModel);

  //       // Reset editor viewstate
  //       monacoEditorRef.current.restoreViewState(null);

  //       // Reset cursor and selection
  //       monacoEditorRef.current.setPosition({ lineNumber: 1, column: 1 });
  //       monacoEditorRef.current.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
  //     } catch (e) {
  //       console.error('Error resetting editor state:', e);
  //     }
  //   }

  //   console.log('Cleaning up complete');
  // };

  // // Add this effect to handle mode changes
  // useEffect(() => {
  //   // Skip on initial mount
  //   if (isInitialMount.current) {
  //     isInitialMount.current = false;
  //     return;
  //   }

  //   // Cleanup when exiting replay mode
  //   if (mode !== 'replay' && prevMode.current === 'replay') {
  //     cleanupMonacoState();

  //     // Explicitly update state after cleanup
  //     // updateState();
  //   }

  //   // Store current mode for next comparison
  //   prevMode.current = mode;
  // }, [mode]);

  // Add cleanup on component unmount
  // TODO this doesn't fix the playback bug and causes SSR issues anyway
  // useEffect(() => {
  //   return () => {
  //     cleanupMonacoState();
  //   };
  // }, []);


  // useful for debugging
  // // before rendering log out all relevant stuff
  // // current file
  // console.log('currentFile', currentFile);
  // // current file structure
  // console.log('currentFileStructure', currentFileStructure);
  // // current code
  // console.log('currentCode', currentCode);
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
        {isSlideDisplayStep ? (
          <SlideViewer 
            hljsTheme='monokai'
            slideMarkdown={slideMarkdown}
            fontSizePx={renderFontSizePx} />
        ) : isExternalBrowserStepUrl !== null ? (
          <Flex direction="row"
            style={{
              height: '100%',
              width: '100%',
              borderRadius: 'var(--radius-3)',
              position: 'relative'
            }}
            ref={containerRef}
          >
            <ExternalWebViewer
              url={isExternalBrowserStepUrl}
              mode={mode}
              scrollPosition={0} // TODO: implement external-browser-scroll!
            />
          </Flex>
        ) : (
          <>
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
            {/* Editor Tabs, Main Editor, and Terminal stack on top of eachother */}
            <Flex 
            data-codevideo-id={EDITOR_AREA_ID}
            direction="column" 
            width="100%">
              <EditorTabs theme={theme} editors={editors || []} />
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
          </>
        )}
      </Flex>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog isUnsavedChangesDialogOpen={isUnsavedChangesDialogOpen} unsavedFileName={unsavedFileName} />

      {/* Mouse Overlay */}
      {!showEmbedOverlay && <MouseOverlay
        mode={mode}
        mouseVisible={true}
        targetMousePosition={targetMousePosition}
        onCurrentPositionChange={setCurrentMousePosition}
        onAnimationFinished={() => {
          // TODO ...
        }}
        mouseColor={mouseColor} />}

      {/* Caption Overlay */}
      {!showEmbedOverlay && withCaptions && <CaptionOverlay captionText={captionText} fontSizePx={renderFontSizePx} />}

      {/* Embed start overlay */}
      {showEmbedOverlay && <EmbedOverlay />}
    </Flex>
  );
}

const simulateHumanTypingWithReactSetterCallback = async (
  setter: React.Dispatch<React.SetStateAction<string>>,
  text: string,
  typingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS
) => {
  const characters = text.split("");
  for (var i = 0; i < characters.length; i++) {
    setter((prev: string) => prev + characters[i]);
    await sleep(typingPauseMs);
  }
}

// define the human typing here in the puppeteer environment
const simulateHumanTypingInMonaco = (
  editor: monaco.editor.IStandaloneCodeEditor,
  charactersToType: string,
  typingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS
) => {
  return new Promise<void>((resolve) => {
    const characters: string[] = charactersToType.split("");
    let index: number = 0;

    function typeNextCharacter(): void {
      if (index < characters.length) {
        const char = characters[index];
        const selection = editor.getSelection();
        editor.executeEdits("simulateTyping", [
          {
            range: {
              startLineNumber: selection?.selectionStartLineNumber || 1,
              startColumn: selection?.selectionStartColumn || 1,
              endLineNumber: selection?.endLineNumber || 1,
              endColumn: selection?.endColumn || 1,
            },
            text: char || "",
            forceMoveMarkers: true,
          },
        ]);
        // editor.setPosition({
        //   lineNumber: selection?.endLineNumber || 1,
        //   column: selection?.endColumn || 1
        // });

        // this keeps the line we are currently typing in the center of the screen
        editor.revealPositionInCenter({
          lineNumber: selection?.endLineNumber || 1,
          column: selection?.endColumn || 1
        });

        // trigger a focus to actually highlight where the caret is
        editor.focus();
        index++;
        setTimeout(typeNextCharacter, typingPauseMs);
      } else {
        resolve();
      }
    }

    typeNextCharacter();
  });
};

// TODO: copied the EDITOR parts mostly from the backend single editor endpoint from codevideo-backend-engine... can we generalize this?
// the speaking and terminal stuff is new
export const executeActionPlaybackForMonacoInstance = async (
  editor: monaco.editor.IStandaloneCodeEditor,
  project: Project,
  currentActionIndex: number,
  currentLessonIndex: number | null,
  action: IAction,
  isSoundOn: boolean,
  setEditors: (value: any) => void,
  setCurrentEditor: (value: any) => void,
  setCurrentFileName: (value: any) => void,
  setCurrentCaretPosition: (value: any) => void,
  setTerminalBuffer: (value: any) => void,
  mousePosition: IPoint,
  containerRef: React.RefObject<HTMLDivElement | null>,
  setMousePosition: (value: any) => void,
  setCaptionText: (value: any) => void,
  speakActionAudios: Array<{ text: string, mp3Url: string }>,
  setNewFileInputValue: React.Dispatch<React.SetStateAction<string>>,
  setNewFolderInputValue: React.Dispatch<React.SetStateAction<string>>,
  setRenameFileInputValue: React.Dispatch<React.SetStateAction<string>>,
  setRenameFolderInputValue: React.Dispatch<React.SetStateAction<string>>,
  keyboardTypingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS,
  standardPauseMs: number = STANDARD_PAUSE_MS,
  longPauseMs: number = LONG_PAUSE_MS,
) => {
  let startTime = -1;

  // helpful for debugging
  // editor.getSupportedActions().forEach((value) => {
  //   console.log(value);
  // });

  // OPEN FILE ANIMATION, STATE NEEDS TO BE SET HERE BEFORE TYPING OR WE ALWAYS TYPE ONE CHARACTER TOO LATE
  switch (action.name) {
    case 'file-explorer-open-file':
      console.log("SET CURRENT FILE to ", action.value)
      const { editors, currentEditor, currentFilename, currentCaretPosition } = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex);
      setEditors(editors);
      setCurrentEditor(currentEditor);
      setCurrentFileName(currentFilename);
      await sleep(standardPauseMs);
      setCurrentCaretPosition(currentCaretPosition);
      break;
  }

  // before continuing, wait a little bit so file explorer can update the DOM
  await sleep(standardPauseMs);

  // MOUSE MOVEMENT ANIMATIONS, PASS THROUGH AND CONTINUE BELOW
  // 
  const newPosition = await getNewMousePosition(mousePosition, action, containerRef)

  setMousePosition(newPosition);

  // const highlightText = (
  //   editor: monaco.editor.IStandaloneCodeEditor,
  //   searchText: string
  // ) => {
  //   const model = editor.getModel();

  // findNextMatch BREAKS SSR
  // Find the position of the searchText in the model
  // @ts-ignore
  // const searchTextPosition = model.findNextMatch(
  //   searchText,
  //   // @ts-ignore
  //   new monaco.Position(1, 1)
  // );


  // this ALSO BREAKS SSR
  // const searchTextPosition: monaco.editor.FindMatch = {
  //   range: new monaco.Range(1, 1, 1, 1),
  // }

  // If searchText is found
  // if (searchTextPosition) {
  //   const line = searchTextPosition.range.startLineNumber;
  //   const column = searchTextPosition.range.startColumn;

  //   // Move the cursor to the beginning of the searchText
  //   editor.setPosition({ lineNumber: line, column });

  //   // Reveal the line in the center
  //   editor.revealLineInCenter(line);

  //   // Calculate the range of the searchText
  //   const searchTextLength = searchText.length;
  //   // @ts-ignore
  //   const range = new monaco.Range(
  //     line,
  //     column,
  //     line,
  //     column + searchTextLength
  //   );

  //   // Set the selection to highlight the searchText
  //   editor.setSelection(range);

  //   // Reveal the range in the center
  //   editor.revealRangeInCenter(range);
  // }
  // };

  // try to parse the 'times' value as an integer for repeatable actions, if it fails, default to 1
  // the "times" doesn't always apply to most actions, so we do that action just once
  const times = isRepeatableAction(action.name) ? parseInt(action.value) : 1;
  const pos = editor.getPosition();
  // const lineNumber = pos?.lineNumber;
  for (let i = 0; i < times; i++) {
    // actual logic
    switch (true) {
      case action.name.startsWith("external-"):
      case action.name.startsWith("slides-"):
        // no op - but do a long pause
        await sleep(longPauseMs);
        break;
      case action.name.startsWith("author-"):
        setCaptionText(action.value);
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
      // BEGIN FILE EXPLORER TYPING ACTIONS
      case action.name === "file-explorer-type-new-file-input":
        simulateHumanTypingWithReactSetterCallback(setNewFileInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-new-file-input":
        setNewFileInputValue("")
        break;
      case action.name === "file-explorer-type-new-folder-input":
        simulateHumanTypingWithReactSetterCallback(setNewFolderInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-new-folder-input":
        setNewFolderInputValue("")
        break;
      case action.name === "file-explorer-type-rename-file-input":
        simulateHumanTypingWithReactSetterCallback(setRenameFileInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-rename-file-input":
        setRenameFileInputValue("")
        break;
      case action.name === "file-explorer-type-rename-folder-input":
        simulateHumanTypingWithReactSetterCallback(setRenameFolderInputValue, action.value, keyboardTypingPauseMs)
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
      case action.name === "editor-arrow-down" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber + 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-up" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber - 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-tab" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber + 2;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-left" && pos !== null:
        // @ts-ignore
        pos.column = pos.column - 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-right" && pos !== null:
        // @ts-ignore
        pos.column = pos.column + 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-enter":
        await simulateHumanTypingInMonaco(editor, "\n");
        break;
      // case action.name === "editor-delete-line" && lineNumber !== null:
      //   console.log("deleting line");
      //   // @ts-ignore - this also breaks SSR
      //   editor.executeEdits("", [
      //     // @ts-ignore
      //     { range: new monaco.Range(lineNumber, 1, lineNumber + 1, 1), text: null },
      //   ]);
      //   await sleep(keyboardTypingPauseMs)
      //   break;
      case action.name === "editor-command-right" && pos !== null:
        // simulate moving to the end of the current line
        // @ts-ignore
        pos.column = 100000;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      //   // highlight breaks SSR
      // // case action.name === "editor-highlight-code":
      // //   highlightText(editor, action.value);
      // //   break;
      case action.name === "editor-space":
        await simulateHumanTypingInMonaco(editor, " ");
        break;
      case action.name === "editor-backspace":
        // @ts-ignore - this also breaks SSR
        typeof window !== "undefined" && editor.trigger(1, "deleteLeft");
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-type":
        await simulateHumanTypingInMonaco(editor, action.value);
        break;
      default:
        // no op - but still do default delay
        await sleep(standardPauseMs);
        console.warn("Unable to apply action", JSON.stringify(action));
        break;
    }
  }
  return startTime;
};
