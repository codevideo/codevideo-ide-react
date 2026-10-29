import { renderHook } from '@testing-library/react';
import { useMonacoModelManagement, UseMonacoModelManagementParams } from '../useMonacoModelManagement';

test('an onMount callback retained by the async loader uses the latest snapshot', () => {
  const params: UseMonacoModelManagementParams = {
    mode: 'step', allowFocusInEditor: true, currentEditor: undefined,
    currentFileName: undefined, currentCode: '', currentCaretPosition: { row: 1, col: 1 },
    isSlideDisplayStep: false, isExternalWebPreviewDisplayStep: false, isExternalBrowserDisplayStep: false,
    monacoEditorRef: { current: undefined }, globalMonacoRef: { current: undefined },
    editorViewStateRef: { current: null }, isRestoringViewStateRef: { current: false },
    setCurrentEditorLanguage: jest.fn(),
  };
  const { result, rerender } = renderHook(props => useMonacoModelManagement(props), { initialProps: params });
  const retainedOnMount = result.current.handleEditorDidMount;
  rerender({ ...params, currentCode: 'hello', currentEditor: {
    filename: 'selection.ts', content: 'hello', isActive: true, isSaved: true,
    caretPosition: { row: 1, col: 2 },
    highlightCoordinates: { start: { row: 1, col: 6 }, end: { row: 1, col: 2 } },
  } });
  const editor = { setSelection: jest.fn(), setPosition: jest.fn(), focus: jest.fn() };
  retainedOnMount(editor as any, {} as any);
  expect(editor.setSelection).toHaveBeenCalledWith({
    selectionStartLineNumber: 1, selectionStartColumn: 6, positionLineNumber: 1, positionColumn: 2,
  });
  expect(editor.setPosition).not.toHaveBeenCalled();
});
