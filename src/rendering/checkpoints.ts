import { paintScrollbars } from './presentation.js';
import type { RenderCheckpointV1, RenderCheckpointV2 } from './types.js';
import { isSteppableAction } from '@fullstackcraftllc/codevideo-types';
import type { CodeVideoIDEState, RenderUIState } from '../state/useCodeVideoIDEState.js';

export function validateCheckpoint(checkpoint: RenderCheckpointV2, fingerprint: string, seed: string, lesson: number | null) {
  const fail = () => { throw new Error('Invalid or incompatible CodeVideo render checkpoint'); };
  if (!checkpoint || checkpoint.version !== 2 || checkpoint.fingerprint !== fingerprint || checkpoint.renderSeed !== seed || checkpoint.lessonIndex !== lesson) fail();
  if (!checkpoint.cursor || !Number.isInteger(checkpoint.cursor.actionIndex) || checkpoint.cursor.actionIndex < 0 || !Number.isFinite(checkpoint.timestampMs) || checkpoint.timestampMs < 0 || checkpoint.cursor.timestampMs !== checkpoint.timestampMs) fail();
  if (!Number.isInteger(checkpoint.tracePosition) || checkpoint.tracePosition < 0 || !Array.isArray(checkpoint.inputs)) fail();
  const continuation = checkpoint.cursor.continuation;
  if (continuation !== null) {
    if (!continuation || !continuation.action || !isSteppableAction(continuation.action) || typeof continuation.action.value !== 'string' ||
        continuation.phase !== 'steps' || !Number.isInteger(continuation.sourceOffset) || continuation.sourceOffset < 0 ||
        !Number.isInteger(continuation.nextPrimitive) || continuation.nextPrimitive < 0 || typeof continuation.typosAllowed !== 'boolean' ||
        (continuation.nextDeadlineMs !== null && (!Number.isFinite(continuation.nextDeadlineMs) || continuation.nextDeadlineMs < checkpoint.timestampMs))) fail();
    const correction = continuation.pendingCorrection;
    if (correction !== null && (!correction || !['text', 'editor'].includes(correction.kind) || !Number.isInteger(correction.start) ||
        correction.start < 0 || !/^[a-z]$/i.test(correction.text) || (correction.kind === 'editor' && typeof correction.uri !== 'string'))) fail();
  }
  if (!checkpoint.ui || !checkpoint.overlay || !checkpoint.monaco || !Array.isArray(checkpoint.monaco.models) || !Array.isArray(checkpoint.scroll)) fail();
  if (!checkpoint.presentation || (checkpoint.presentation.terminalCaretDeadlineMs !== null && !Number.isFinite(checkpoint.presentation.terminalCaretDeadlineMs))) fail();
  if (!checkpoint.monaco.layout || !Number.isFinite(checkpoint.monaco.layout.width) || !Number.isFinite(checkpoint.monaco.layout.height)) fail();
  if (checkpoint.monaco.scrollbarFadeStartMs !== null && !Number.isFinite(checkpoint.monaco.scrollbarFadeStartMs)) fail();
  for (const point of [checkpoint.mouse?.current, checkpoint.mouse?.target, checkpoint.mouse?.previous, checkpoint.mouse?.lastTarget]) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) fail();
  }
  if (!checkpoint.viewport || checkpoint.viewport.width !== window.innerWidth || checkpoint.viewport.height !== window.innerHeight || checkpoint.viewport.deviceScaleFactor !== window.devicePixelRatio) fail();
}

export function captureUI(state: CodeVideoIDEState): RenderUIState {
  // State values are JSON data; setter functions and mutable DOM/Monaco refs are
  // represented separately. Never serialize a React ref or a browser object.
  return JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(state).filter(([key, value]) => !key.endsWith('Ref') && typeof value !== 'function'))));
}

