import React from 'react';
import { render, act } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { CodeVideoIDE, CodeVideoIDEProps } from '../../CodeVideoIDE.jsx';
import { IAction } from '@fullstackcraftllc/codevideo-types';

/**
 * Streaming-append behavior (the codevideo-genie scenario): the actions array
 * grows while playback runs. Appends must never restart the current animation,
 * starvation must idle (not complete) while isStreaming, and turning
 * isStreaming off resolves a starved playback to completion.
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

const a = (name: string, value: string): IAction => ({ name, value } as IAction);

// rebuilt-with-new-references on every "chunk", like a Redux store would
const chunk1: IAction[] = [a('author-speak-before', 'first')];
const chunk2: IAction[] = [a('author-speak-before', 'first'), a('author-speak-before', 'second')];
const chunk3: IAction[] = [
  a('author-speak-before', 'first'),
  a('author-speak-before', 'second'),
  a('author-speak-before', 'third'),
];

const baseProps: CodeVideoIDEProps = {
  mode: 'replay',
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

const flush = async (times = 5) => {
  for (let i = 0; i < times; i++) {
    await act(async () => {});
  }
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

describe('CodeVideoIDE streaming appends', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('an append at the same index does not restart the animation or re-fire the callback', async () => {
    const actionFinished = jest.fn();
    const { rerenderIDE } = renderIDE({
      project: chunk1,
      currentActionIndex: 0,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
    });
    await flush();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flush();
    expect(actionFinished).toHaveBeenCalledTimes(1);

    // stream delivers a new array (all-new references) while index stays 0
    rerenderIDE({
      project: chunk2,
      currentActionIndex: 0,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await flush();

    // legacy behavior would have re-run the index-0 animation after another 1s
    expect(actionFinished).toHaveBeenCalledTimes(1);
  });

  it('starved while isStreaming: idles without calling playBackCompleteCallback', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();
    renderIDE({
      project: chunk1,
      currentActionIndex: 1, // one past the available actions
      isStreaming: true,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await flush();

    expect(playbackComplete).not.toHaveBeenCalled();
    expect(actionFinished).not.toHaveBeenCalled();
  });

  it('an append that satisfies a starved index resumes playback automatically', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();
    const { rerenderIDE } = renderIDE({
      project: chunk1,
      currentActionIndex: 1,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    expect(actionFinished).not.toHaveBeenCalled();

    // the awaited action arrives
    rerenderIDE({
      project: chunk2,
      currentActionIndex: 1,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush(10);

    // non-zero index: no initial delay, animates straight away (no Monaco in jsdom)
    expect(actionFinished).toHaveBeenCalledTimes(1);
    expect(playbackComplete).not.toHaveBeenCalled();
  });

  it('setting isStreaming to false while starved completes the playback', async () => {
    const playbackComplete = jest.fn();
    const { rerenderIDE } = renderIDE({
      project: chunk2,
      currentActionIndex: 2,
      isStreaming: true,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    expect(playbackComplete).not.toHaveBeenCalled();

    // stream ends; consumer flips the flag
    rerenderIDE({
      project: chunk2,
      currentActionIndex: 2,
      isStreaming: false,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();

    expect(playbackComplete).toHaveBeenCalledTimes(1);
  });

  it('StrictMode: exactly one index-0 animation', async () => {
    const actionFinished = jest.fn();
    render(
      <React.StrictMode>
        <Theme>
          <CodeVideoIDE
            {...baseProps}
            project={chunk1}
            currentActionIndex={0}
            isStreaming={true}
            actionFinishedCallback={actionFinished}
          />
        </Theme>
      </React.StrictMode>
    );
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flush();

    expect(actionFinished).toHaveBeenCalledTimes(1);
  });

  it('backward seek re-animates a previously played action (single guard key, not a set)', async () => {
    const actionFinished = jest.fn();
    const { rerenderIDE } = renderIDE({
      project: chunk3,
      currentActionIndex: 2,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
    });
    await flush(10);
    expect(actionFinished).toHaveBeenCalledTimes(1);

    rerenderIDE({ project: chunk3, currentActionIndex: 1, isStreaming: true, actionFinishedCallback: actionFinished });
    await flush(10);
    expect(actionFinished).toHaveBeenCalledTimes(2);

    // revisiting index 2 must animate again
    rerenderIDE({ project: chunk3, currentActionIndex: 2, isStreaming: true, actionFinishedCallback: actionFinished });
    await flush(10);
    expect(actionFinished).toHaveBeenCalledTimes(3);
  });

  it('a non-append change (edited earlier action) re-animates the current index', async () => {
    const actionFinished = jest.fn();
    const { rerenderIDE } = renderIDE({
      project: chunk2,
      currentActionIndex: 1,
      isStreaming: true,
      actionFinishedCallback: actionFinished,
    });
    await flush(10);
    expect(actionFinished).toHaveBeenCalledTimes(1);

    // earlier action edited -> epoch bump -> legitimate full reset of the guard
    const edited = [a('author-speak-before', 'REWRITTEN'), chunk2[1]];
    rerenderIDE({ project: edited, currentActionIndex: 1, isStreaming: true, actionFinishedCallback: actionFinished });
    await flush(10);

    expect(actionFinished).toHaveBeenCalledTimes(2);
  });

  it('without isStreaming, starvation still completes (legacy semantics intact)', async () => {
    const playbackComplete = jest.fn();
    renderIDE({
      project: chunk1,
      currentActionIndex: 1,
      // isStreaming intentionally omitted
      playBackCompleteCallback: playbackComplete,
    });
    await flush();

    expect(playbackComplete).toHaveBeenCalledTimes(1);
  });
});
