import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { IAction } from '@fullstackcraftllc/codevideo-types';

/**
 * TypeScript squiggles through the whole component, with a stub editor and a
 * stub TypeScript worker: off by default with Monaco's options untouched, and
 * on with squiggle styles, decorations and the hover in step mode.
 */

const mockModels: any[] = [];
const mockCurrent: { model: any } = { model: null };
const mockWorkerCalls: string[] = [];

const mockMakeModel = (content: string, _language: string, uri: { toString(): string }) => {
  const ranges = new Map<string, any>();
  let next = 0;
  const model = {
    uri, value: content,
    getValue: () => model.value,
    setValue: (value: string) => { model.value = value; ranges.clear(); },
    getLineCount: () => model.value.split('\n').length,
    getLineMaxColumn: (line: number) => model.value.split('\n')[line - 1].length + 1,
    getLineFirstNonWhitespaceColumn: () => 1,
    getLanguageId: () => 'typescript',
    deltaDecorations: (old: string[], added: any[]) => {
      old.forEach(id => ranges.delete(id));
      return added.map(decoration => { const id = `d${++next}`; ranges.set(id, decoration.range); return id; });
    },
    getDecorationRange: (id: string) => ranges.get(id) ?? null,
  };
  mockModels.push(model);
  return model;
};

const mockEditorStub = {
  getModel: jest.fn(() => mockCurrent.model),
  setModel: jest.fn((model: any) => { mockCurrent.model = model; }),
  setPosition: jest.fn(),
  setSelection: jest.fn(),
  revealPosition: jest.fn(),
  revealPositionInCenter: jest.fn(),
  revealLineInCenter: jest.fn(),
  revealPositionInCenterIfOutsideViewport: jest.fn(),
  focus: jest.fn(),
  saveViewState: jest.fn(() => ({ scrollTop: 0 })),
  restoreViewState: jest.fn(),
  getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
  getDomNode: jest.fn(() => document.body),
  getScrolledVisiblePosition: jest.fn((position: { column: number }) => ({ top: 40, left: 10 * position.column, height: 20 })),
  trigger: jest.fn(),
};

const mockMonacoStub = {
  Uri: { parse: (uri: string) => ({ path: uri, toString: () => uri }) },
  editor: {
    getModel: jest.fn((uri: { toString(): string }) => mockModels.find(model => model.uri.toString() === uri.toString()) ?? null),
    getModels: jest.fn(() => mockModels),
    createModel: jest.fn(mockMakeModel),
    setModelLanguage: jest.fn(),
    createWebWorker: jest.fn(() => ({
      dispose: jest.fn(),
      getProxy: async () => ({
        updateExtraLibs: async (libs: Record<string, { content: string }>) => { mockWorkerCalls.push(`libs:${Object.keys(libs).sort().join(',')}`); },
        getSyntacticDiagnostics: async (fileName: string) => { mockWorkerCalls.push(`syntax:${fileName}`); return []; },
        getSemanticDiagnostics: async (fileName: string) => {
          mockWorkerCalls.push(`types:${fileName}`);
          const content = mockModels.find(model => model.uri.toString() === 'file:///src/generics.ts')?.value ?? '';
          const start = content.indexOf('"cat"');
          return start < 0 ? [] : [{ start, length: 5, category: 1, code: 2345, messageText: 'Argument of type \'"cat"\' is not assignable to parameter of type \'keyof IFooBar\'.' }];
        },
      }),
    })),
  },
};

const mockOptions = jest.fn();

jest.mock('@monaco-editor/react', () => {
  const ReactLocal = require('react');
  return {
    Editor: ({ onMount, options }: { onMount?: (editor: any, monaco: any) => void; options?: any }) => {
      mockOptions(options);
      ReactLocal.useEffect(() => { onMount && onMount(mockEditorStub, mockMonacoStub); }, []);
      return ReactLocal.createElement('div', { 'data-testid': 'monaco-editor-stub' });
    },
  };
});
jest.mock('../../SlideViewer/SlideViewer', () => ({ SlideViewer: () => <div /> }));
jest.mock('../../ExternalWebViewer/ExternalWebViewer', () => ({ ExternalWebViewer: () => <div /> }));
jest.mock('../../WebPreview/WebPreview', () => ({ WebPreview: () => <div /> }));
jest.mock('../../FileExplorer/FileExplorer', () => ({ FileExplorer: () => <div /> }));
jest.mock('../../Editor/EditorTabs', () => ({ EditorTabs: () => <div /> }));
jest.mock('../../Terminal/Terminal', () => ({ Terminal: () => <div /> }));
jest.mock('../../MouseOverlay/MouseOverlay', () => ({ MouseOverlay: () => null }));
jest.mock('../../CaptionOverlay/CaptionOverlay', () => ({ CaptionOverlay: () => null }));
jest.mock('../../EmbedOverlay/EmbedOverlay', () => ({ EmbedOverlay: () => null }));
jest.mock('../../UnsavedChangesDialog/UnsavedChangesDialog', () => ({ UnsavedChangesDialog: () => null }));
jest.mock('../../utils/speakText', () => ({ speakText: jest.fn().mockResolvedValue(undefined), stopSpeaking: jest.fn() }));

