import React from 'react';
import { render, act } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { CodeVideoIDE, CodeVideoIDEProps } from '../../CodeVideoIDE.jsx';
import { IAction, IFileStructure, IPoint } from '@fullstackcraftllc/codevideo-types';

/**
 * Pins for step-mode state reconstitution (updateState): the VirtualIDE
 * snapshot for the current action index must reach the child components.
 * Written before extracting updateState & friends into useStepModeState.
 */

jest.mock('../../SlideViewer/SlideViewer', () => ({
  SlideViewer: () => <div data-testid="slide-viewer">Slide</div>
}));
jest.mock('../../ExternalWebViewer/ExternalWebViewer', () => ({
  ExternalWebViewer: () => <div data-testid="external-web-viewer">Browser</div>
}));
jest.mock('../../WebPreview/WebPreview', () => ({
  WebPreview: () => <div data-testid="web-preview">Preview</div>
}));
// richer mocks than the other suites: these render the reconstituted state
jest.mock('../../FileExplorer/FileExplorer', () => ({
  FileExplorer: ({ fileStructure }: { fileStructure?: IFileStructure }) => (
    <div data-testid="file-explorer">{Object.keys(fileStructure ?? {}).join(',')}</div>
  )
}));
jest.mock('../../Editor/EditorTabs', () => ({
  EditorTabs: ({ editors }: { editors: Array<{ filename: string }> }) => (
    <div data-testid="editor-tabs">{(editors ?? []).map(e => e.filename).join(',')}</div>
  )
}));
jest.mock('../../Terminal/Terminal', () => ({
  Terminal: ({ terminalBuffer }: { terminalBuffer: string }) => (
    <div data-testid="terminal">{terminalBuffer}</div>
  )
}));
jest.mock('../../MouseOverlay/MouseOverlay', () => ({
  MouseOverlay: ({ targetMousePosition }: { targetMousePosition: IPoint }) => (
    <div data-testid="mouse-overlay">{`${targetMousePosition.x},${targetMousePosition.y}`}</div>
  )
}));
jest.mock('../../CaptionOverlay/CaptionOverlay', () => ({
  CaptionOverlay: ({ captionText }: { captionText?: string }) => (
    <div data-testid="caption-overlay">{captionText}</div>
  )
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

const a = (name: string, value: string): IAction => ({ name, value } as IAction);

const baseProps: CodeVideoIDEProps = {
  mode: 'step',
  currentLessonIndex: null,
  theme: 'dark',
  allowFocusInEditor: false,
  defaultLanguage: 'javascript',
  isExternalBrowserStepUrl: null,
  isSoundOn: false,
  withCaptions: true,
  resolution: '1080p',
  actionFinishedCallback: jest.fn(),
  speakActionAudios: [],
  fileExplorerWidth: 300,
  terminalHeight: 150,
  mouseColor: 'black',
  project: [],
  currentActionIndex: 0,
};

const renderIDE = (overrides: Partial<CodeVideoIDEProps>) =>
  render(
    <Theme>
      <CodeVideoIDE {...baseProps} {...overrides} />
    </Theme>
  );

const flush = async (times = 3) => {
  for (let i = 0; i < times; i++) {
    await act(async () => {});
  }
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('step-mode state reconstitution', () => {
  it('reconstituted file structure reaches the file explorer', async () => {
    const actions = [
      a('file-explorer-create-file', 'index.ts'),
      a('author-speak-before', 'we just made a file'),
    ];
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 0 });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    expect(getByTestId('file-explorer')).toHaveTextContent('index.ts');
  });

  it('caption text of the current author action reaches the caption overlay', async () => {
    const actions = [a('author-speak-before', 'hello from the caption')];
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 0 });
    await flush();

    expect(getByTestId('caption-overlay')).toHaveTextContent('hello from the caption');
  });

  it('centers the mouse at action index 0 in step mode', async () => {
    const actions = [a('author-speak-before', 'hi')];
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 0 });
    await flush();

    // jsdom containers have a zero-size rect, so "centered" is 0,0 - the pin
    // is that the index-0 centering path ran (default would be 960,540)
    expect(getByTestId('mouse-overlay')).toHaveTextContent('0,0');
  });

  it('editor scroll actions in step mode do not throw without a mounted Monaco', async () => {
    const actions = [
      a('file-explorer-create-file', 'a.ts'),
      a('editor-scroll-down', '3'),
    ];
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 1 });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // still rendering and file structure still present = no crash
    expect(getByTestId('file-explorer')).toHaveTextContent('a.ts');
  });
});
