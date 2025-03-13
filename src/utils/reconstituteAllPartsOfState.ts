import { Project, extractActionsFromProject } from "@fullstackcraftllc/codevideo-types";
import { VirtualIDE } from "@fullstackcraftllc/codevideo-virtual-ide";
import { DEFAULT_CARET_POSITION } from "../constants/CodeVideoIDEConstants";

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
    const virtualIDE = new VirtualIDE(project, undefined, false);
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
    const fileStructure = courseSnapshot.fileExplorerSnapshot.fileStructure;
    const currentCode = currentEditor ? currentEditor.content : '';
    const currentCaretPosition = virtualIDE.virtualEditors && virtualIDE.virtualEditors.length > 0 ? virtualIDE.virtualEditors[0]?.virtualEditor.getCurrentCaretPosition() || DEFAULT_CARET_POSITION : DEFAULT_CARET_POSITION;
    const currentTerminalBuffer = virtualIDE.virtualTerminals.length > 0 ? virtualIDE.virtualTerminals[0]?.getBuffer().join('\n') || '' : '';
    const captionText = courseSnapshot?.authorSnapshot.authors[0]?.currentSpeechCaption || '';
    return { editors, currentEditor, currentFilename, fileStructure, currentCode, currentCaretPosition, currentTerminalBuffer, captionText, actions }
  }