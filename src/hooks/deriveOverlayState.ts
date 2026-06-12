import { IAction } from '@fullstackcraftllc/codevideo-types';

/**
 * What the overlay layer should do for the current action:
 *  - 'slide' / 'web-preview' / 'external-browser': show that overlay
 *  - 'keep': author action while stepping forward - keep whatever overlay is
 *    currently displayed (continuation behavior)
 *  - 'hide': hide all overlays
 */
export type OverlayPatch =
  | { type: 'slide'; slideMarkdown: string }
  | { type: 'web-preview' }
  | { type: 'external-browser'; url: string }
  | { type: 'keep' }
  | { type: 'hide' };

/**
 * Pure routing core of useOverlayDisplay: maps the current action (and the
 * step direction) to an overlay instruction. Extracted so the routing table
 * is unit-testable without rendering.
 */
export const deriveOverlayState = (
  currentAction: IAction | null,
  isSteppingForward: boolean
): OverlayPatch => {
  if (!currentAction) {
    // No action at this index, hide everything
    return { type: 'hide' };
  }
  if (currentAction.name === 'slide-display') {
    // When current action is a slide-display, always show it
    return { type: 'slide', slideMarkdown: currentAction.value };
  }
  if (currentAction.name === 'external-web-preview') {
    // When current action is external-web-preview, always show it
    return { type: 'web-preview' };
  }
  if (currentAction.name === 'external-browser' || currentAction.name === 'external-browser-scroll') {
    // When current action is external-browser, always show it
    return { type: 'external-browser', url: currentAction.value };
  }
  if (currentAction.name.startsWith('author-')) {
    // For author actions, maintain overlay state when stepping forward but
    // hide when stepping backward
    return isSteppingForward ? { type: 'keep' } : { type: 'hide' };
  }
  // For any other action, always hide slides and web previews
  return { type: 'hide' };
};
