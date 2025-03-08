import { Project, extractActionsFromProject } from "@fullstackcraftllc/codevideo-types";
import { VirtualIDE } from "@fullstackcraftllc/codevideo-virtual-ide";

export const reconstituteAllPartsOfState = (project: Project, currentActionIndex: number, currentLessonIndex: number | null) => {
    // console.log("project is ", project)
    // console.log("currentLessonIndex is ", currentLessonIndex)
    const actions = extractActionsFromProject(project, currentLessonIndex)
    // console.log("actions extracted are ", actions)
    const actionsToApply = actions.slice(0, currentActionIndex + 1)
    const virtualIDE = new VirtualIDE(project, undefined, true);
    virtualIDE.applyActions(actionsToApply);
    // console.log("applied actions", actionsToApply);
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