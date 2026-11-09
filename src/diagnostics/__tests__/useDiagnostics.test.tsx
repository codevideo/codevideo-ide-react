import { act, renderHook } from '@testing-library/react';
import { ICodeVideoDiagnostic, IEditor, IFileStructure } from '@fullstackcraftllc/codevideo-types';
import { collectProjectFiles, diagnosticsInputKey } from '../collectProjectFiles';
import { DiagnosticsEngine } from '../monacoDiagnosticsEngine';
import { UseDiagnosticsParams, useDiagnostics } from '../useDiagnostics';

type Range = { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };

class FakeModel {
  ranges = new Map<string, Range>();
  classes = new Map<string, string>();
  private next = 0;
  uri: { toString(): string };
  constructor(uri: string, public value: string) { this.uri = { toString: () => uri }; }
  getValue() { return this.value; }
  getLineCount() { return this.value.split('\n').length; }
  getLineMaxColumn(line: number) { return this.value.split('\n')[line - 1].length + 1; }
  getLineFirstNonWhitespaceColumn(line: number) { return (this.value.split('\n')[line - 1].search(/\S/) + 1) || 0; }
  deltaDecorations(old: Array<string>, added: Array<{ range: Range; options: { className: string } }>) {
    old.forEach(id => { this.ranges.delete(id); this.classes.delete(id); });
    return added.map(decoration => {
      const id = `d${++this.next}`;
      this.ranges.set(id, { ...decoration.range });
      this.classes.set(id, decoration.options.className);
      return id;
    });
  }
  getDecorationRange(id: string) { return this.ranges.get(id) ?? null; }
  /** An edit before every decoration on line `line`: shift them right. */
  insertBefore(line: number, count: number) {
    for (const range of Array.from(this.ranges.values())) if (range.startLineNumber === line) { range.startColumn += count; range.endColumn += count; }
  }
}

const source = 'const fooBars: Array<IFooBar> = [];\nsortByKey<IFooBar>(fooBars, "cat");\n';
const catColumn = source.split('\n')[1].indexOf('"cat"') + 1;
const squiggle: ICodeVideoDiagnostic = {
  path: 'src/generics.ts', line: 2, column: catColumn, endLine: 2, endColumn: catColumn + 5, severity: 'error', code: 2345,
  message: 'Argument of type \'"cat"\' is not assignable to parameter of type \'keyof IFooBar\'.',
};
const structure: IFileStructure = { src: { type: 'directory', collapsed: false, content: '', children: {
  'generics.ts': { type: 'file', language: 'typescript', content: '', caretPosition: { row: 1, col: 1 } },
  'notes.md': { type: 'file', language: 'markdown', content: '# notes', caretPosition: { row: 1, col: 1 } },
} } };
const editorFor = (content: string): IEditor => ({ filename: 'src/generics.ts', content, isActive: true, isSaved: false, caretPosition: { row: 1, col: 1 }, highlightCoordinates: null });

function setup(overrides: Partial<UseDiagnosticsParams> = {}) {
  const model = new FakeModel('file:///src/generics.ts', source);
  const monaco: any = {
    editor: { getModels: () => [model], getModel: (uri: { toString(): string }) => (uri.toString() === model.uri.toString() ? model : null) },
    Uri: { parse: (uri: string) => ({ toString: () => uri }) },
  };
  const compute = jest.fn(async () => [squiggle]);
  const engine: DiagnosticsEngine = { compute, warmUp: jest.fn(), dispose: jest.fn() };
  const createEngine = jest.fn(() => engine);
  const props: UseDiagnosticsParams = {
    enabled: true, visible: true, renderMode: 'realtime', editors: [editorFor(source)], fileStructure: structure, activePath: 'src/generics.ts',
    monacoEditorRef: { current: { getModel: () => model } as any }, globalMonacoRef: { current: monaco }, createEngine, ...overrides,
  };
  const hook = renderHook((p: UseDiagnosticsParams) => useDiagnostics(p), { initialProps: props });
  return { hook, model, compute, createEngine, props };
}

const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

