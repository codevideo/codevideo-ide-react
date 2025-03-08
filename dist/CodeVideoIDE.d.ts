import React from 'react';
import * as monaco from 'monaco-editor';
import { GUIMode, IAction, IPoint, Project } from '@fullstackcraftllc/codevideo-types';
export interface CodeVideoIDEProps {
    theme: 'light' | 'dark';
    project: Project;
    mode: GUIMode;
    allowFocusInEditor: boolean;
    currentActionIndex: number;
    currentLessonIndex: number | null;
    defaultLanguage: string;
    isExternalBrowserStepUrl: string | null;
    isSoundOn: boolean;
    actionFinishedCallback: () => void;
}
/**
 * Represents a powerful IDE with file explorer, multiple editors, and terminal
 * @param props
 * @returns
 */
export declare function CodeVideoIDE(props: CodeVideoIDEProps): import("react/jsx-runtime").JSX.Element;
export declare const executeActionPlaybackForMonacoInstance: (editor: monaco.editor.IStandaloneCodeEditor, project: Project, currentActionIndex: number, currentLessonIndex: number | null, action: IAction, isSoundOn: boolean, setEditors: (value: any) => void, setCurrentEditor: (value: any) => void, setCurrentFileName: (value: any) => void, setCurrentCaretPosition: (value: any) => void, setTerminalBuffer: (value: any) => void, mousePosition: IPoint, containerRef: React.RefObject<HTMLDivElement | null>, setMousePosition: (value: any) => void, setCaptionText: (value: any) => void) => Promise<number>;