import { CodeVideoIDE, CodeVideoIDEProps } from '../../CodeVideoIDE.jsx';

const a = (name: string, value: string): IAction => ({ name, value } as IAction);
const lesson = [
  a('file-explorer-create-file', 'src/generics.ts'),
  a('file-explorer-open-file', 'src/generics.ts'),
  a('editor-type', 'interface IFooBar { foo: string; bar: number; }\nsortByKey<IFooBar>(fooBars, "cat");'),
  a('mouse-move-editor-diagnostic', 'src/generics.ts:2:30'),
  a('author-speak-before', 'TypeScript tells us "cat" is not a key of IFooBar.'),
];

const baseProps: CodeVideoIDEProps = {
  mode: 'step', currentLessonIndex: null, theme: 'dark', allowFocusInEditor: false, defaultLanguage: 'typescript',
  isExternalBrowserStepUrl: null, isSoundOn: false, withCaptions: false, resolution: '1080p',
  actionFinishedCallback: jest.fn(), speakActionAudios: [], project: lesson, currentActionIndex: 4,
};

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => { jest.advanceTimersByTime(50); });
  }
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockModels.length = 0;
  mockCurrent.model = null;
  mockWorkerCalls.length = 0;
  mockOptions.mockClear();
  mockMonacoStub.editor.createWebWorker.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('changes nothing for projects without diagnostics', async () => {
  const plain = lesson.slice(0, 3);
  const { container } = render(<Theme><CodeVideoIDE {...baseProps} project={plain} currentActionIndex={2} /></Theme>);
  await settle();
  expect(mockOptions).toHaveBeenCalled();
  for (const [options] of mockOptions.mock.calls) expect(options).not.toHaveProperty('renderValidationDecorations');
  expect(mockMonacoStub.editor.createWebWorker).not.toHaveBeenCalled();
  expect(container.innerHTML).not.toContain('codevideo-squiggly');
  expect(screen.queryByTestId('codevideo-diagnostic-hover')).toBeNull();
});

it('draws the squiggle and shows the hover under the mouse when the option is on', async () => {
  const { container } = render(<Theme><CodeVideoIDE {...baseProps} isDiagnosticsVisible /></Theme>);
  await settle();
  expect(mockOptions.mock.calls.at(-1)?.[0].renderValidationDecorations).toBe('off');
  expect(container.innerHTML).toContain('.monaco-editor .codevideo-squiggly-error');
  expect(mockWorkerCalls).toEqual(['libs:file:///__codevideo__/shims.d.ts,file:///src/generics.ts', 'syntax:file:///src/generics.ts', 'types:file:///src/generics.ts']);
  const hover = await screen.findByTestId('codevideo-diagnostic-hover');
  expect(hover.textContent).toBe('Argument of type \'"cat"\' is not assignable to parameter of type \'keyof IFooBar\'.ts(2345)');
});

it('turns squiggles on with an action, and closes the hover once a non-author action runs', async () => {
  const actions = [a('editor-show-diagnostics', '1'), ...lesson, a('editor-type', ' ')];
  const view = render(<Theme><CodeVideoIDE {...baseProps} project={actions} currentActionIndex={5} /></Theme>);
  await settle();
  expect(await screen.findByTestId('codevideo-diagnostic-hover')).toBeTruthy();
  view.rerender(<Theme><CodeVideoIDE {...baseProps} project={actions} currentActionIndex={6} /></Theme>);
  await settle();
  expect(screen.queryByTestId('codevideo-diagnostic-hover')).toBeNull();
});
