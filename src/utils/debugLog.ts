/**
 * Gated logging for CodeVideoIDE internals.
 *
 * The component historically logged extensively on every render and effect -
 * useful when debugging Monaco races, noisy for consumers. The `debug` prop on
 * CodeVideoIDE drives this module-level flag; everything routed through
 * debugLog/debugWarn is silent unless it is set.
 *
 * Module-level rather than per-instance: the IDE renders one instance per page
 * in every known consumer (studio, example app, CLI page, genie), and the
 * playback utils it gates are themselves module-level.
 */
let debugEnabled = false;

export const setDebugLogging = (enabled: boolean): void => {
  debugEnabled = enabled;
};

export const isDebugLoggingEnabled = (): boolean => debugEnabled;

export const debugLog = (...args: Array<unknown>): void => {
  if (debugEnabled) {
    console.log(...args);
  }
};

export const debugWarn = (...args: Array<unknown>): void => {
  if (debugEnabled) {
    console.warn(...args);
  }
};
