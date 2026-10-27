import { executeActionPlaybackForMonacoInstance, IPlaybackContext } from '../executeActionPlaybackForMonacoInstance';
import { speakText } from '../speakText';
import { createActionRandom } from '../deterministicRandom';
import { generateControlPoints } from '../../MouseOverlay/coordinateFunctions/mouse-movement/generateControlPoints';

jest.mock('../speakText', () => ({ speakText: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../reconstituteAllPartsOfState', () => ({ reconstituteAllPartsOfState: () => ({}) }));
jest.mock('../../MouseOverlay/utils/getNewMousePosition', () => ({ getNewMousePosition: () => ({ x: 0, y: 0 }) }));

function context(name: string): IPlaybackContext {
  const noop = jest.fn();
  return {
    renderMode: 'deterministic', renderSeed: 'test', editor: { getPosition: () => null } as any,
    project: [], currentActionIndex: 3, currentLessonIndex: null, action: { name, value: 'hello' } as any,
    isSoundOn: true, speakActionAudios: [{ text: 'hello', mp3Url: '', assetId: 'audio', durationMs: 1250, actionIndex: 3 }],
    setEditors: noop, setCurrentEditor: noop, setCurrentFileName: noop, setCurrentCode: noop,
    setCurrentCaretPosition: noop, setTerminalBuffer: noop, mousePosition: { x: 0, y: 0 },
    containerRef: { current: null }, setMousePosition: noop, setCaptionText: noop,
    setNewFileInputValue: jest.fn(), setNewFolderInputValue: jest.fn(), setRenameFileInputValue: jest.fn(), setRenameFolderInputValue: jest.fn(),
    standardPauseMs: 200, keyboardTypingPauseMs: 40, onRenderEvent: jest.fn(),
  };
}

describe('deterministic playback', () => {
  beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
  afterEach(() => jest.useRealTimers());

  it.each(['author-speak-before', 'author-speak-after'])('%s waits for the measured duration without browser audio', async name => {
    const ctx = context(name); let finished = false;
    const running = executeActionPlaybackForMonacoInstance(ctx).then(() => { finished = true; });
    await jest.advanceTimersByTimeAsync(1449); expect(finished).toBe(false);
    await jest.advanceTimersByTimeAsync(1); await running;
    expect(ctx.onRenderEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'speech', actionIndex: 3, durationMs: 1250, assetId: 'audio', timestampMs: 200 }));
    expect(speakText).not.toHaveBeenCalled();
  });

  it('during speech emits a cue and advances immediately', async () => {
    const ctx = context('author-speak-during'); let finished = false;
    const running = executeActionPlaybackForMonacoInstance(ctx).then(() => { finished = true; });
    await jest.advanceTimersByTimeAsync(200); await running;
    expect(finished).toBe(true); expect(ctx.onRenderEvent).toHaveBeenCalledTimes(1);
    expect(speakText).not.toHaveBeenCalled();
  });

  it('missing prepared speech fails instead of silently producing an incomplete video', async () => {
    const ctx = context('author-speak-before'); ctx.speakActionAudios = [];
    const assertion = expect(executeActionPlaybackForMonacoInstance(ctx)).rejects.toThrow('Missing prepared speech');
    await jest.advanceTimersByTimeAsync(200); await assertion;
  });

  it('awaits file-explorer input typing before completing the action', async () => {
    const ctx = context('file-explorer-type-new-file-input'); let finished = false;
    const running = executeActionPlaybackForMonacoInstance(ctx).then(() => { finished = true; });
    await jest.advanceTimersByTimeAsync(399); expect(finished).toBe(false);
    await jest.advanceTimersByTimeAsync(1); await running;
    expect(ctx.setNewFileInputValue).toHaveBeenCalledTimes(5);
  });

  it('retains realtime speech playback', async () => {
    const ctx = context('author-speak-before'); ctx.renderMode = 'realtime';
    const running = executeActionPlaybackForMonacoInstance(ctx);
    await jest.advanceTimersByTimeAsync(200); await running;
    expect(speakText).toHaveBeenCalledWith('hello', 1, ''); expect(ctx.onRenderEvent).not.toHaveBeenCalled();
  });
});

test('mouse random streams depend on seed, action, lesson and purpose, independently of earlier draws', () => {
  const path = (seed: string, index = 5, lesson: number | null = null) => generateControlPoints({ x: 10, y: 20 }, { x: 800, y: 400 }, 3, .3, createActionRandom(seed, index, 'mouse-path', lesson));
  const expected = path('seed');
  const unrelated = createActionRandom('seed', 4, 'mouse-target');
  for (let i = 0; i < 100; i++) unrelated();
  expect(path('seed')).toEqual(expected);
  expect(path('other')).not.toEqual(expected); expect(path('seed', 6)).not.toEqual(expected); expect(path('seed', 5, 1)).not.toEqual(expected);
  expect(createActionRandom('seed', 5, 'mouse-target')()).not.toEqual(createActionRandom('seed', 5, 'mouse-path')());
});
