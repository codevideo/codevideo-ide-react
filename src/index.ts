// main component stuff
export { CODEVIDEO_IDE_ID } from './constants/CodeVideoIDEConstants.js';
export { CodeVideoIDE } from './CodeVideoIDE.jsx';
export type { CodeVideoIDEProps } from './CodeVideoIDE.jsx';

// streaming/append support (also usable directly by consumers)
export { useStableActions } from './hooks/useStableActions.js';
export type { UseStableActionsResult } from './hooks/useStableActions.js';
export { extractActions, getActionAtIndex } from './utils/extractActions.js';
export { setDebugLogging } from './utils/debugLog.js';

// data ids
export { FILE_EXPLORER_ID } from './constants/CodeVideoDataIds.js';
export { EDITOR_AREA_ID } from './constants/CodeVideoDataIds.js';
export { EDITOR_ID } from './constants/CodeVideoDataIds.js';
export { TERMINAL_ID } from './constants/CodeVideoDataIds.js';
export { SLIDE_ID } from './constants/CodeVideoDataIds.js';
export { EXTERNAL_WEB_VIEWER_ID } from './constants/CodeVideoDataIds.js';
