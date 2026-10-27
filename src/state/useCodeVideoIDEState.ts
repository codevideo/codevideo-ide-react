import { useRef, useState } from 'react';
import { IEditor, IEditorPosition, IFileStructure, IPoint } from '@fullstackcraftllc/codevideo-types';
import { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { DEFAULT_CARET_POSITION, DEFAULT_MOUSE_POSITION } from '../constants/CodeVideoIDEConstants.js';

/**
 * All of CodeVideoIDE's mutable state and refs, moved en bloc from the
 * component body. Declaration order is preserved from the original component.
 *
 * This hook MUST be called first in the component so its useState order is
 * trivially stable, and because everything else (playback, step-mode
 * derivation, Monaco management) receives these values and setters.
 */
export interface RenderUIState {
  editors?: Array<IEditor>;
  currentEditor?: IEditor;
  currentFileName?: string;
  currentFileStructure?: IFileStructure;
  currentCode: string;
  terminalBuffer: string;
  targetMousePosition: IPoint;
  currentMousePosition: IPoint;
  currentCaretPosition: IEditorPosition;
  captionText: string;
  currentEditorLanguage: string;
  isFileExplorerContextMenuVisible: boolean;
  isFileContextMenuVisible: boolean;
  isFolderContextMenuVisible: boolean;
  isNewFileInputVisible: boolean;
  isNewFolderInputVisible: boolean;
  newFileInputValue: string;
  newFolderInputValue: string;
  originalFileBeingRenamed: string;
  originalFolderBeingRenamed: string;
  renameFileInputValue: string;
  renameFolderInputValue: string;
  currentHoveredFileName: string;
  currentHoveredFolderName: string;
  newFileParentPath: string;
  newFolderParentPath: string;
  currentHoveredEditorTabFileName: string;
  isUnsavedChangesDialogOpen: boolean;
  unsavedFileName: string;
  currentExternalBrowserScrollPosition: number;
}

export const useCodeVideoIDEState = (defaultLanguage: string, initial?: RenderUIState) => {
  const [editors, setEditors] = useState<Array<IEditor> | undefined>(initial?.editors);
  const [currentEditor, setCurrentEditor] = useState<IEditor | undefined>(initial?.currentEditor);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(initial?.currentFileName);
  const [currentFileStructure, setCurrentFileStructure] = useState<IFileStructure | undefined>(initial?.currentFileStructure);
  const [currentCode, setCurrentCode] = useState<string>(initial?.currentCode ?? '');
  const [terminalBuffer, setTerminalBuffer] = useState<string>(initial?.terminalBuffer ?? '');
  const [targetMousePosition, setTargetMousePosition] = useState<IPoint>(initial?.targetMousePosition ?? DEFAULT_MOUSE_POSITION);
  const [currentMousePosition, setCurrentMousePosition] = useState<IPoint>(initial?.currentMousePosition ?? DEFAULT_MOUSE_POSITION);
  const [currentCaretPosition, setCurrentCaretPosition] = useState<IEditorPosition>(initial?.currentCaretPosition ?? DEFAULT_CARET_POSITION);
  const [captionText, setCaptionText] = useState<string>(initial?.captionText ?? '');
  const [currentEditorLanguage, setCurrentEditorLanguage] = useState<string>(initial?.currentEditorLanguage ?? defaultLanguage);
  const [isFileExplorerContextMenuVisible, setIsFileExplorerContextMenuVisible] = useState<boolean>(initial?.isFileExplorerContextMenuVisible ?? false);
  const [isFileContextMenuVisible, setIsFileContextMenuVisible] = useState<boolean>(initial?.isFileContextMenuVisible ?? false)
  const [isFolderContextMenuVisible, setIsFolderContextMenuVisible] = useState<boolean>(initial?.isFolderContextMenuVisible ?? false)
  const [isNewFileInputVisible, setIsNewFileInputVisible] = useState<boolean>(initial?.isNewFileInputVisible ?? false)
  const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState<boolean>(initial?.isNewFolderInputVisible ?? false)
  const [newFileInputValue, setNewFileInputValue] = useState<string>(initial?.newFileInputValue ?? "")
  const [newFolderInputValue, setNewFolderInputValue] = useState<string>(initial?.newFolderInputValue ?? "")
  const [originalFileBeingRenamed, setOriginalFileBeingRenamed] = useState<string>(initial?.originalFileBeingRenamed ?? "")
  const [originalFolderBeingRenamed, setOriginalFolderBeingRenamed] = useState<string>(initial?.originalFolderBeingRenamed ?? "")
  const [renameFileInputValue, setRenameFileInputValue] = useState<string>(initial?.renameFileInputValue ?? "")
  const [renameFolderInputValue, setRenameFolderInputValue] = useState<string>(initial?.renameFolderInputValue ?? "")
  const [currentHoveredFileName, setCurrentHoveredFileName] = useState<string>(initial?.currentHoveredFileName ?? "")
  const [currentHoveredFolderName, setCurrentHoveredFolderName] = useState<string>(initial?.currentHoveredFolderName ?? "")
  const [newFileParentPath, setNewFileParentPath] = useState<string>(initial?.newFileParentPath ?? "")
  const [newFolderParentPath, setNewFolderParentPath] = useState<string>(initial?.newFolderParentPath ?? "")
  const [currentHoveredEditorTabFileName, setCurrentHoveredEditorTabFileName] = useState<string>(initial?.currentHoveredEditorTabFileName ?? "")
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState<boolean>(initial?.isUnsavedChangesDialogOpen ?? false);
  const [unsavedFileName, setUnsavedFileName] = useState<string>(initial?.unsavedFileName ?? "");
  const [currentExternalBrowserScrollPosition, setCurrentExternalBrowserScrollPosition] = useState<number>(initial?.currentExternalBrowserScrollPosition ?? 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  const globalMonacoRef = useRef<Monaco | undefined>(undefined);

  // Store editor view state to preserve caret position when overlays are shown/hidden
  const editorViewStateRef = useRef<monaco.editor.ICodeEditorViewState | null>(null);
  const terminalCaretDeadlineRef = useRef<number | null>(null);
  const scrollbarFadeStartRef = useRef<number | null>(null);
  const modelViewStatesRef = useRef<Record<string, monaco.editor.ICodeEditorViewState>>({});
  const isRestoringViewStateRef = useRef<boolean>(false);

  return {
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
    modelViewStatesRef,
    scrollbarFadeStartRef,
    terminalCaretDeadlineRef,
    isRestoringViewStateRef,
  };
};

export type CodeVideoIDEState = ReturnType<typeof useCodeVideoIDEState>;
