import React, { useLayoutEffect, useRef, useState } from 'react';
import type * as monaco from 'monaco-editor';
import { DiagnosticSeverity, ICodeVideoDiagnostic } from '@fullstackcraftllc/codevideo-types';

// Monaco 0.52's vs / vs-dark defaults for editorError/Warning/Info.foreground
// and editorHoverWidget, so squiggles and the hover look like Monaco's own.
const THEMES = {
  dark: {
    squiggle: { error: '#f14c4c', warning: '#cca700', info: '#3794ff' } as Record<DiagnosticSeverity, string>,
    background: '#252526', border: '#454545', foreground: '#cccccc', code: 'rgba(204, 204, 204, 0.7)', shadow: 'rgba(0, 0, 0, 0.36)',
  },
  light: {
    squiggle: { error: '#e51400', warning: '#bf8803', info: '#1a85ff' } as Record<DiagnosticSeverity, string>,
    background: '#f3f3f3', border: '#c8c8c8', foreground: '#616161', code: '#717171', shadow: 'rgba(0, 0, 0, 0.16)',
  },
};

/** Monaco's squiggle (getSquigglySVGData), drawn under codevideo-squiggly-* decorations. */
export function squiggleStyles(theme: 'light' | 'dark'): string {
  return (Object.entries(THEMES[theme].squiggle) as Array<[DiagnosticSeverity, string]>).map(([severity, color]) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 3" enable-background="new 0 0 6 3" height="3" width="6"><g fill="${color}"><polygon points="5.5,0 2.5,3 1.1,3 4.1,0"/><polygon points="4,0 6,2 6,0.6 5.4,0"/><polygon points="0,2 1,3 2.4,3 0,0.6"/></g></svg>`;
    return `.monaco-editor .codevideo-squiggly-${severity} { background: url("data:image/svg+xml,${encodeURIComponent(svg)}") repeat-x bottom left; }`;
  }).join('\n');
}

export interface DiagnosticHoverProps {
  editor: monaco.editor.IStandaloneCodeEditor | undefined;
  /** The hovered spot (line and column in the active editor). */
  anchor: { line: number; column: number } | null;
  /** Everything under the anchor, as from DiagnosticsController.hoverDiagnostics. */
  diagnostics: Array<ICodeVideoDiagnostic>;
  theme: 'light' | 'dark';
  fontSizePx: number;
}

/**
 * The hover VS Code shows over a squiggle: each message with its ts(code),
 * above the line when it fits, else below. Drawn by React rather than Monaco's
 * hover widget, whose quick-fix and quick-info sections arrive asynchronously
 * from the language worker and would make frames nondeterministic. Render it
 * inside the positioned box that holds the editor.
 */
export function DiagnosticHover({ editor, anchor, diagnostics, theme, fontSizePx }: DiagnosticHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null);
  const show = !!editor && !!anchor && diagnostics.length > 0;
  const signature = show ? JSON.stringify([anchor, diagnostics, theme, fontSizePx]) : '';
  const colors = THEMES[theme];
  const fontSize = Math.round(fontSizePx * 13 / 14);

  useLayoutEffect(() => {
    const element = ref.current, box = element?.offsetParent as HTMLElement | null | undefined;
    const node = editor?.getDomNode();
    if (!show || !element || !box || !node || !anchor) { setPlacement(null); return; }
    // Anchor at the squiggle's start on the hovered line, like Monaco's hover.
    const first = diagnostics[0];
    const column = first.line === anchor.line ? first.column : 1;
    const position = editor!.getScrolledVisiblePosition({ lineNumber: anchor.line, column });
    if (!position) { setPlacement(null); return; }
    const editorRect = node.getBoundingClientRect(), boxRect = box.getBoundingClientRect();
    const lineTop = editorRect.top - boxRect.top + position.top;
    const above = lineTop - element.offsetHeight - 2;
    setPlacement({
      left: Math.max(0, Math.min(editorRect.left - boxRect.left + position.left, boxRect.width - element.offsetWidth - 4)),
      top: above >= 0 ? above : lineTop + position.height + 2,
    });
  }, [signature, editor]);

  if (!show) return null;
  return (
    <div
      ref={ref}
      data-testid="codevideo-diagnostic-hover"
      style={{
        position: 'absolute', zIndex: 40, left: placement?.left ?? 0, top: placement?.top ?? 0,
        visibility: placement ? 'visible' : 'hidden',
        maxWidth: `min(${Math.round(500 * fontSizePx / 14)}px, calc(100% - 8px))`,
        boxSizing: 'border-box', pointerEvents: 'none', userSelect: 'none',
        background: colors.background, color: colors.foreground, border: `1px solid ${colors.border}`,
        borderRadius: 3, boxShadow: `0 2px 8px ${colors.shadow}`,
        fontFamily: 'var(--default-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
        fontSize, lineHeight: 1.45,
      }}
    >
      {diagnostics.map((diagnostic, index) => (
        <div key={index} style={{ padding: '4px 8px', borderTop: index ? `1px solid ${colors.border}` : undefined }}>
          <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{diagnostic.message}</span>
          <span style={{ color: colors.code, marginLeft: '0.5em', whiteSpace: 'nowrap' }}>ts({diagnostic.code})</span>
        </div>
      ))}
    </div>
  );
}
