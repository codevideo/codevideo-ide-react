import { IEditor } from '@fullstackcraftllc/codevideo-types';
export interface IEditorTabsProps {
    editors: Array<IEditor>;
    theme: 'light' | 'dark';
}
export declare function EditorTabs(props: IEditorTabsProps): import("react/jsx-runtime").JSX.Element;
