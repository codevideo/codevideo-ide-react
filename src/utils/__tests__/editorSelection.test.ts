import { applyEditorSelection } from '../editorSelection';
import type { IEditor } from '@fullstackcraftllc/codevideo-types';

const snapshot: IEditor = {
  filename: 'test.ts', content: 'hello', isActive: true, isSaved: true,
  caretPosition: { row: 1, col: 2 },
  highlightCoordinates: { start: { row: 1, col: 6 }, end: { row: 1, col: 2 } },
};

test('does not reapply an unchanged selection on non-editing action commits', () => {
  const editor = {
    getSelection: () => ({ selectionStartLineNumber: 1, selectionStartColumn: 6, positionLineNumber: 1, positionColumn: 2 }),
    setSelection: jest.fn(), setPosition: jest.fn(),
  };
  applyEditorSelection(editor as any, snapshot, { row: 1, col: 1 });
  expect(editor.setSelection).not.toHaveBeenCalled();
  expect(editor.setPosition).not.toHaveBeenCalled();
});

test('collapses an active selection when the snapshot has only a caret, even at the same active endpoint', () => {
  const editor = {
    getSelection: () => ({ selectionStartLineNumber: 1, selectionStartColumn: 6, positionLineNumber: 1, positionColumn: 2 }),
    setSelection: jest.fn(), setPosition: jest.fn(),
  };
  applyEditorSelection(editor as any, { ...snapshot, highlightCoordinates: null }, { row: 1, col: 1 });
  expect(editor.setPosition).toHaveBeenCalledWith({ lineNumber: 1, column: 2 });
});

// Both Monaco owners must use exactly the same URI, including encoded filenames.
import { getEditorModelPath } from '../getEditorModelPath';
test('model paths are SSR-safe and encode filename delimiters', () => {
  expect(getEditorModelPath('src/a #1.ts')).toBe('file:///src/a%20%231.ts');
  expect(getEditorModelPath('/src/a.ts')).toBe('file:///src/a.ts');
  expect(getEditorModelPath('src\\a.ts')).toBe('file:///src/a.ts');
});
