// The edits Cmd+X and Cmd+V make in Monaco, matching how codevideo-virtual-editor
// applies them (VS Code's rules), so the screen never drifts from the validated
// text. Plain range objects: `new monaco.Range` breaks SSR (docs/MONACO_QUIRKS.md).

export interface EditRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface EditPosition {
  lineNumber: number;
  column: number;
}

/** The parts of a Monaco selection these edits read. */
export interface SelectionLike extends EditRange {
  positionLineNumber: number;
  positionColumn: number;
}

/** The parts of a Monaco text model these edits read. */
export interface ModelLike {
  getLineCount(): number;
  getLineMaxColumn(lineNumber: number): number;
}

const isEmpty = (selection: EditRange) =>
  selection.startLineNumber === selection.endLineNumber && selection.startColumn === selection.endColumn;

const rangeOf = (selection: EditRange): EditRange => ({
  startLineNumber: selection.startLineNumber,
  startColumn: selection.startColumn,
  endLineNumber: selection.endLineNumber,
  endColumn: selection.endColumn,
});

/**
 * What Cmd+X deletes: the selection, or with nothing selected the caret's whole
 * line. A line with lines below it goes with its line break; the last line goes
 * with the line break above it; the only line is emptied. The caret ends at the
 * start of the returned range.
 */
export function cutRange(selection: SelectionLike, model: ModelLike): EditRange {
  if (!isEmpty(selection)) return rangeOf(selection);
  const line = selection.positionLineNumber;
  if (line < model.getLineCount()) {
    return { startLineNumber: line, startColumn: 1, endLineNumber: line + 1, endColumn: 1 };
  }
  if (line > 1) {
    return { startLineNumber: line - 1, startColumn: model.getLineMaxColumn(line - 1), endLineNumber: line, endColumn: model.getLineMaxColumn(line) };
  }
  return { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: model.getLineMaxColumn(1) };
}

/**
 * Where Cmd+V puts the clipboard's text, and where the caret ends up. The text
 * replaces the selection and the caret lands after it, except that a whole line
 * copied with nothing selected, pasted with nothing selected, goes above the
 * caret's line and the caret stays with its own text.
 */
export function pasteEdit(selection: SelectionLike, text: string, isFullLine: boolean): { range: EditRange; caretAfter: EditPosition } {
  if (isFullLine && isEmpty(selection) && text.indexOf('\n') === text.length - 1) {
    const line = selection.positionLineNumber;
    return {
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      caretAfter: { lineNumber: line + 1, column: selection.positionColumn },
    };
  }
  const range = rangeOf(selection);
  const lines = text.split('\n');
  const caretAfter = lines.length === 1
    ? { lineNumber: range.startLineNumber, column: range.startColumn + text.length }
    : { lineNumber: range.startLineNumber + lines.length - 1, column: lines[lines.length - 1].length + 1 };
  return { range, caretAfter };
}
