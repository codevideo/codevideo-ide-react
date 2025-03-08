import { IFileStructure } from '@fullstackcraftllc/codevideo-types';
export interface IFileExplorerProps {
    theme: 'light' | 'dark';
    currentFileName?: string;
    fileStructure?: IFileStructure;
}
export declare function FileExplorer(props: IFileExplorerProps): import("react/jsx-runtime").JSX.Element;
