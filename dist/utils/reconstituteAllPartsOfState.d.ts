import { Project } from "@fullstackcraftllc/codevideo-types";
export declare const reconstituteAllPartsOfState: (project: Project, currentActionIndex: number, currentLessonIndex: number | null) => {
    editors: import("@fullstackcraftllc/codevideo-types").IEditor[];
    currentEditor: import("@fullstackcraftllc/codevideo-types").IEditor;
    currentFilename: string;
    fileStructure: import("@fullstackcraftllc/codevideo-types").IFileStructure;
    currentCode: string;
    currentCaretPosition: {
        row: number;
        col: number;
    };
    currentTerminalBuffer: string;
    captionText: string;
    actions: import("@fullstackcraftllc/codevideo-types").IAction[];
};
