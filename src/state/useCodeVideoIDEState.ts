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
export const useCodeVideoIDEState = (defaultLanguage: string) => {
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
    isRestoringViewStateRef,
  };
};

export type CodeVideoIDEState = ReturnType<typeof useCodeVideoIDEState>;
