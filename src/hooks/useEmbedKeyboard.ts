import { useEffect, useState } from 'react';
import { GUIMode } from '@fullstackcraftllc/codevideo-types';

export interface UseEmbedKeyboardParams {
  isEmbedMode?: boolean;
  requestStepModeCallback?: (mode: GUIMode) => void;
  requestNextActionCallback?: () => void;
  requestPreviousActionCallback?: () => void;
  requestPlaybackStartCallback?: () => void;
}

/**
 * Embed-mode keyboard controls and the embed start overlay's visibility:
 * ArrowRight / ArrowLeft request step mode plus next/previous action, space
 * requests playback start; any of them dismisses the overlay.
 *
 * NOTE: the callbacks are deliberately not dependencies (long-standing quirk
 * of the original effect, preserved verbatim) - the listener binds the
 * callbacks present when isEmbedMode last changed.
 */
export const useEmbedKeyboard = (params: UseEmbedKeyboardParams): boolean => {
  const {
    isEmbedMode,
    requestStepModeCallback,
    requestNextActionCallback,
    requestPreviousActionCallback,
    requestPlaybackStartCallback,
  } = params;

  const [showEmbedOverlay, setShowEmbedOverlay] = useState<boolean>(isEmbedMode || false);

  useEffect(() => {
    if (isEmbedMode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          setShowEmbedOverlay(false);
          requestStepModeCallback && requestStepModeCallback('step');
          requestNextActionCallback && requestNextActionCallback();
        } else if (e.key === 'ArrowLeft') {
          setShowEmbedOverlay(false);
          requestStepModeCallback && requestStepModeCallback('step');
          requestPreviousActionCallback && requestPreviousActionCallback();
        } else if (e.key === ' ') {
          setShowEmbedOverlay(false);
          requestPlaybackStartCallback && requestPlaybackStartCallback();
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isEmbedMode]);

  return showEmbedOverlay;
};