export function captureMonaco(state: CodeVideoIDEState): RenderCheckpointV1['monaco'] {
  const editor = state.monacoEditorRef.current;
  const api = state.globalMonacoRef.current;
  if (!editor || !api) throw new Error('Cannot checkpoint before Monaco is ready');
  return {
    scrollbarFadeStartMs: state.scrollbarFadeStartRef.current,
    models: api.editor.getModels().map(model => ({ uri: model.uri.toString(), content: model.getValue(), language: model.getLanguageId() })),
    activeUri: editor.getModel()?.uri.toString() ?? null,
    layout: { width: editor.getLayoutInfo().width, height: editor.getLayoutInfo().height },
    viewState: editor.saveViewState(), savedOverlayViewState: state.editorViewStateRef.current,
    modelViewStates: state.modelViewStatesRef.current, focused: editor.hasTextFocus(),
  };
}

export function captureInputs(): RenderCheckpointV2['inputs'] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[data-codevideo-id]')).map(el => ({
    id: el.dataset.codevideoId!, selectionStart: el.selectionStart, selectionEnd: el.selectionEnd,
    selectionDirection: el.selectionDirection, focused: el === document.activeElement, scrollLeft: el.scrollLeft,
  }));
}

export async function restoreMonaco(state: CodeVideoIDEState, checkpoint: RenderCheckpointV2) {
  const editor = state.monacoEditorRef.current;
  const api = state.globalMonacoRef.current;
  if (!editor || !api) throw new Error('Cannot restore before Monaco is ready');
  // Language support loads asynchronously. Resolve it during suspended native
  // bootstrap, before the virtual clock can freeze its module-loading timers.
  await Promise.all(Array.from(new Set(checkpoint.monaco.models.map(model => model.language)))
    .map(language => api.editor.colorize('', language, {})));
  api.editor.remeasureFonts();
  for (const entry of checkpoint.monaco.models) {
    if (typeof entry.uri !== 'string' || typeof entry.content !== 'string' || typeof entry.language !== 'string') throw new Error('Invalid checkpoint model');
    const uri = api.Uri.parse(entry.uri);
    const model = api.editor.getModel(uri) ?? api.editor.createModel(entry.content, entry.language, uri);
    if (model.getValue() !== entry.content) model.setValue(entry.content);
    api.editor.setModelLanguage(model, entry.language);
  }
  const active = checkpoint.monaco.activeUri ? api.editor.getModel(api.Uri.parse(checkpoint.monaco.activeUri)) : null;
  if (checkpoint.monaco.activeUri && !active) throw new Error('Checkpoint active model is missing');
  editor.setModel(active);
  state.modelViewStatesRef.current = checkpoint.monaco.modelViewStates;
  state.editorViewStateRef.current = checkpoint.monaco.savedOverlayViewState;
  editor.layout(checkpoint.monaco.layout);
  editor.restoreViewState(checkpoint.monaco.viewState);
  if (checkpoint.monaco.focused) editor.focus();
  editor.render(true);
  state.terminalCaretDeadlineRef.current = checkpoint.presentation.terminalCaretDeadlineMs;
  state.scrollbarFadeStartRef.current = checkpoint.monaco.scrollbarFadeStartMs;
  paintScrollbars(editor, checkpoint.monaco.scrollbarFadeStartMs, checkpoint.timestampMs);
  for (const item of checkpoint.scroll) {
    const element = document.querySelector<HTMLElement>(`[data-codevideo-id="${CSS.escape(item.id)}"]`);
    if (element) { element.scrollTop = item.top; element.scrollLeft = item.left; }
  }
  for (const item of checkpoint.inputs) {
    const input = document.querySelector<HTMLInputElement>(`input[data-codevideo-id="${CSS.escape(item.id)}"]`);
    if (!input) throw new Error(`Checkpoint input is missing: ${item.id}`);
    if (item.focused) input.focus({ preventScroll: true });
    input.setSelectionRange(item.selectionStart, item.selectionEnd, item.selectionDirection ?? undefined);
    input.scrollLeft = item.scrollLeft;
  }
}
