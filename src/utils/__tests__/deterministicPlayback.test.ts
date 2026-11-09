import { reconstituteAllPartsOfState } from '../reconstituteAllPartsOfState';
import { executeActionPlaybackForMonacoInstance, IPlaybackContext } from '../executeActionPlaybackForMonacoInstance';
import { speakText } from '../speakText';
import { createActionRandom } from '../deterministicRandom';
import { generateControlPoints } from '../../MouseOverlay/coordinateFunctions/mouse-movement/generateControlPoints';

jest.mock('../speakText', () => ({ speakText: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../reconstituteAllPartsOfState', () => ({ reconstituteAllPartsOfState: jest.fn(() => ({})) }));
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


describe('repeat playback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it.each(['realtime', 'deterministic'] as const)('animates each selection step and deletes N times in %s', async renderMode => {
    const ctx = context('editor-shift+arrow-right');
    ctx.renderMode = renderMode;
    ctx.action.value = '3';
    let column = 1;
    ctx.editor = {
      getPosition: () => ({ lineNumber: 1, column }),
      getModel: () => ({ getLineMaxColumn: () => 10, getLineCount: () => 1 }),
      getSelection: () => ({ selectionStartLineNumber: 1, selectionStartColumn: 1 }),
      setSelection: jest.fn(selection => { column = selection.positionColumn; }),
      revealPosition: jest.fn(), trigger: jest.fn(),
    } as any;
    const running = executeActionPlaybackForMonacoInstance(ctx);
    await jest.advanceTimersByTimeAsync(200);
    expect(column).toBe(2);
    await jest.advanceTimersByTimeAsync(40);
    expect(column).toBe(3);
    await jest.advanceTimersByTimeAsync(80);
    await running;
    expect(column).toBe(4);
    const text = textEditor('abcdefghi', 1, 10);
    ctx.editor = text as any;
    ctx.action = { name: 'editor-backspace', value: '3' };
    const deleting = executeActionPlaybackForMonacoInstance(ctx);
    await jest.runAllTimersAsync();
    await deleting;
    expect(text.text()).toBe('abcdef');
  });
});

// A Monaco editor stand-in that holds real text, for edits that must match VirtualEditor.
function textEditor(initial: string, lineNumber: number, column: number) {
  let value = initial;
  const lines = () => value.split('\n');
  const offset = (line: number, col: number) => lines().slice(0, line - 1).reduce((sum, text) => sum + text.length + 1, 0) + col - 1;
  const caret = (line: number, col: number) => ({ startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col, positionLineNumber: line, positionColumn: col });
  let selection = caret(lineNumber, column);
  return {
    text: () => value,
    select: (next: typeof selection) => { selection = next; },
    getSelection: () => selection,
    getPosition: () => ({ lineNumber: selection.positionLineNumber, column: selection.positionColumn }),
    setPosition: ({ lineNumber, column }: { lineNumber: number; column: number }) => { selection = caret(lineNumber, column); },
    getModel: () => ({ getLineMaxColumn: (line: number) => lines()[line - 1].length + 1, getLineCount: () => lines().length }),
    executeEdits: (_source: string, edits: { range: typeof selection; text: string }[]) => {
      for (const { range, text } of edits) {
        value = value.slice(0, offset(range.startLineNumber, range.startColumn)) + text + value.slice(offset(range.endLineNumber, range.endColumn));
      }
      return true;
    },
    revealPosition: jest.fn(), trigger: jest.fn(),
  };
}

describe('backspace deletes exactly what VirtualEditor deletes', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const backspace = async (editor: ReturnType<typeof textEditor>, times: number) => {
    const ctx = context('editor-backspace');
    ctx.action.value = String(times);
    ctx.editor = editor as any;
    const running = executeActionPlaybackForMonacoInstance(ctx);
    await jest.runAllTimersAsync();
    await running;
  };

  it('removes one space of indentation per press, not a whole tab stop', async () => {
    const editor = textEditor('if (a) {\n        return 1;', 2, 9);
    await backspace(editor, 2);
    expect(editor.text()).toBe('if (a) {\n      return 1;');
    expect(editor.getPosition()).toEqual({ lineNumber: 2, column: 7 });
  });

  it('removes one character of a typed pair, not both', async () => {
    const editor = textEditor('a[]', 1, 3);
    await backspace(editor, 1);
    expect(editor.text()).toBe('a]');
  });

  it('joins with the previous line at column 1', async () => {
    const editor = textEditor('ab\ncd', 2, 1);
    await backspace(editor, 1);
    expect(editor.text()).toBe('abcd');
    expect(editor.getPosition()).toEqual({ lineNumber: 1, column: 3 });
  });

  it('spends the first press on the selection and the rest on single characters', async () => {
    const editor = textEditor('hello world\nnext', 2, 3);
    editor.select({ startLineNumber: 1, startColumn: 6, endLineNumber: 2, endColumn: 3, positionLineNumber: 2, positionColumn: 3 });
    await backspace(editor, 2);
    expect(editor.text()).toBe('hellxt');
    expect(editor.getPosition()).toEqual({ lineNumber: 1, column: 5 });
  });

  it('does nothing at the start of the file', async () => {
    const editor = textEditor('abc', 1, 1);
    await backspace(editor, 2);
    expect(editor.text()).toBe('abc');
  });
});


test('opening another file never writes target content into the previous model', async () => {
  jest.useFakeTimers();
  try {
    (reconstituteAllPartsOfState as jest.Mock).mockReturnValueOnce({ currentFilename: 'second.ts', currentCode: 'second file' });
    const model = { uri: { toString: () => 'file:///first.ts' }, getValue: () => 'first file', setValue: jest.fn() };
    const ctx = context('file-explorer-open-file');
    ctx.editor = { getModel: () => model } as any;
    ctx.action.value = 'second.ts';
    const running = executeActionPlaybackForMonacoInstance(ctx);
    await jest.runAllTimersAsync();
    await running;
    expect(model.setValue).not.toHaveBeenCalled();
    expect(ctx.setCurrentCode).toHaveBeenCalledWith('second file');
  } finally { jest.useRealTimers(); }
});
