import { Project, extractActionsFromProject, isLesson } from "@fullstackcraftllc/codevideo-types";
import { VirtualIDE } from "@fullstackcraftllc/codevideo-virtual-ide";
import { DEFAULT_CARET_POSITION } from "../constants/CodeVideoIDEConstants.js";

export const reconstituteAllPartsOfState = (project: Project, currentActionIndex: number, currentLessonIndex: number | null) => {
    const actions = extractActionsFromProject(project, currentLessonIndex)
    let sanitizedCurrentActionIndex = currentActionIndex;
    // action index can be maximum of actions.length - 1
    if (currentActionIndex >= actions.length) {
      sanitizedCurrentActionIndex = actions.length - 1;
    }
    // action index can be minimum of 0
    if (currentActionIndex < 0) {
      sanitizedCurrentActionIndex = 0;
    }
    const actionsToApply = actions.slice(0, sanitizedCurrentActionIndex + 1)
    // activate verbose to true if debugging is needed
    // the constructor should also handle if the project is a lesson with initial snapshot
    const virtualIDE = new VirtualIDE(project, undefined, false);

    if (isLesson(project) && project.initialSnapshot) {
      console.log("[reconstituteAllPartsOfState] Detected lesson project WITH initial snapshot, initial snapshot should have been applied.");
      console.log(`[reconstituteAllPartsOfState] virtualIDE.virtualEditors.length: ${virtualIDE.virtualEditors.length}`);
      console.log(`[reconstituteAllPartsOfState] project.initialSnapshot.editorSnapshot.editors.length: ${project.initialSnapshot.editorSnapshot.editors.length}`);
    }

    virtualIDE.applyActions(actionsToApply);
    const courseSnapshot = virtualIDE.getCourseSnapshot();
    const editors = courseSnapshot.editorSnapshot.editors;
    const currentEditor = editors?.find(editor => editor.isActive) || editors?.[0] || {
      filename: '',
      content: '',
      caretPosition: DEFAULT_CARET_POSITION,
      highlightCoordinates: null,
      isActive: false,
      isSaved: false
    };
    const currentFilename = currentEditor.filename;
    const fileExplorerSnapshot = courseSnapshot.fileExplorerSnapshot;
    const currentCode = currentEditor ? currentEditor.content : '';
    const currentCaretPosition = currentEditor.caretPosition;
    const currentTerminalBuffer = virtualIDE.virtualTerminals.length > 0 ? virtualIDE.virtualTerminals[0]?.getBuffer().join('\n') || '' : '';
    const captionText = courseSnapshot?.authorSnapshot.authors[0]?.currentSpeechCaption || '';
    const mouseSnapshot = courseSnapshot?.mouseSnapshot;
    const isUnsavedChangesDialogOpen = courseSnapshot.isUnsavedChangesDialogOpen;
    const unsavedFileName = courseSnapshot.unsavedFileName;
    return { editors, currentEditor, currentFilename, fileExplorerSnapshot, currentCode, currentCaretPosition, currentTerminalBuffer, captionText, actions, mouseSnapshot, isUnsavedChangesDialogOpen, unsavedFileName };
  }