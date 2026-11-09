import { useEffect, useMemo, useRef, useState } from 'react';
import type * as monaco from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';
import {
  ICodeVideoDiagnostic, IDiagnosticLocation, IEditor, IFileSource, IFileStructure, RenderMode,
  diagnosticContains, getDiagnosticsChecks, normalizeDiagnosticsPath,
} from '@fullstackcraftllc/codevideo-types';
import { getEditorModelPath } from '../utils/getEditorModelPath.js';
import { debugWarn } from '../utils/debugLog.js';
import { collectProjectFiles, diagnosticsInputKey } from './collectProjectFiles.js';
import { createMonacoDiagnosticsEngine, DiagnosticsEngine } from './monacoDiagnosticsEngine.js';

/** What a render checkpoint stores: the last computation and the squiggles as currently placed. */
export interface DiagnosticsCheckpoint {
  key: string | null;
  byPath: Record<string, Array<ICodeVideoDiagnostic>>;
  /** The text each computed file had, so results only land on matching models. */
  contents: Record<string, string>;
  /** Per model URI, with the ranges that edits since the computation moved them to. */
  live: Record<string, Array<ICodeVideoDiagnostic>>;
}

export interface DiagnosticsController {
  /** Resolves once no computation is in flight. */
  whenIdle(): Promise<void>;
  /** Where the mouse goes for a hover location in the active editor; null if that file isn't active. */
  hoverPosition(location: IDiagnosticLocation): { line: number; column: number } | null;
  /** The visible diagnostics under a hover location, with their current ranges. */
  hoverDiagnostics(location: IDiagnosticLocation): Array<ICodeVideoDiagnostic>;
  capture(): DiagnosticsCheckpoint | undefined;
  restore(checkpoint: DiagnosticsCheckpoint | undefined): void;
}

export interface UseDiagnosticsParams {
  /** False keeps the IDE exactly as it was before diagnostics existed: no worker, no decorations. */
  enabled: boolean;
  visible: boolean;
  hydrating?: boolean;
  renderMode: RenderMode;
  editors: Array<IEditor> | undefined;
  fileStructure: IFileStructure | undefined;
  /** The active editor's file. Showing a file creates its model, which then needs its squiggles. */
  activePath?: string;
  monacoEditorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
  globalMonacoRef: React.MutableRefObject<Monaco | undefined>;
  onError?: (error: Error) => void;
  /** Injectable for tests; defaults to Monaco's TypeScript worker. */
  createEngine?: (monaco: Monaco) => DiagnosticsEngine;
}

interface Tracked { key: string | null; ids: Array<string>; diagnostics: Array<ICodeVideoDiagnostic> }
type Computed = Pick<DiagnosticsCheckpoint, 'key' | 'byPath' | 'contents'>;

const LANES = { error: 30, warning: 20, info: 10 } as const;

function decorationFor(diagnostic: ICodeVideoDiagnostic): monaco.editor.IModelDeltaDecoration {
  const { severity } = diagnostic;
  return {
    range: { startLineNumber: diagnostic.line, startColumn: diagnostic.column, endLineNumber: diagnostic.endLine, endColumn: diagnostic.endColumn },
    options: {
      // Not Monaco's squiggly-* classes: renderValidationDecorations filters
      // those, and it stays 'off' so Monaco's own validation never shows.
      className: `codevideo-squiggly-${severity}`,
      // Same tracking as Monaco's marker decorations.
      stickiness: 1, // TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      showIfCollapsed: true,
      zIndex: LANES[severity],
      overviewRuler: { color: { id: `editorOverviewRuler.${severity}Foreground` }, position: 4 /* OverviewRulerLane.Right */ },
      ...(severity === 'info' ? {} : { minimap: { color: { id: `minimap.${severity}Highlight` }, position: 1 /* MinimapPosition.Inline */ } }),
    },
  };
}

