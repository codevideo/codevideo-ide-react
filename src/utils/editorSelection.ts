import type * as monaco from 'monaco-editor';
import type { IEditor, IEditorPosition } from '@fullstackcraftllc/codevideo-types';

/** Snapshot start is the anchor, not the normalized range start. */
export function applyEditorSelection(
  editor: monaco.editor.IStandaloneCodeEditor,
  current: IEditor | undefined,
  caret: IEditorPosition,
): void {
  const highlight = current?.highlightCoordinates;
  const position = current?.caretPosition ?? caret;
  const anchor = highlight?.start ?? position;
  const active = highlight?.end ?? position;
  const existing = editor.getSelection?.();
  // Reapplying an unchanged selection restarts Monaco's occurrence-highlighter
  // work on every narration/wait commit, including just before a model switch.
  if (existing?.selectionStartLineNumber === anchor.row && existing.selectionStartColumn === anchor.col &&
      existing.positionLineNumber === active.row && existing.positionColumn === active.col) return;
  if (highlight) {
    editor.setSelection({
      selectionStartLineNumber: highlight.start.row,
      selectionStartColumn: highlight.start.col,
      positionLineNumber: highlight.end.row,
      positionColumn: highlight.end.col,
    });
  } else {
    editor.setPosition({ lineNumber: position.row, column: position.col });
  }
}

/** Logical-line movement shared by replay arrows and anchored selection. No runtime Monaco import. */
export function moveEditorSelection(editor: monaco.editor.IStandaloneCodeEditor, action: string): void {
  const model = editor.getModel();
  const caret = editor.getPosition();
  if (!model || !caret) return;
  let { lineNumber, column } = caret;
  const selecting = action.includes('shift');
  const boundary = action.includes('command') || action.endsWith('+home') || action.endsWith('+end');
  if (boundary) {
    column = action.endsWith('right') || action.endsWith('+end') ? model.getLineMaxColumn(lineNumber) : 1;
  } else if (action.endsWith('right')) {
    if (column < model.getLineMaxColumn(lineNumber)) column++;
    else if (lineNumber < model.getLineCount()) { lineNumber++; column = 1; }
  } else if (action.endsWith('left')) {
    if (column > 1) column--;
    else if (lineNumber > 1) { lineNumber--; column = model.getLineMaxColumn(lineNumber); }
  } else {
    lineNumber = Math.max(1, Math.min(model.getLineCount(), lineNumber + (action.endsWith('down') ? 1 : -1)));
    column = Math.min(column, model.getLineMaxColumn(lineNumber));
  }
  if (selecting) {
    const selection = editor.getSelection();
    editor.setSelection({
      selectionStartLineNumber: selection?.selectionStartLineNumber ?? caret.lineNumber,
      selectionStartColumn: selection?.selectionStartColumn ?? caret.column,
      positionLineNumber: lineNumber,
      positionColumn: column,
    });
  } else {
    editor.setPosition({ lineNumber, column });
  }
  editor.revealPosition({ lineNumber, column });
}
