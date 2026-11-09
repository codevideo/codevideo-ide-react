import { IDiagnosticLocation, IPoint } from "@fullstackcraftllc/codevideo-types";
import type * as monaco from 'monaco-editor';
import { convertToContainerCoordinates } from "./convertToContainerCoordinates.js";
import type { DiagnosticsController } from "../../diagnostics/useDiagnostics.js";

/**
 * The middle of the character at a diagnostic location in the active editor,
 * scrolling it into view first. Exact, never randomized: the hover has to land
 * on the squiggle. Null when the location's file isn't the active editor.
 */
export const getCoordinatesOfDiagnostic = (
  editor: monaco.editor.ICodeEditor,
  containerRef: React.RefObject<HTMLDivElement | null>,
  location: IDiagnosticLocation,
  diagnostics: DiagnosticsController
): IPoint | null => {
  const target = diagnostics.hoverPosition(location);
  const node = editor.getDomNode();
  if (!target || !node) return null;
  const position = { lineNumber: target.line, column: target.column };
  editor.revealPositionInCenterIfOutsideViewport(position);
  const here = editor.getScrolledVisiblePosition(position);
  if (!here) return null;
  const next = editor.getScrolledVisiblePosition({ lineNumber: target.line, column: target.column + 1 });
  const halfCharacter = next && next.top === here.top && next.left > here.left ? (next.left - here.left) / 2 : 0;
  const rect = node.getBoundingClientRect();
  return convertToContainerCoordinates({ x: rect.left + here.left + halfCharacter, y: rect.top + here.top + here.height / 2 }, containerRef);
};
