import * as react_jsx_runtime from 'react/jsx-runtime';
import { Project, GUIMode } from '@fullstackcraftllc/codevideo-types';

interface CodeVideoIDEProps {
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
declare function CodeVideoIDE(props: CodeVideoIDEProps): react_jsx_runtime.JSX.Element;

export { CodeVideoIDE };
