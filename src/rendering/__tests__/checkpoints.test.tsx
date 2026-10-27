import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useCodeVideoIDEState } from '../../state/useCodeVideoIDEState';
import { useRenderSession } from '../../hooks/useRenderSession';
import { validateCheckpoint } from '../checkpoints';
import type { RenderCheckpointV2, RenderSession } from '../types';

const overlay = { isSlideDisplayStep: true, slideMarkdown: '# Still visible', isExternalWebPreviewDisplayStep: false, webPreviewFilesState: [], isExternalBrowserDisplayStep: false, externalBrowserStepUrlState: null };
function harness(session: RenderSession = {kind: 'plan', fingerprint: 'project'}, animating = false) {
  let boundary: () => void = () => {};
  (window as any).__codeVideoClock = { atBoundary: (fn: () => void) => { boundary = fn; } };
  document.getAnimations = () => [];
  const onCheckpoint = jest.fn(), onComplete = jest.fn(), onError = jest.fn();
  const view = { cursorState: [], viewState: { scrollTop: 210, scrollLeft: 20 }, contributionsState: {} } as any;
  const model = { uri: { toString: () => 'file:///a.ts' }, getValue: () => 'actual model text', getLanguageId: () => 'typescript' };
  const editor = { getModel: () => model, saveViewState: () => view, hasTextFocus: () => true, getLayoutInfo: () => ({width: 800, height: 500}) };
  const { result } = renderHook(() => {
    const state = useCodeVideoIDEState('typescript');
    state.monacoEditorRef.current = editor as any;
    state.globalMonacoRef.current = {editor: {getModels: () => [model]}} as any;
    const mouse = React.useRef({ current: {x: 5, y: 6}, target: {x: 5, y: 6}, previous: {x: 1, y: 2}, lastTarget: {x: 5, y: 6}, animating });
    const controller = useRenderSession({tracePosition: {current: 7}, session, state, overlay, mouse, seed: 'seed', lesson: null, totalActions: 4, onRenderCheckpoint: onCheckpoint, onRenderSegmentComplete: onComplete, onError});
    return {state, controller};
  }, {wrapper: ({children}) => <React.StrictMode>{children}</React.StrictMode>});
  return { result, flush: () => act(() => boundary()), onCheckpoint, onComplete, onError };
}

test('boundary captures committed UI, actual Monaco state and overlay continuation before advancing', () => {
  const h = harness(), advance = jest.fn();
  act(() => { h.result.current.state.setRenameFileInputValue('renamed.ts'); h.result.current.state.setIsUnsavedChangesDialogOpen(true); h.result.current.state.setTerminalBuffer('output'); });
  h.result.current.controller.finishBoundary(2, advance);
  expect(advance).not.toHaveBeenCalled(); h.flush();
  const checkpoint: RenderCheckpointV2 = h.onCheckpoint.mock.calls[0][0];
  expect(checkpoint.ui.renameFileInputValue).toBe('renamed.ts');
  expect(checkpoint.ui.isUnsavedChangesDialogOpen).toBe(true);
  expect(checkpoint.ui.terminalBuffer).toBe('output');
  expect(checkpoint.monaco.models[0].content).toBe('actual model text');
  expect(checkpoint.monaco.viewState?.viewState.scrollTop).toBe(210);
  expect(checkpoint.overlay).toEqual(overlay);
  expect(advance).toHaveBeenCalledTimes(1);
  expect(() => validateCheckpoint(checkpoint, 'project', 'seed', null)).not.toThrow();
  expect(() => validateCheckpoint(checkpoint, 'wrong-project', 'seed', null)).toThrow(/incompatible/);
  expect(() => validateCheckpoint({...checkpoint, viewport: {...checkpoint.viewport, width: 5}}, 'project', 'seed', null)).toThrow(/incompatible/);
});

test('unfinished mouse motion skips the checkpoint and advances without a delay', () => {
  const h = harness(undefined, true), advance = jest.fn();
  h.result.current.controller.finishBoundary(2, advance); h.flush();
  expect(h.onCheckpoint).not.toHaveBeenCalled(); expect(advance).toHaveBeenCalledTimes(1);
});

test('a segment ends without starting the next action or completing the whole project', () => {
  jest.spyOn(performance, 'now').mockReturnValue(4000);
  const h = harness({kind: 'segment', fingerprint: 'project', endCursor: {actionIndex: 2, timestampMs: 4000, continuation: null}}), advance = jest.fn();
  h.result.current.controller.finishBoundary(2, advance); h.flush();
  expect(advance).not.toHaveBeenCalled(); expect(h.onComplete).toHaveBeenCalledTimes(1); expect(h.onError).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});

test('restoration loads language support, restores exact layout and model/view caches', async () => {
  const h = harness();
  h.result.current.controller.finishBoundary(2, jest.fn()); h.flush();
  const checkpoint: RenderCheckpointV2 = h.onCheckpoint.mock.calls[0][0];
  const calls: string[] = [];
  const model = { getValue: () => 'stale', setValue: jest.fn(() => calls.push('content')) };
  const editor = {setModel: jest.fn(), layout: jest.fn(), restoreViewState: jest.fn(), focus: jest.fn(), render: jest.fn(), getDomNode: () => null, getLayoutInfo: () => ({width: 800, height: 500}), getScrollHeight: () => 500, getScrollWidth: () => 800};
  const api = {Uri: {parse: (uri: string) => uri}, editor: {
    colorize: jest.fn(async () => { calls.push('language'); }), remeasureFonts: jest.fn(),
    getModel: jest.fn(() => model), setModelLanguage: jest.fn(),
  }};
  const state = {...h.result.current.state, monacoEditorRef: {current: editor}, globalMonacoRef: {current: api}} as any;
  const {restoreMonaco} = await import('../checkpoints');
  await restoreMonaco(state, checkpoint);
  expect(calls).toEqual(['language', 'content']);
  expect(editor.layout).toHaveBeenCalledWith({width: 800, height: 500});
  expect(editor.restoreViewState).toHaveBeenCalledWith(checkpoint.monaco.viewState);
  expect(state.modelViewStatesRef.current).toEqual(checkpoint.monaco.modelViewStates);
  expect(editor.focus).toHaveBeenCalledTimes(1);
});

test('unfinished CSS presentation excludes a boundary without delaying the next action', () => {
  const h = harness(), advance = jest.fn();
  document.getAnimations = () => [{currentTime: 5, effect: {getComputedTiming: () => ({progress: .5, endTime: 10})}}] as any;
  h.result.current.controller.finishBoundary(2, advance); h.flush();
  expect(h.onCheckpoint).not.toHaveBeenCalled(); expect(advance).toHaveBeenCalledTimes(1);
});

test('presentation deadlines retain their remaining hold and fade time', async () => {
  const {scrollbarOpacity} = await import('../presentation');
  expect(scrollbarOpacity(null, 2000)).toBe(0);
  expect(scrollbarOpacity(2500, 2400)).toBe(1);
  expect(scrollbarOpacity(2500, 2700)).toBe(.75);
  expect(scrollbarOpacity(2500, 3300)).toBe(0);
});
