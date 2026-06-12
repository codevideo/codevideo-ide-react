import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { CodeVideoIDE, CodeVideoIDEProps } from '../../CodeVideoIDE.jsx';
import { IAction } from '@fullstackcraftllc/codevideo-types';

/**
 * Pin tests for the component's smaller side-effect behaviors, written before
 * each is extracted into its own hook:
 *  - terminal block caret (2s timer after terminal actions)
 *  - step-mode speech (speakText / stopSpeaking routing)
 *  - embed-mode keyboard controls (ArrowLeft / ArrowRight / Space)
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
jest.mock('../../FileExplorer/FileExplorer', () => ({
  FileExplorer: () => <div data-testid="file-explorer">Files</div>
}));
jest.mock('../../Editor/EditorTabs', () => ({
  EditorTabs: () => <div data-testid="editor-tabs">Tabs</div>
}));
jest.mock('../../Terminal/Terminal', () => ({
  Terminal: ({ showBlockCaret }: { showBlockCaret?: boolean }) => (
    <div data-testid="terminal">{showBlockCaret ? 'caret-on' : 'caret-off'}</div>
  )
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

const { speakText, stopSpeaking } = jest.requireMock('../../utils/speakText');

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

const renderIDE = (overrides: Partial<CodeVideoIDEProps>) => {
  const result = render(
    <Theme>
      <CodeVideoIDE {...baseProps} {...overrides} />
    </Theme>
  );
  const rerenderIDE = (next: Partial<CodeVideoIDEProps>) =>
    result.rerender(
      <Theme>
        <CodeVideoIDE {...baseProps} {...next} />
      </Theme>
    );
  return { ...result, rerenderIDE };
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
  (speakText as jest.Mock).mockClear();
  (stopSpeaking as jest.Mock).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('terminal block caret', () => {
  const actions = [a('terminal-type', 'ls -la'), a('author-speak-before', 'and that lists files')];

  it('shows the block caret for a terminal action and clears it after 2 seconds', async () => {
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 0 });
    await flush();
    expect(getByTestId('terminal')).toHaveTextContent('caret-on');

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });
    expect(getByTestId('terminal')).toHaveTextContent('caret-on');

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(getByTestId('terminal')).toHaveTextContent('caret-off');
  });

  it('keeps the caret off for non-terminal actions', async () => {
    const { getByTestId } = renderIDE({ project: actions, currentActionIndex: 1 });
    await flush();
    expect(getByTestId('terminal')).toHaveTextContent('caret-off');
  });

  it('turns the caret off when stepping from a terminal action to a non-terminal one', async () => {
    const { getByTestId, rerenderIDE } = renderIDE({ project: actions, currentActionIndex: 0 });
    await flush();
    expect(getByTestId('terminal')).toHaveTextContent('caret-on');

    rerenderIDE({ project: actions, currentActionIndex: 1 });
    await flush();
    expect(getByTestId('terminal')).toHaveTextContent('caret-off');
  });
});

describe('step-mode speech', () => {
  const actions = [a('author-speak-before', 'hello there'), a('editor-type', 'console.log(1);')];

  it('speaks the current author action with a matching pre-generated mp3 url', async () => {
    renderIDE({
      project: actions,
      currentActionIndex: 0,
      isSoundOn: true,
      speakActionAudios: [{ text: 'hello there', mp3Url: 'https://cdn.example/audio.mp3' }],
    });
    await flush();

    expect(speakText).toHaveBeenCalledWith('hello there', 1, 'https://cdn.example/audio.mp3');
  });

  it('falls back to speech synthesis (undefined mp3Url) when no audio matches', async () => {
    renderIDE({ project: actions, currentActionIndex: 0, isSoundOn: true });
    await flush();

    expect(speakText).toHaveBeenCalledWith('hello there', 1, undefined);
  });

  it('stops speaking when sound is off', async () => {
    renderIDE({ project: actions, currentActionIndex: 0, isSoundOn: false });
    await flush();

    expect(speakText).not.toHaveBeenCalled();
    expect(stopSpeaking).toHaveBeenCalled();
  });

  it('stops speaking on non-author actions even with sound on', async () => {
    renderIDE({ project: actions, currentActionIndex: 1, isSoundOn: true });
    await flush();

    expect(speakText).not.toHaveBeenCalled();
    expect(stopSpeaking).toHaveBeenCalled();
  });
});

describe('embed-mode keyboard controls', () => {
  const actions = [a('author-speak-before', 'hi'), a('editor-type', 'x')];

  it('ArrowRight dismisses the embed overlay, requests step mode and the next action', async () => {
    const requestStepModeCallback = jest.fn();
    const requestNextActionCallback = jest.fn();
    const { queryByTestId } = renderIDE({
      project: actions,
      isEmbedMode: true,
      requestStepModeCallback,
      requestNextActionCallback,
    });
    await flush();
    expect(queryByTestId('embed-overlay')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });

    expect(requestStepModeCallback).toHaveBeenCalledWith('step');
    expect(requestNextActionCallback).toHaveBeenCalledTimes(1);
    expect(queryByTestId('embed-overlay')).not.toBeInTheDocument();
  });

  it('ArrowLeft requests step mode and the previous action', async () => {
    const requestStepModeCallback = jest.fn();
    const requestPreviousActionCallback = jest.fn();
    renderIDE({
      project: actions,
      isEmbedMode: true,
      requestStepModeCallback,
      requestPreviousActionCallback,
    });
    await flush();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    expect(requestStepModeCallback).toHaveBeenCalledWith('step');
    expect(requestPreviousActionCallback).toHaveBeenCalledTimes(1);
  });

  it('Space requests playback start', async () => {
    const requestPlaybackStartCallback = jest.fn();
    renderIDE({
      project: actions,
      isEmbedMode: true,
      requestPlaybackStartCallback,
    });
    await flush();

    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    expect(requestPlaybackStartCallback).toHaveBeenCalledTimes(1);
  });

  it('does not listen for keys outside embed mode', async () => {
    const requestStepModeCallback = jest.fn();
    const requestNextActionCallback = jest.fn();
    const requestPlaybackStartCallback = jest.fn();
    renderIDE({
      project: actions,
      isEmbedMode: false,
      requestStepModeCallback,
      requestNextActionCallback,
      requestPlaybackStartCallback,
    });
    await flush();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: ' ' });
    });

    expect(requestStepModeCallback).not.toHaveBeenCalled();
    expect(requestNextActionCallback).not.toHaveBeenCalled();
    expect(requestPlaybackStartCallback).not.toHaveBeenCalled();
  });
});
