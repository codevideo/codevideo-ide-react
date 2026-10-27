import type { IPoint } from '@fullstackcraftllc/codevideo-types';

export type RenderEvent =
  | { type: 'action-start' | 'action-end'; actionIndex: number; name: string; timestampMs: number }
  | { type: 'speech'; actionIndex: number; name: string; text: string; timestampMs: number; durationMs: number; assetId: string }
  | { type: 'mouse-path'; actionIndex: number; timestampMs: number; target: IPoint; controlPoints: IPoint[] };

/** Implementation-specific instrumentation, kept out of codevideo-types. */
export interface RenderCallbacks {
  onRenderEvent?: (event: RenderEvent) => void;
  onRenderError?: (error: Error) => void;
}

import type { RenderUIState } from '../state/useCodeVideoIDEState.js';
import type { OverlayDisplayState } from '../hooks/useOverlayDisplay.js';
import type * as monaco from 'monaco-editor';
import type { PlaybackContinuation } from '../playback/types.js';

/** Ephemeral renderer data, valid only for this project/settings/build. */
export interface RenderCheckpointV1 {
  version: 1;
  fingerprint: string;
  renderSeed: string;
  lessonIndex: number | null;
  nextActionIndex: number;
  timestampMs: number;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  ui: RenderUIState;
  overlay: OverlayDisplayState;
  presentation: { terminalCaretDeadlineMs: number | null };
  mouse: { current: IPoint; target: IPoint; previous: IPoint; lastTarget: IPoint };
  monaco: {
    models: Array<{ uri: string; content: string; language: string }>;
    activeUri: string | null;
    layout: { width: number; height: number };
    scrollbarFadeStartMs: number | null;
    viewState: monaco.editor.ICodeEditorViewState | null;
    savedOverlayViewState: monaco.editor.ICodeEditorViewState | null;
    modelViewStates: Record<string, monaco.editor.ICodeEditorViewState>;
    focused: boolean;
  };
  scroll: Array<{ id: string; top: number; left: number }>;
}

export interface RenderExecutionCursor {
  actionIndex: number;
  timestampMs: number;
  continuation: PlaybackContinuation | null;
}

/** V1 remains a historical declaration; the current bridge only accepts V2. */
export interface RenderCheckpointV2 extends Omit<RenderCheckpointV1, 'version' | 'nextActionIndex'> {
  version: 2;
  cursor: RenderExecutionCursor;
  tracePosition: number;
  inputs: Array<{ id: string; selectionStart: number | null; selectionEnd: number | null; selectionDirection: 'forward' | 'backward' | 'none' | null; focused: boolean; scrollLeft: number }>;
}

export type RenderSession = {
  fingerprint: string;
  kind: 'plan' | 'segment';
  checkpoint?: RenderCheckpointV2;
  endCursor?: RenderExecutionCursor;
};

export interface RenderSessionController {
  restore(): Promise<void>;
  readonly resumed: boolean;
  continuation(actionIndex: number): PlaybackContinuation | null;
  stepBoundary(actionIndex: number, continuation: PlaybackContinuation): Promise<boolean>;
  finishBoundary(nextActionIndex: number, advance: () => void): void;
}

export interface RenderSessionCallbacks {
  onRenderSessionReady?: (controller: RenderSessionController) => void;
  onRenderCheckpoint?: (checkpoint: RenderCheckpointV2) => void;
  onRenderSegmentComplete?: () => void;
}
