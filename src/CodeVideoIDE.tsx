import React, { useEffect, useRef, useState } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { Box, Flex } from '@radix-ui/themes';
import * as monaco from 'monaco-editor';
// TODO: add multiple theme support later
// import Monokai from "monaco-themes/themes/Monokai.json";

// types
import { extractActionsFromProject, ICodeVideoIDEProps, IAction, IEditor, IEditorPosition, IFileStructure, IPoint, IFileEntry } from '@fullstackcraftllc/codevideo-types';

// editor tabs
import { EditorTabs } from './Editor/EditorTabs.jsx';

// external web viewer
import { ExternalWebViewer } from './ExternalWebViewer/ExternalWebViewer.jsx';

// utils
import { sleep } from './utils/sleep.js';
import { speakText, stopSpeaking } from './utils/speakText.js';
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
import { reconstituteAllPartsOfState } from './utils/reconstituteAllPartsOfState.js';
import { getNewMousePosition } from './MouseOverlay/utils/getNewMousePosition.js';

// ids and constants
import { CODEVIDEO_IDE_ID, DEFAULT_CARET_POSITION, DEFAULT_MOUSE_POSITION, KEYBOARD_TYPING_PAUSE_MS, LONG_PAUSE_MS, STANDARD_PAUSE_MS } from './constants/CodeVideoIDEConstants.js';
import { EDITOR_AREA_ID, EDITOR_ID } from './constants/CodeVideoDataIds.js';

// last but not least - the Virtual IDE!
import { VirtualIDE } from '@fullstackcraftllc/codevideo-virtual-ide';
import { executeActionPlaybackForMonacoInstance } from './utils/executeActionPlaybackForMonacoInstance.js';

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
    showDevBox = false
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
  const [isExternalWebPreviewDisplayStep, setIsExternalWebPreviewDisplayStep] = useState<boolean>(false);
  const [webPreviewFilesState, setWebPreviewFilesState] = useState<Array<IFileEntry>>([]);
  const [isExternalBrowserDisplayStep, setIsExternalBrowserDisplayStep] = useState<boolean>(false);
  const [externalBrowserStepUrlState, setExternalBrowserStepUrlState] = useState<string | null>(null);
  const [prevActionIndex, setPrevActionIndex] = useState<number>(-1);
  const [showBlockCaret, setShowBlockCaret] = useState<boolean>(false);
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
    updateState();
    actionFinishedCallback && actionFinishedCallback();
  }

  // Handle scroll actions for step mode
  const handleStepModeScrollActions = () => {
    const actions = extractActionsFromProject(project, currentLessonIndex);
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;

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
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;
    if (!currentAction) return;

    const newPosition = getNewMousePosition(targetMousePosition, currentAction, containerRef);
    
    // Safety check to prevent undefined coordinates
    if (!newPosition || isNaN(newPosition.x) || isNaN(newPosition.y) || 
        newPosition.x === undefined || newPosition.y === undefined) {
      console.warn('Invalid mouse position detected, keeping current position:', newPosition);
      return;
    }
    
    console.log(`Action: ${currentAction.name}, New position: x=${newPosition.x}, y=${newPosition.y}`);

    setTargetMousePosition(newPosition);
  }


  // current code update in replay mode - now handled by Monaco model management effect
  // to prevent conflicts with typing animations
  useEffect(() => {
    // This effect is now mostly handled by the Monaco model management effect above
    // to prevent conflicts between typing animations and content updates
  }, [currentCode, mode]);

  // this effect handles the logic for displaying slides, web previews, and external browser steps
  // we want to continue display those even if followed by an author action
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
      } else if (currentAction.name === 'external-web-preview') {
        // When current action is external-web-preview, always show it
        setIsExternalWebPreviewDisplayStep(true);
        const virtualIDE = new VirtualIDE(project);
        virtualIDE.applyActions(actions.slice(0, currentActionIndex + 1));
        setWebPreviewFilesState(virtualIDE.getFullFilePathsAndContents());
      } else if (currentAction.name === 'external-browser' || currentAction.name === 'external-browser-scroll') {
        // When current action is external-browser, always show it
        setIsExternalBrowserDisplayStep(true);
        setExternalBrowserStepUrlState(currentAction.value);
      } else if (currentAction.name.startsWith('author-')) {
        // For author actions, maintain slide/web preview state when stepping forward
        // but hide them when stepping backward
        if (!isSteppingForward) {
          setIsSlideDisplayStep(false);
          setSlideMarkdown("");
          setIsExternalWebPreviewDisplayStep(false);
          setWebPreviewFilesState([]);
          setIsExternalBrowserDisplayStep(false);
          setExternalBrowserStepUrlState(null);
        }
        // When stepping forward, keep any currently displayed slide/web preview
      } else {
        // For any other action, always hide slides and web previews
        setIsSlideDisplayStep(false);
        setSlideMarkdown("");
        setIsExternalWebPreviewDisplayStep(false);
        setWebPreviewFilesState([]);
        setIsExternalBrowserDisplayStep(false);
        setExternalBrowserStepUrlState(null);
      }
    } else {
      // No action at this index, hide everything
      setIsSlideDisplayStep(false);
      setSlideMarkdown("");
      setIsExternalWebPreviewDisplayStep(false);
      setWebPreviewFilesState([]);
      setIsExternalBrowserDisplayStep(false);
      setExternalBrowserStepUrlState(null);
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
      
      // If there's no current editor or no editors at all, clear the model
      if (!currentEditor?.filename || !editors || editors.length === 0) {
        if (editor.getModel()) {
          editor.setModel(null);
          console.log('Cleared Monaco editor model - no active editors');
        }
        return;
      }
      
      // Handle normal file switching when there are editors
      if (currentCode !== null) {
        const filename = currentEditor.filename;
        
        // Create a unique URI for this file
        const uri = monaco.Uri.file(filename);
        
        // Check if a model already exists for this file
        let model = monaco.editor.getModel(uri);
        
        if (!model) {
          // Create a new model for this file
          const language = getLanguageFromFilename(filename);
          model = monaco.editor.createModel(currentCode, language, uri);
          console.log(`Created new Monaco model for file: ${filename} with language: ${language}`);
        } else {
          // In replay mode, don't update model content here since executeActionPlaybackForMonacoInstance
          // handles the typing animation. Only update in step mode or when file content changes significantly.
          if (mode === 'step' && model.getValue() !== currentCode) {
            model.setValue(currentCode);
            console.log(`Updated Monaco model content for file: ${filename} (step mode)`);
          } else if (mode === 'replay') {
            // In replay mode, only update if the model is completely empty or if we're switching files
            // This prevents overriding the typing animation from executeActionPlaybackForMonacoInstance
            if (model.getValue() === '' && currentCode !== '') {
              model.setValue(currentCode);
              console.log(`Initialized Monaco model content for file: ${filename} (replay mode)`);
            }
          }
        }
        
        // Set the model on the editor if it's not already set
        if (editor.getModel() !== model) {
          editor.setModel(model);
          console.log(`Switched Monaco editor to model for file: ${filename}`);
        }
      }
    }
  }, [currentEditor?.filename, currentCode, editors, mode]);

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
  const actions = extractActionsFromProject(project, currentLessonIndex);
  const currentAction = currentActionIndex >= 0 && currentActionIndex < actions.length ? actions[currentActionIndex] : null;

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
        actionLength: actions.length,
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