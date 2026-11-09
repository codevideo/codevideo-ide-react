import { renderHook } from '@testing-library/react';
import { IEditor } from '@fullstackcraftllc/codevideo-types';
import { useMonacoModelManagement, UseMonacoModelManagementParams } from '../useMonacoModelManagement';

// A Monaco stand-in with real models keyed by URI, enough for the model effect.
const fakeMonaco = () => {
  const models = new Map<string, { value: string; getValue(): string; setValue(text: string): void }>();
  const model = (value: string) => ({ value, getValue() { return this.value; }, setValue(text: string) { this.value = text; } });
  let current: unknown = null;
  const monaco = {
    Uri: { parse: (uri: string) => ({ toString: () => uri }) },
    editor: {
      getModel: (uri: { toString(): string }) => models.get(uri.toString()) ?? null,
      setModelLanguage: () => {},
      createModel: (value: string, _language: string, uri: { toString(): string }) => {
        const created = model(value);
        models.set(uri.toString(), created);
        return created;
      },
    },
  };
  const editor = { getModel: () => current, setModel: (next: unknown) => { current = next; } };
  return { monaco, editor, models, model };
};

const editorFor = (filename: string, content: string): IEditor => ({
  filename, content, isActive: true, isSaved: false, caretPosition: { row: 1, col: 1 }, highlightCoordinates: null,
});

const paramsFor = (fake: ReturnType<typeof fakeMonaco>, editor: IEditor, currentCode: string): UseMonacoModelManagementParams => ({
  mode: 'replay', allowFocusInEditor: false, currentEditor: editor,
  currentFileName: editor.filename, currentCode, currentCaretPosition: { row: 1, col: 1 },
  isSlideDisplayStep: false, isExternalWebPreviewDisplayStep: false, isExternalBrowserDisplayStep: false,
  monacoEditorRef: { current: fake.editor as any }, globalMonacoRef: { current: fake.monaco as any },
  editorViewStateRef: { current: null }, isRestoringViewStateRef: { current: false },
  setCurrentEditorLanguage: jest.fn(),
});

test('a file created during replay starts empty, not with the previous file\'s code', () => {
  const fake = fakeMonaco();
  // The commit that switches to b.ts still carries a.ts's code in currentCode.
  renderHook(() => useMonacoModelManagement(paramsFor(fake, editorFor('b.ts', ''), "export const fromA = 'a';\n")));
  expect(Array.from(fake.models.values()).map(model => model.getValue())).toEqual(['']);
});

test('the empty model the editor\'s path prop made is filled from that file\'s own text', () => {
  const fake = fakeMonaco();
  const uri = 'file:///src/App.tsx';
  fake.models.set(uri, fake.model(''));
  renderHook(() => useMonacoModelManagement(paramsFor(fake, editorFor('src/App.tsx', 'export const App = 1;'), 'stale text from another file')));
  expect(fake.models.get(uri)!.getValue()).toBe('export const App = 1;');
});
