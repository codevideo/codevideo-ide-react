import type * as monaco from 'monaco-editor';

/** Absolute virtual deadlines survive a worker restart without a fresh hold. */
export function scrollbarOpacity(fadeStartMs: number | null, timestampMs: number): number {
  return fadeStartMs === null ? 0 : Math.max(0, Math.min(1, 1 - (timestampMs - fadeStartMs) / 800));
}

export function paintScrollbars(editor: monaco.editor.IStandaloneCodeEditor, fadeStartMs: number | null, timestampMs: number) {
  const node = editor.getDomNode(), layout = editor.getLayoutInfo();
  const opacity = scrollbarOpacity(fadeStartMs, timestampMs);
  node?.style.setProperty('--codevideo-scrollbar-vertical', String(editor.getScrollHeight() > layout.height ? opacity : 0));
  node?.style.setProperty('--codevideo-scrollbar-horizontal', String(editor.getScrollWidth() > layout.contentWidth ? opacity : 0));
}