/**
 * TypeScript squiggles for CodeVideoIDE. When the files or the set of open
 * editors change (an action finished, a file opened), every open TS/JS file is
 * re-checked and the results are drawn as decorations. In deterministic
 * renders each computation is handed to the CLI's virtual clock, which holds
 * time still until it resolves, so squiggles appear in the same frame however
 * a render is split across workers. Checkpoints carry the squiggles with their
 * current ranges, so a resumed worker draws exactly what a continuous run has
 * at that moment, even partway through typing.
 */
export function useDiagnostics(params: UseDiagnosticsParams) {
  const { enabled, visible, hydrating = false, renderMode, editors, fileStructure, activePath, monacoEditorRef, globalMonacoRef } = params;
  const latest = useRef(params); latest.current = params;
  const [version, setVersion] = useState(0);
  const [mountTick, setMountTick] = useState(0);

  const files = useMemo<Array<IFileSource>>(() => (enabled ? collectProjectFiles(fileStructure, editors) : []), [enabled, fileStructure, editors]);
  const targets = useMemo(() => (enabled
    ? Array.from(new Set((editors ?? []).map(editor => normalizeDiagnosticsPath(editor.filename ?? '')))).filter(path => path && getDiagnosticsChecks(path)).sort()
    : []), [enabled, editors]);
  const key = useMemo(() => (enabled ? diagnosticsInputKey(files, targets) : null), [enabled, files, targets]);

  const store = useRef({
    engine: null as DiagnosticsEngine | null,
    computed: null as Computed | null,
    tracked: new Map<string, Tracked>(),
    pending: null as Promise<void> | null,
    run: 0,
    visible: false,
  }).current;

  const api = () => globalMonacoRef.current;
  const modelFor = (uri: string) => {
    const monacoApi = api();
    return monacoApi ? monacoApi.editor.getModel(monacoApi.Uri.parse(uri)) : null;
  };
  const pathOf = (model: monaco.editor.ITextModel) => {
    const uri = model.uri.toString();
    return Object.keys(store.computed?.byPath ?? {}).find(path => getEditorModelPath(path) === uri);
  };
  const live = (uri: string): Array<ICodeVideoDiagnostic> => {
    const tracked = store.tracked.get(uri), model = modelFor(uri);
    if (!tracked || !model) return [];
    return tracked.diagnostics.flatMap((diagnostic, index) => {
      const range = model.getDecorationRange(tracked.ids[index]);
      return range ? [{ ...diagnostic, line: range.startLineNumber, column: range.startColumn, endLine: range.endLineNumber, endColumn: range.endColumn }] : [];
    });
  };
  const clear = (uri: string) => {
    const tracked = store.tracked.get(uri);
    if (tracked) modelFor(uri)?.deltaDecorations(tracked.ids, []);
    store.tracked.delete(uri);
  };
  const apply = (model: monaco.editor.ITextModel) => {
    const uri = model.uri.toString(), computed = store.computed, path = pathOf(model);
    if (!computed || path === undefined) { clear(uri); return; }
    const tracked = store.tracked.get(uri);
    // Already drawn for this computation: keep the ranges edits have moved.
    if (tracked && tracked.key === computed.key && (tracked.ids.length === 0 || model.getDecorationRange(tracked.ids[0]))) return;
    // Results for other text would land in the wrong place; the next computation fixes it.
    if (model.getValue() !== computed.contents[path]) { clear(uri); return; }
    const diagnostics = computed.byPath[path];
    store.tracked.set(uri, { key: computed.key, ids: model.deltaDecorations(tracked?.ids ?? [], diagnostics.map(decorationFor)), diagnostics });
  };
  const applyAll = () => {
    const monacoApi = api();
    if (!monacoApi) return;
    for (const model of monacoApi.editor.getModels()) apply(model);
    setVersion(v => v + 1);
  };
  const clearAll = () => {
    if (store.tracked.size === 0) return;
    for (const uri of Array.from(store.tracked.keys())) clear(uri);
    setVersion(v => v + 1);
  };
  const engine = () => {
    if (!store.engine) store.engine = (latest.current.createEngine ?? createMonacoDiagnosticsEngine)(api()!);
    return store.engine;
  };

  useEffect(() => {
    store.visible = enabled && visible;
    if (!enabled || hydrating || !api()) return;
    engine().warmUp();
    if (!visible) { clearAll(); return; }
    if (store.computed && key === store.computed.key) { applyAll(); return; }
    const run = ++store.run;
    // No TS/JS editor open: nothing can show a squiggle, so skip the worker round trip.
    if (targets.length === 0) {
      store.computed = { key, byPath: {}, contents: {} };
      applyAll();
      return;
    }
    const inputs = { key, files, targets };
    const contents = Object.fromEntries(files.filter(file => targets.includes(file.path)).map(file => [file.path, file.content]));
    const job = engine().compute(inputs.files, inputs.targets).then(results => {
      if (run !== store.run) return;
      const byPath: Record<string, Array<ICodeVideoDiagnostic>> = Object.fromEntries(inputs.targets.map(path => [path, []]));
      for (const diagnostic of results) byPath[diagnostic.path]?.push(diagnostic);
      store.computed = { key: inputs.key, byPath, contents };
      if (store.visible) applyAll();
    }, (error: unknown) => {
      if (run !== store.run) return;
      const failure = new Error(`TypeScript diagnostics failed: ${error instanceof Error ? error.message : String(error)}`);
      // A deterministic render must not quietly finish without its squiggles.
      if (latest.current.renderMode === 'deterministic' && latest.current.onError) latest.current.onError(failure);
      else debugWarn(failure.message);
    }).finally(() => { if (store.pending === job) store.pending = null; });
    store.pending = job;
    if (renderMode === 'deterministic') (window as any).__codeVideoClock?.track?.(job);
  }, [enabled, visible, hydrating, key, activePath, mountTick]);

  useEffect(() => () => { store.run++; store.engine?.dispose(); store.engine = null; }, []);

  const hoverPosition = (location: IDiagnosticLocation): { line: number; column: number } | null => {
    const model = monacoEditorRef.current?.getModel();
    if (!model || model.uri.toString() !== getEditorModelPath(location.path) || location.line > model.getLineCount()) return null;
    if (location.column) return { line: location.line, column: Math.min(location.column, model.getLineMaxColumn(location.line)) };
    const first = live(model.uri.toString()).filter(d => d.line === location.line).sort((a, b) => a.column - b.column)[0];
    return { line: location.line, column: first?.column ?? (model.getLineFirstNonWhitespaceColumn(location.line) || 1) };
  };

  const controller = useRef<DiagnosticsController>({
    whenIdle: () => store.pending ?? Promise.resolve(),
    hoverPosition: location => hoverPosition(location),
    hoverDiagnostics(location) {
      const position = store.visible ? hoverPosition(location) : null;
      const model = monacoEditorRef.current?.getModel();
      if (!position || !model) return [];
      return live(model.uri.toString()).filter(d => diagnosticContains(d, position.line, position.column));
    },
    capture() {
      if (!latest.current.enabled) return undefined;
      return {
        key: store.computed?.key ?? null, byPath: store.computed?.byPath ?? {}, contents: store.computed?.contents ?? {},
        live: Object.fromEntries(Array.from(store.tracked.keys()).map(uri => [uri, live(uri)])),
      };
    },
    restore(checkpoint) {
      if (!checkpoint) return;
      store.computed = { key: checkpoint.key, byPath: checkpoint.byPath, contents: checkpoint.contents };
      for (const [uri, diagnostics] of Object.entries(checkpoint.live)) {
        const model = modelFor(uri);
        if (!model) throw new Error(`Checkpoint diagnostics refer to a missing model: ${uri}`);
        store.tracked.set(uri, { key: checkpoint.key, ids: model.deltaDecorations([], diagnostics.map(decorationFor)), diagnostics });
      }
      setVersion(v => v + 1);
    },
  }).current;

  /** Chain after the editor's onMount; Monaco may mount after the inputs settled. */
  const onEditorMount = () => { if (latest.current.enabled) setMountTick(t => t + 1); };

  return { controller, version, onEditorMount };
}
