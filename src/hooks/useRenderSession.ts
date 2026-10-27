import { useEffect, useRef } from 'react';
import type { CodeVideoIDEState } from '../state/useCodeVideoIDEState.js';
import type { OverlayDisplayState } from './useOverlayDisplay.js';
import type { RenderCheckpointV1, RenderCheckpointV2, RenderExecutionCursor, RenderSession, RenderSessionCallbacks, RenderSessionController } from '../rendering/types.js';
import type { PlaybackContinuation } from '../playback/types.js';
import { captureInputs, captureMonaco, captureUI, restoreMonaco, validateCheckpoint } from '../rendering/checkpoints.js';

interface Params extends RenderSessionCallbacks {
  session?: RenderSession;
  state: CodeVideoIDEState;
  overlay: OverlayDisplayState;
  mouse: React.MutableRefObject<(RenderCheckpointV1['mouse'] & { animating: boolean }) | null>;
  tracePosition: React.MutableRefObject<number>;
  seed: string;
  lesson: number | null;
  totalActions: number;
  onError?: (error: Error) => void;
}

/** The clock runs handshakes only after same-time effects/timers settle. */
export function useRenderSession(params: Params) {
  const latest = useRef(params); latest.current = params;
  function boundary(cursor: RenderExecutionCursor, advance: (keepPlaying: boolean) => void) {
    const p = latest.current;
    if (!p.session) { advance(true); return; }
    const clock = (window as any).__codeVideoClock;
    if (!clock?.atBoundary) throw new Error('Checkpoint rendering requires the virtual clock boundary handshake');
    clock.atBoundary(() => {
      const p = latest.current;
      try {
        const session = p.session!;
        if (session.kind === 'segment' && session.endCursor &&
            JSON.stringify(cursor) === JSON.stringify(session.endCursor)) {
          p.onRenderSegmentComplete?.();
          advance(false);
          return;
        }
        const mouse = p.mouse.current;
        const unsupportedAnimation = document.getAnimations().some(animation => {
          const timing = animation.effect?.getComputedTiming();
          return timing && timing.progress !== null && Number(animation.currentTime) < Number(timing.endTime);
        });
        if (session.kind === 'plan' && cursor.actionIndex < p.totalActions && mouse && !mouse.animating &&
            !unsupportedAnimation && !p.state.isRestoringViewStateRef.current) {
          const { animating, ...position } = mouse;
          const checkpoint: RenderCheckpointV2 = {
            version: 2, fingerprint: session.fingerprint, renderSeed: p.seed, lessonIndex: p.lesson,
            cursor, timestampMs: cursor.timestampMs, tracePosition: p.tracePosition.current,
            viewport: { width: window.innerWidth, height: window.innerHeight, deviceScaleFactor: window.devicePixelRatio },
            presentation: { terminalCaretDeadlineMs: p.state.terminalCaretDeadlineRef.current },
            ui: captureUI(p.state), overlay: p.overlay, mouse: position, monaco: captureMonaco(p.state),
            inputs: captureInputs(),
            scroll: Array.from(document.querySelectorAll<HTMLElement>('[data-codevideo-id]')).filter(el => el.scrollTop || el.scrollLeft).map(el => ({ id: el.dataset.codevideoId!, top: el.scrollTop, left: el.scrollLeft })),
          };
          p.onRenderCheckpoint?.(JSON.parse(JSON.stringify(checkpoint)));
        }
        advance(true);
      } catch (error) {
        advance(false);
        if (p.onError) p.onError(error instanceof Error ? error : new Error(String(error)));
        else throw error;
      }
    });
  }
  const controller = useRef<RenderSessionController>({
    get resumed() { return !!latest.current.session?.checkpoint; },
    continuation(actionIndex) {
      const cursor = latest.current.session?.checkpoint?.cursor;
      return cursor?.actionIndex === actionIndex ? cursor.continuation : null;
    },
    async restore() {
      const p = latest.current;
      if (!p.session?.checkpoint) return;
      validateCheckpoint(p.session.checkpoint, p.session.fingerprint, p.seed, p.lesson);
      if (p.session.checkpoint.cursor.actionIndex >= p.totalActions) throw new Error('Checkpoint points beyond the project');
      await restoreMonaco(p.state, p.session.checkpoint);
    },
    stepBoundary(actionIndex: number, continuation: PlaybackContinuation) {
      return new Promise(resolve => boundary({ actionIndex, timestampMs: performance.now(), continuation }, resolve));
    },
    finishBoundary(nextActionIndex: number, advance: () => void) {
      boundary({ actionIndex: nextActionIndex, timestampMs: performance.now(), continuation: null }, keepPlaying => {
        if (keepPlaying) advance();
      });
    },
  }).current;
  useEffect(() => { if (params.session) params.onRenderSessionReady?.(controller); }, [params.session, params.onRenderSessionReady, controller]);
  return controller;
}