describe('useDiagnostics', () => {
  afterEach(() => { delete (window as any).__codeVideoClock; });

  it('creates nothing when the project does not use diagnostics', async () => {
    const { createEngine, model } = setup({ enabled: false });
    await flush();
    expect(createEngine).not.toHaveBeenCalled();
    expect(model.ranges.size).toBe(0);
  });

  it('checks the open TypeScript files with every project file and draws the result', async () => {
    const { compute, model } = setup();
    await flush();
    expect(compute).toHaveBeenCalledTimes(1);
    const [files, targets] = compute.mock.calls[0] as unknown as [Array<{ path: string; content: string }>, Array<string>];
    expect(files.map(file => file.path)).toEqual(['src/generics.ts', 'src/notes.md']);
    expect(files[0].content).toBe(source); // the editor buffer wins over the saved file
    expect(targets).toEqual(['src/generics.ts']);
    expect(Array.from(model.classes.values())).toEqual(['codevideo-squiggly-error']);
    expect(Array.from(model.ranges.values())).toEqual([{ startLineNumber: 2, startColumn: catColumn, endLineNumber: 2, endColumn: catColumn + 5 }]);
  });

  it('recomputes only when the inputs change', async () => {
    const { compute, hook, props } = setup();
    await flush();
    hook.rerender({ ...props, editors: [editorFor(source)] });
    await flush();
    expect(compute).toHaveBeenCalledTimes(1);
    hook.rerender({ ...props, editors: [editorFor(source + '// more\n')] });
    await flush();
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('does not draw results computed for other text', async () => {
    const { model } = setup({ editors: [editorFor('const typedAhead = 1;')] });
    await flush();
    expect(model.ranges.size).toBe(0);
  });

  it('hides squiggles while not visible and redraws them from the cache', async () => {
    const { compute, hook, props, model } = setup();
    await flush();
    hook.rerender({ ...props, visible: false });
    await flush();
    expect(model.ranges.size).toBe(0);
    hook.rerender({ ...props, visible: true });
    await flush();
    expect(model.ranges.size).toBe(1);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('hands each computation to the virtual clock in deterministic renders', async () => {
    const track = jest.fn();
    (window as any).__codeVideoClock = { track };
    setup({ renderMode: 'deterministic' });
    await flush();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][0]).toBeInstanceOf(Promise);
  });

  it('fails a deterministic render whose diagnostics fail', async () => {
    const onError = jest.fn();
    const engine: DiagnosticsEngine = { compute: jest.fn(async () => { throw new Error('worker missing'); }), warmUp: jest.fn(), dispose: jest.fn() };
    setup({ renderMode: 'deterministic', onError, createEngine: () => engine });
    await flush();
    expect(onError.mock.calls[0][0].message).toBe('TypeScript diagnostics failed: worker missing');
  });

  it('finds the squiggle under a hover location, with or without a column', async () => {
    const { hook } = setup();
    await flush();
    const { controller } = hook.result.current;
    expect(controller.hoverDiagnostics({ path: 'src/generics.ts', line: 2, column: catColumn + 2 })).toEqual([squiggle]);
    expect(controller.hoverDiagnostics({ path: 'src/generics.ts', line: 2, column: 1 })).toEqual([]);
    expect(controller.hoverPosition({ path: 'src/generics.ts', line: 2 })).toEqual({ line: 2, column: catColumn });
    expect(controller.hoverPosition({ path: 'src/other.ts', line: 2 })).toBeNull();
  });

  it('checkpoints squiggles where edits moved them and restores them there', async () => {
    const first = setup();
    await flush();
    first.model.insertBefore(2, 3);
    const checkpoint = first.hook.result.current.controller.capture()!;
    expect(checkpoint.live['file:///src/generics.ts'][0].column).toBe(catColumn + 3);
    expect(checkpoint.contents['src/generics.ts']).toBe(source);

    const resumed = setup({ hydrating: true });
    act(() => resumed.hook.result.current.controller.restore(JSON.parse(JSON.stringify(checkpoint))));
    expect(Array.from(resumed.model.ranges.values())[0].startColumn).toBe(catColumn + 3);
    resumed.hook.rerender({ ...resumed.props, hydrating: false });
    await flush();
    // Same inputs as the checkpoint: nothing recomputed, nothing moved back.
    expect(resumed.compute).not.toHaveBeenCalled();
    expect(Array.from(resumed.model.ranges.values())[0].startColumn).toBe(catColumn + 3);
  });
});

describe('collectProjectFiles', () => {
  it('flattens the tree, lets open buffers win and sorts by path', () => {
    const files = collectProjectFiles(structure, [editorFor('let a = 1;')]);
    expect(files).toEqual([{ path: 'src/generics.ts', content: 'let a = 1;' }, { path: 'src/notes.md', content: '# notes' }]);
  });

  it('fingerprints content and open files', () => {
    const files = collectProjectFiles(structure, undefined);
    expect(diagnosticsInputKey(files, ['src/generics.ts'])).toBe(diagnosticsInputKey(collectProjectFiles(structure, undefined), ['src/generics.ts']));
    expect(diagnosticsInputKey(files, [])).not.toBe(diagnosticsInputKey(files, ['src/generics.ts']));
    expect(diagnosticsInputKey(collectProjectFiles(structure, [editorFor('x')]), [])).not.toBe(diagnosticsInputKey(files, []));
  });
});
