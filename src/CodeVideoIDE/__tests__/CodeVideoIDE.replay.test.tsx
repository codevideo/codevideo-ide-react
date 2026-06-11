import React, { useState } from 'react';
import { render, act, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { CodeVideoIDE } from '../../CodeVideoIDE.jsx';
import { IAction, ICodeVideoIDEProps } from '@fullstackcraftllc/codevideo-types';

/**
 * Characterization tests for the replay-mode playback loop.
 *
 * In jsdom Monaco never mounts (monacoEditorRef stays undefined), so
 * applyAnimation skips executeActionPlaybackForMonacoInstance but still runs
 * updateState() + actionFinishedCallback(). That makes the controlled loop -
 * parent owns currentActionIndex, component signals completion - fully
 * deterministic under fake timers. The only timer in the loop is the 1000ms
 * initial delay before the first action animates.
 */

// Mock child components (same idiom as the continuation suite)
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

// speech uses browser APIs not present in jsdom
jest.mock('../../utils/speakText', () => ({
  speakText: jest.fn().mockResolvedValue(undefined),
  stopSpeaking: jest.fn(),
}));

const testActions: IAction[] = [
  { name: 'author-speak-before', value: 'Welcome to the lesson' },
  { name: 'file-explorer-create-file', value: 'index.ts' },
  { name: 'author-speak-before', value: 'That is all' },
];

const baseProps: ICodeVideoIDEProps = {
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

const renderIDE = (overrides: Partial<ICodeVideoIDEProps>) =>
  render(
    <Theme>
      <CodeVideoIDE {...baseProps} {...overrides} />
    </Theme>
  );

// flush the microtask cascade of the async applyAnimation chain
const flush = async (times = 5) => {
  for (let i = 0; i < times; i++) {
    await act(async () => {});
  }
};

describe('CodeVideoIDE replay-mode playback loop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('replay at index 0: waits exactly 1000ms before finishing the first action, then calls actionFinishedCallback once', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    renderIDE({
      mode: 'replay',
      project: testActions,
      currentActionIndex: 0,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();

    // nothing finishes before the 1s initial delay
    await act(async () => {
      jest.advanceTimersByTime(999);
    });
    await flush();
    expect(actionFinished).not.toHaveBeenCalled();

    // the remaining 1ms releases the first animation
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(actionFinished).toHaveBeenCalledTimes(1);
    expect(playbackComplete).not.toHaveBeenCalled();
  });

  it('parent-driven loop: one actionFinishedCallback per action, then playBackCompleteCallback once past the end', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    const Harness = () => {
      const [idx, setIdx] = useState(0);
      return (
        <Theme>
          <CodeVideoIDE
            {...baseProps}
            mode="replay"
            project={testActions}
            currentActionIndex={idx}
            actionFinishedCallback={() => {
              actionFinished();
              setIdx(i => i + 1);
            }}
            playBackCompleteCallback={playbackComplete}
          />
        </Theme>
      );
    };

    render(<Harness />);
    await flush();

    // release the initial 1s delay; subsequent actions have no timers in jsdom
    // (Monaco is not mounted), so the loop cascades through microtasks
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flush(10);

    expect(actionFinished).toHaveBeenCalledTimes(testActions.length);
    expect(playbackComplete).toHaveBeenCalledTimes(1);
  });

  it('replay at an out-of-range index calls playBackCompleteCallback (legacy completion semantics)', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    renderIDE({
      mode: 'replay',
      project: testActions,
      currentActionIndex: testActions.length, // one past the end
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();

    expect(playbackComplete).toHaveBeenCalledTimes(1);
    expect(actionFinished).not.toHaveBeenCalled();
  });

  it('step mode: updates state but never fires playback callbacks', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    renderIDE({
      mode: 'step',
      project: testActions,
      currentActionIndex: 0,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await flush();

    expect(actionFinished).not.toHaveBeenCalled();
    expect(playbackComplete).not.toHaveBeenCalled();
    // state did update: caption text of the author action is reflected nowhere
    // visible here, but the IDE chrome is rendered
    expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
  });

  it('empty project in replay mode: idles without calling any callback', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    renderIDE({
      mode: 'replay',
      project: [],
      currentActionIndex: 0,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await flush();

    expect(actionFinished).not.toHaveBeenCalled();
    expect(playbackComplete).not.toHaveBeenCalled();
  });

  it('record mode: fires no playback callbacks', async () => {
    const actionFinished = jest.fn();
    const playbackComplete = jest.fn();

    renderIDE({
      mode: 'record',
      project: testActions,
      currentActionIndex: 0,
      actionFinishedCallback: actionFinished,
      playBackCompleteCallback: playbackComplete,
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await flush();

    expect(actionFinished).not.toHaveBeenCalled();
    expect(playbackComplete).not.toHaveBeenCalled();
  });
});
