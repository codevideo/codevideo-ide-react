import React from 'react';
import { render, act } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { IAction } from '@fullstackcraftllc/codevideo-types';

/**
 * Best-effort smoke coverage of the Monaco model-management effects, using a
 * stub editor delivered through a mocked @monaco-editor/react onMount. Pins:
 *  - model creation + editor.setModel on file open (with detected language)
 *  - caret positioning after the step-mode setTimeout(0)/(10) workarounds
 * STEP MODE ONLY: with a mounted (stub) editor, replay mode would run the
 * real animation path and its sleeps.
 */

// jest.mock factories may only reference identifiers prefixed with "mock"
const mockModel = {
  getValue: jest.fn(() => ''),
  setValue: jest.fn(),
};

const mockEditorStub = {
  getModel: jest.fn(() => null),
  setModel: jest.fn(),
  setPosition: jest.fn(),
  revealPosition: jest.fn(),
  revealPositionInCenter: jest.fn(),
  revealLineInCenter: jest.fn(),
  focus: jest.fn(),
  saveViewState: jest.fn(() => ({ scrollTop: 0 })),
  restoreViewState: jest.fn(),
  getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
  trigger: jest.fn(),
};

const mockMonacoStub = {
  Uri: { file: (f: string) => ({ path: `/${f}`, toString: () => `file:///${f}` }) },
  editor: {
    getModel: jest.fn(() => null),
    createModel: jest.fn((..._args: any[]) => mockModel),
    setModelLanguage: jest.fn(),
  },
};

jest.mock('@monaco-editor/react', () => {
  const ReactLocal = require('react');
  return {
    Editor: ({ onMount }: { onMount?: (editor: any, monaco: any) => void }) => {
      ReactLocal.useEffect(() => {
        onMount && onMount(mockEditorStub, mockMonacoStub);
      }, []);
      return ReactLocal.createElement('div', { 'data-testid': 'monaco-editor-stub' });
    },
  };
});

jest.mock('../../SlideViewer/SlideViewer', () => ({
  SlideViewer: () => <div data-testid="slide-viewer">Slide</div>
}));
jest.mock('../../ExternalWebViewer/ExternalWebViewer', () => ({
  ExternalWebViewer: () => <div data-testid="external-web-viewer">Browser</div>
}));
jest.mock('../../WebPreview/WebPreview', () => ({
  WebPreview: () => <div data-testid="web-preview">Preview</div>
}));
jest.mock('../../FileExplorer/FileExplorer', () => ({
  FileExplorer: () => <div data-testid="file-explorer">Files</div>
}));
jest.mock('../../Editor/EditorTabs', () => ({
  EditorTabs: () => <div data-testid="editor-tabs">Tabs</div>
}));
jest.mock('../../Terminal/Terminal', () => ({
  Terminal: () => <div data-testid="terminal">Terminal</div>
}));
jest.mock('../../MouseOverlay/MouseOverlay', () => ({
  MouseOverlay: () => <div data-testid="mouse-overlay">Mouse</div>
}));
jest.mock('../../CaptionOverlay/CaptionOverlay', () => ({
  CaptionOverlay: () => <div data-testid="caption-overlay">Captions</div>
}));
jest.mock('../../EmbedOverlay/EmbedOverlay', () => ({
  EmbedOverlay: () => <div data-testid="embed-overlay">Embed</div>
}));
jest.mock('../../UnsavedChangesDialog/UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: () => <div data-testid="unsaved-changes-dialog">Unsaved</div>
}));
jest.mock('../../utils/speakText', () => ({
  speakText: jest.fn().mockResolvedValue(undefined),
  stopSpeaking: jest.fn(),
}));

// import AFTER the mocks so the component sees the stubbed Editor
import { CodeVideoIDE, CodeVideoIDEProps } from '../../CodeVideoIDE.jsx';

const a = (name: string, value: string): IAction => ({ name, value } as IAction);

const baseProps: CodeVideoIDEProps = {
  mode: 'step',
  currentLessonIndex: null,
  theme: 'dark',
  allowFocusInEditor: false,
  defaultLanguage: 'javascript',
  isExternalBrowserStepUrl: null,
  isSoundOn: false,
  withCaptions: false,
  resolution: '1080p',
  actionFinishedCallback: jest.fn(),
  speakActionAudios: [],
  fileExplorerWidth: 300,
  terminalHeight: 150,
  mouseColor: 'black',
  project: [],
  currentActionIndex: 0,
};

const flush = async (times = 3) => {
  for (let i = 0; i < times; i++) {
    await act(async () => {});
  }
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockEditorStub.setModel.mockClear();
  mockEditorStub.setPosition.mockClear();
  mockMonacoStub.editor.createModel.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Monaco model management (stub editor, step mode)', () => {
  const actions = [
    a('file-explorer-create-file', 'index.ts'),
    a('file-explorer-open-file', 'index.ts'),
    a('editor-type', 'const x = 1;'),
  ];

  it('creates a model with the detected language and sets it on the editor when a file opens', async () => {
    render(
      <Theme>
        <CodeVideoIDE {...baseProps} project={actions} currentActionIndex={1} />
      </Theme>
    );
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    await flush();

    expect(mockMonacoStub.editor.createModel).toHaveBeenCalled();
    // createModel(content, language, uri) - .ts detects as typescript
    const createArgs = mockMonacoStub.editor.createModel.mock.calls[0];
    expect(createArgs[1]).toBe('typescript');
    expect(mockEditorStub.setModel).toHaveBeenCalledWith(mockModel);
  });

  it('positions the caret after the step-mode content-change timers run', async () => {
    render(
      <Theme>
        <CodeVideoIDE {...baseProps} project={actions} currentActionIndex={2} />
      </Theme>
    );
    await flush();
    // the caret workarounds use setTimeout(0) and setTimeout(10)
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    await flush();

    expect(mockEditorStub.setPosition).toHaveBeenCalledWith(
      expect.objectContaining({
        lineNumber: expect.any(Number),
        column: expect.any(Number),
      })
    );
  });
});
