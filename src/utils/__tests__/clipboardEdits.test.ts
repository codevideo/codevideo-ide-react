import { VirtualEditor } from '@fullstackcraftllc/codevideo-virtual-editor';
import type { IAction, IClipboard } from '@fullstackcraftllc/codevideo-types';
import { cutRange, pasteEdit, EditRange, SelectionLike } from '../clipboardEdits';

// The renderer's cut and paste must leave exactly the text and caret that
// VirtualEditor validates, or the video drifts from the lesson. Each scene runs
// through the real VirtualEditor and through the renderer's edits on a plain
// text model (applied the way Monaco's executeEdits applies them), and both
// must agree.

const act = (name: string, value = '1') => ({ name, value } as IAction);

function textModel(code: string) {
  let value = code;
  const lines = () => value.split('\n');
  const offset = (line: number, column: number) =>
    lines().slice(0, line - 1).reduce((sum, text) => sum + text.length + 1, 0) + column - 1;
  return {
    getLineCount: () => lines().length,
    getLineMaxColumn: (line: number) => lines()[line - 1].length + 1,
    apply: (range: EditRange, text: string) => {
      value = value.slice(0, offset(range.startLineNumber, range.startColumn)) + text + value.slice(offset(range.endLineNumber, range.endColumn));
    },
    text: () => value,
  };
}

function recordingClipboard(): IClipboard & { state: { text: string; isFullLine: boolean } } {
  const state = { text: '', isFullLine: false };
  return {
    state,
    getText: () => state.text,
    isFullLine: () => state.isFullLine,
    setText: (text: string, isFullLine = false) => {
      if (text === '') return;
      state.text = text;
      state.isFullLine = isFullLine;
    },
  };
}

// The Monaco selection matching where VirtualEditor's anchor and caret are.
function selectionOf(editor: VirtualEditor): SelectionLike {
  const caret = editor.getCurrentCaretPosition();
  const anchor = editor.getCurrentHighlightCoordinates()?.start ?? caret;
  const anchorFirst = anchor.row < caret.row || (anchor.row === caret.row && anchor.col <= caret.col);
  const [start, end] = anchorFirst ? [anchor, caret] : [caret, anchor];
  return {
    startLineNumber: start.row, startColumn: start.col, endLineNumber: end.row, endColumn: end.col,
    positionLineNumber: caret.row, positionColumn: caret.col,
  };
}

interface Scene { name: string; code: string; setup: IAction[]; key: 'editor-command-x' | 'editor-command-v' }

const scenes: Scene[] = [
  { name: 'cut a selection on one line', code: 'abc def', setup: [act('editor-command-right'), act('editor-shift+arrow-left', '3')], key: 'editor-command-x' },
  { name: 'cut a backward selection across lines', code: 'a1\nb2\nc3', setup: [act('editor-arrow-down', '2'), act('editor-command-right'), act('editor-shift+arrow-left', '5')], key: 'editor-command-x' },
  { name: 'cut a whole line with lines below it', code: 'one\ntwo\nthree', setup: [act('editor-arrow-down'), act('editor-arrow-right', '2')], key: 'editor-command-x' },
  { name: 'cut the whole last line', code: 'one\ntwo', setup: [act('editor-arrow-down')], key: 'editor-command-x' },
  { name: 'cut the only line', code: 'solo', setup: [], key: 'editor-command-x' },
  { name: 'paste a copied word', code: 'hello world', setup: [act('editor-command-right'), act('editor-shift+arrow-left', '5'), act('editor-command-c'), act('editor-command-left')], key: 'editor-command-v' },
  { name: 'paste over a selection', code: 'foo bar', setup: [act('editor-shift+arrow-right', '3'), act('editor-command-c'), act('editor-command-right'), act('editor-shift+arrow-left', '3')], key: 'editor-command-v' },
  { name: 'paste lines in the middle of a line', code: 'a1\nb2\nc3', setup: [act('editor-arrow-down', '2'), act('editor-command-right'), act('editor-shift+arrow-left', '5'), act('editor-command-c'), act('editor-arrow-up'), act('editor-command-left'), act('editor-arrow-right')], key: 'editor-command-v' },
  { name: 'paste a whole line above the caret', code: 'first\nsecond\nthird', setup: [act('editor-arrow-down'), act('editor-arrow-right', '3'), act('editor-command-c'), act('editor-arrow-down')], key: 'editor-command-v' },
  { name: 'paste a whole line over a selection', code: 'x\nkeep', setup: [act('editor-command-c'), act('editor-arrow-down'), act('editor-shift+arrow-right', '4')], key: 'editor-command-v' },
];

describe('the renderer cuts and pastes exactly what VirtualEditor does', () => {
  it.each(scenes)('$name', ({ code, setup, key }) => {
    const clipboard = recordingClipboard();
    const editor = new VirtualEditor(code.split('\n'), undefined, false, clipboard);
    editor.applyActions(setup);

    const model = textModel(editor.getCode());
    const selection = selectionOf(editor);
    let caret: { lineNumber: number; column: number };
    if (key === 'editor-command-x') {
      const range = cutRange(selection, model);
      model.apply(range, '');
      caret = { lineNumber: range.startLineNumber, column: range.startColumn };
    } else {
      const { range, caretAfter } = pasteEdit(selection, clipboard.state.text, clipboard.state.isFullLine);
      model.apply(range, clipboard.state.text);
      caret = caretAfter;
    }

    editor.applyAction(act(key));
    expect(model.text()).toEqual(editor.getCode());
    const expected = editor.getCurrentCaretPosition();
    expect(caret).toEqual({ lineNumber: expected.row, column: expected.col });
  });
});
