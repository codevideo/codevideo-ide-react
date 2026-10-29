import { useEffect, useRef } from 'react';
import { getEditorModelPath } from '../utils/getEditorModelPath.js';
import { applyEditorSelection } from '../utils/editorSelection.js';
import { paintScrollbars } from '../rendering/presentation.js';
import { GUIMode, IEditor, IEditorPosition } from '@fullstackcraftllc/codevideo-types';
import { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { getLanguageFromFilename } from '../utils/getLanguageFromFilename.js';
import { debugLog } from '../utils/debugLog.js';

export interface UseMonacoModelManagementParams {
  hydrating?: boolean;
  scrollbarFadeStartRef?: React.MutableRefObject<number | null>;
  modelViewStatesRef?: React.MutableRefObject<Record<string, monaco.editor.ICodeEditorViewState>>;
  mode: GUIMode;
  allowFocusInEditor: boolean;
  currentEditor: IEditor | undefined;
  currentFileName: string | undefined;
  currentCode: string;
  currentCaretPosition: IEditorPosition;

  isSlideDisplayStep: boolean;
  isExternalWebPreviewDisplayStep: boolean;
  isExternalBrowserDisplayStep: boolean;

  monacoEditorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
  globalMonacoRef: React.MutableRefObject<Monaco | undefined>;
  editorViewStateRef: React.MutableRefObject<monaco.editor.ICodeEditorViewState | null>;
  isRestoringViewStateRef: React.MutableRefObject<boolean>;

  setCurrentEditorLanguage: React.Dispatch<React.SetStateAction<string>>;
  monacoLoadedCallback?: () => void;
}

export interface UseMonacoModelManagementResult {
  handleEditorDidMount: (monacoEditor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => void;
}

/**
 * Everything that talks to the Monaco instance directly: editor mount wiring,
 * caret positioning, view-state preservation across overlays, model
 * creation/switching, and language sync.
 *
 * TIMING WARNING: the setTimeout(0) / setTimeout(10) constructions in here
 * encode discovered fixes for Monaco update races (caret set before content
 * applied, view-state restores fighting the caret effect). Moved verbatim
 * from CodeVideoIDE - do not "modernize" without re-testing replay AND step
 * mode in a real browser. Effect declaration order is also load-bearing and
 * preserved from the original component.
 */
export const useMonacoModelManagement = (
  params: UseMonacoModelManagementParams
): UseMonacoModelManagementResult => {
  const {
    hydrating, modelViewStatesRef, scrollbarFadeStartRef,
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
  } = params;

  const activeCaretPosition = currentEditor?.caretPosition ?? currentCaretPosition;
  const suspended = useRef(hydrating); suspended.current = hydrating;
  // @monaco-editor/react retains its initial onMount callback while loading.
  const latest = useRef(params); latest.current = params;

  const handleEditorDidMount = (
    monacoEditor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    monacoEditorRef.current = monacoEditor;
    globalMonacoRef.current = monacoInstance;
    // State may have been reconstituted before Monaco's async loader mounted.
    // In that case the caret effects have already run without an editor.
    const mounted = latest.current;
    if (!mounted.hydrating && (mounted.mode === 'step' || mounted.mode === 'replay')) {
      applyEditorSelection(monacoEditor, mounted.currentEditor, mounted.currentCaretPosition);
      if (mounted.allowFocusInEditor) monacoEditor.focus();
    }

    if (scrollbarFadeStartRef) {
      // Monaco's private hide timer cannot be restored. Own the presentation
      // deadline in deterministic mode (500ms hold, 800ms linear fade).
      const now = () => (window as any).__virtualNow?.() ?? performance.now();
      const scroll = monacoEditor.onDidScrollChange(() => {
        if (suspended.current) return;
        scrollbarFadeStartRef.current = now() + 500;
        paintScrollbars(monacoEditor, scrollbarFadeStartRef.current, now());
      });
      let frame: number;
      const paint = () => {
        if (!suspended.current) paintScrollbars(monacoEditor, scrollbarFadeStartRef.current, now());
        frame = requestAnimationFrame(paint);
      };
      paint();
      monacoEditor.onDidDispose(() => { scroll.dispose(); cancelAnimationFrame(frame); });
    }
    if (modelViewStatesRef) {
      // Observe switches made by both our effects and @monaco-editor/react.
      // Its private cache cannot be serialized into a render checkpoint.
      const before = monacoEditor.onWillChangeModel(() => {
        const model = monacoEditor.getModel(), view = monacoEditor.saveViewState();
        if (model && view) modelViewStatesRef.current[model.uri.toString()] = view;
      });
      const after = monacoEditor.onDidChangeModel(() => {
        const model = monacoEditor.getModel();
        const view = model && modelViewStatesRef.current[model.uri.toString()];
        if (view) monacoEditor.restoreViewState(view);
      });
      monacoEditor.onDidDispose(() => { before.dispose(); after.dispose(); });
    }

    // Don't create a model here - let the model management useEffect handle it
    // This ensures proper file switching behavior in replay mode

    // (multiple-theme support graveyarded - see docs/MONACO_QUIRKS.md #3)
    monacoLoadedCallback && monacoLoadedCallback();
  };

  // caret position effect - now works for both replay and step modes since Monaco editor is always rendered
  useEffect(() => {
    if (hydrating) return;
    // Don't interfere if we're in the middle of restoring view state
    if (isRestoringViewStateRef.current) {
      return;
    }

    if (monacoEditorRef.current && (mode === 'step' || mode === 'replay')) {
      // Use setTimeout to ensure caret positioning happens after Monaco has finished updating content
      // This is especially important in step mode where content can change significantly
      const timer = setTimeout(() => {
        if (monacoEditorRef.current) {
          applyEditorSelection(monacoEditorRef.current, currentEditor, currentCaretPosition);

          // This only scrolls if the position is not already visible.
          monacoEditorRef.current.revealPosition({
            lineNumber: activeCaretPosition.row,
            column: activeCaretPosition.col
          });

          // trigger a focus to actually highlight where the caret is - if allowFocusInEditor is true
          if (allowFocusInEditor) {
            monacoEditorRef.current.focus();
          }
        }
      }, 0); // Execute on next tick to ensure Monaco has finished content updates

      return () => clearTimeout(timer);
    }
  }, [currentCaretPosition, currentEditor, allowFocusInEditor, mode]);

  // Additional effect to handle caret positioning after content changes in step mode
  useEffect(() => {
    if (hydrating) return;
    if (mode === 'step' && monacoEditorRef.current && !isRestoringViewStateRef.current) {
      // Use a longer timeout for content changes to ensure Monaco has finished all updates
      const timer = setTimeout(() => {
        if (monacoEditorRef.current) {
          applyEditorSelection(monacoEditorRef.current, currentEditor, currentCaretPosition);

          monacoEditorRef.current.revealPositionInCenter({
            lineNumber: activeCaretPosition.row,
            column: activeCaretPosition.col
          });

          if (allowFocusInEditor) {
            monacoEditorRef.current.focus();
          }
        }
      }, 10); // Slightly longer delay for content changes

      return () => clearTimeout(timer);
    }
  }, [currentCode, mode, currentCaretPosition, currentEditor, allowFocusInEditor]);

  // Save/restore editor view state when overlays are shown/hidden to prevent caret position regression
  useEffect(() => {
    if (hydrating) return;
    const isOverlayActive = isSlideDisplayStep || isExternalWebPreviewDisplayStep || isExternalBrowserDisplayStep;

    if (monacoEditorRef.current) {
      if (isOverlayActive && !editorViewStateRef.current) {
        // Save view state before showing overlay (only if not already saved)
        debugLog('Saving editor view state before overlay, current position:', monacoEditorRef.current.getPosition());
        editorViewStateRef.current = monacoEditorRef.current.saveViewState();
      } else if (!isOverlayActive && editorViewStateRef.current) {
        // Restore view state after hiding overlay
        const savedState = editorViewStateRef.current;
        debugLog('Restoring editor view state after overlay');

        // Clear the saved state first to prevent re-triggering
        editorViewStateRef.current = null;

        // Set flag to prevent caret position effect from interfering
        isRestoringViewStateRef.current = true;

        // Use setTimeout to ensure the editor has finished any re-rendering
        setTimeout(() => {
          if (monacoEditorRef.current && savedState) {
            debugLog('Actually restoring view state, current position before restore:', monacoEditorRef.current.getPosition());

            // First restore the view state to get scroll position and other state
            monacoEditorRef.current.restoreViewState(savedState);

            debugLog('Position after restore:', monacoEditorRef.current.getPosition());
            debugLog('Expected position:', { row: currentCaretPosition.row, col: currentCaretPosition.col });

            // Then set the current caret position to ensure it's at the right place
            applyEditorSelection(monacoEditorRef.current, currentEditor, currentCaretPosition);

            // Reveal the position to ensure it's visible
            monacoEditorRef.current.revealPositionInCenter({
              lineNumber: activeCaretPosition.row,
              column: activeCaretPosition.col
            });

            debugLog('Final position after manual set:', monacoEditorRef.current.getPosition());

            // Clear the flag after restoration is complete
            isRestoringViewStateRef.current = false;
          }
        }, 0);
      }
    }
  }, [isSlideDisplayStep, isExternalWebPreviewDisplayStep, isExternalBrowserDisplayStep, currentCaretPosition, currentEditor]);

  // (highlight effect and caret auto-scroll graveyarded - see docs/MONACO_QUIRKS.md #1, #4)

  // Monaco model management for proper file switching
  // this useEffect FROM CLAUDE:
  useEffect(() => {
    if (hydrating) return;
    if (monacoEditorRef.current && globalMonacoRef.current) {
      const monacoInstance = globalMonacoRef.current;
      const editor = monacoEditorRef.current;

      // If there's no current editor filename, clear the model
      if (!currentEditor?.filename) {
        if (editor.getModel()) {
          editor.setModel(null);
          debugLog('Cleared Monaco editor model - no active editor');
        }
        return;
      }

      // Handle normal file switching when we have a current editor
      const filename = currentEditor.filename;

      // Create a unique URI for this file
      const uri = monacoInstance.Uri.parse(getEditorModelPath(filename));

      // Check if a model already exists for this file
      let model = monacoInstance.editor.getModel(uri);

      if (!model) {
        // Create a new model for this file
        const language = getLanguageFromFilename(filename);
        model = monacoInstance.editor.createModel(currentCode || '', language, uri);
        debugLog(`Created new Monaco model for file: ${filename} with language: ${language}, uri: ${uri} content length: ${(currentCode || '').length}`);
      } else {
        // In replay mode, don't update model content here since executeActionPlaybackForMonacoInstance
        // handles the typing animation. Only update in step mode or when file content changes significantly.
        if (mode === 'step' && model.getValue() !== currentCode) {
          model.setValue(currentCode || '');
          debugLog(`Updated Monaco model content for file: ${filename} (step mode), content length: ${(currentCode || '').length}`);
        } else if (mode === 'replay') {
          // In replay mode, only update if the model is completely empty or if we're switching files
          if (model.getValue() === '' && currentCode && currentCode !== '') {
            model.setValue(currentCode);
            debugLog(`Initialized Monaco model content for file: ${filename} (replay mode), content length: ${currentCode.length}`);
          }
        }
      }

      // Set the model on the editor if it's not already set
      if (editor.getModel() !== model) {
        editor.setModel(model);
        debugLog(`Switched Monaco editor to model for file: ${filename}`);
      }
    }
  }, [currentEditor?.filename, currentCode, mode]);

  // update the language of the editor based on the current filename every time it changes
  useEffect(() => {
    if (hydrating) return;
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

  return { handleEditorDidMount };
};
