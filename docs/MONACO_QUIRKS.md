# Monaco Quirks & Disabled Features

A graveyard with provenance. Each entry below was commented-out code living in
the source for months/years because enabling it caused crashes, freezes, or SSR
breakage - mostly in or around Monaco. The code was removed from the source
during the 2026-06 refactor (branch `feature/refactor-component-and-fix-streaming`)
and preserved here so the institutional knowledge survives. If you try to
re-enable any of these, test replay AND step mode in a real browser, and test
an SSR build (Gatsby/Next) before trusting it.

Related living warnings (still in source, not graveyarded):

- `src/hooks/useMonacoModelManagement.ts` - the `setTimeout(0)` / `setTimeout(10)`
  constructions encode discovered fixes for Monaco update races (caret set
  before content applied; view-state restore fighting the caret effect). The
  hook's doc comment marks them. Do not "modernize".
- `src/hooks/useReplayPlayback.ts` - the claim-on-fire pending-timer guard for
  index 0 must not be simplified to claim-before-schedule (StrictMode deadlock;
  see hook doc comment).
- `src/utils/executeActionPlaybackForMonacoInstance.ts` - the
  `await sleep(standardPauseMs)` before mouse-coordinate math is required or
  the file explorer DOM isn't ready and coordinate lookups fail.

---

## 1. Code highlighting (`editor-highlight-code`) - breaks SSR

**Lived in:** `CodeVideoIDE.tsx` (highlight effect, dormant) and
`executeActionPlaybackForMonacoInstance.ts` (the `highlightText` helper and its
action case).

**Why disabled:** `model.findNextMatch(...)` breaks SSR builds, and even
constructing `new monaco.Range(...)` at module scope broke SSR ("this ALSO
BREAKS SSR"). The `createDecorationsCollection` path in the effect breaks SSR
too. Highlighting needs an implementation that never touches monaco namespace
objects during server rendering - possibly a hand-rolled overlay
("maybe we can hack our own highlight functionality...").

```ts
// from CodeVideoIDE.tsx (effect, was already fully commented):
// TODO: figure out highlights! (breaks due to SSR)
// const currentHighlightCoordinates = currentFile ? currentFile.highlightCoordinates : null;
// useEffect(() => {
//   // if (typeof window !== "undefined" && !isRecording && monacoEditorRef.current && currentHighlightCoordinates) {
//   // TODO: this line breaks SSR:
//   //   monacoEditorRef.current.createDecorationsCollection([
//   //     {
//   //       range: new monaco.Range(
//   //         currentHighlightCoordinates.start.row,
//   //         currentHighlightCoordinates.start.col,
//   //         currentHighlightCoordinates.end.row,
//   //         currentHighlightCoordinates.end.col
//   //       ),
//   //       options: { inlineClassName: 'highlighted-code' }
//   //     }
//   //   ]);
//   //   // trigger a focus to actually highlight where the highlight is
//   //   // monacoEditorRef.current.focus();
//   // }
// }, [currentHighlightCoordinates]);
```

```ts
// from executeActionPlaybackForMonacoInstance.ts (helper, was already fully commented):
// const highlightText = (
//   editor: monaco.editor.IStandaloneCodeEditor,
//   searchText: string
// ) => {
//   const model = editor.getModel();
//   // findNextMatch BREAKS SSR
//   // @ts-ignore
//   // const searchTextPosition = model.findNextMatch(
//   //   searchText,
//   //   // @ts-ignore
//   //   new monaco.Position(1, 1)
//   // );
//   // this ALSO BREAKS SSR
//   // const searchTextPosition: monaco.editor.FindMatch = {
//   //   range: new monaco.Range(1, 1, 1, 1),
//   // }
//   // If searchText is found
//   // if (searchTextPosition) {
//   //   const line = searchTextPosition.range.startLineNumber;
//   //   const column = searchTextPosition.range.startColumn;
//   //   editor.setPosition({ lineNumber: line, column });
//   //   editor.revealLineInCenter(line);
//   //   const searchTextLength = searchText.length;
//   //   // @ts-ignore
//   //   const range = new monaco.Range(line, column, line, column + searchTextLength);
//   //   editor.setSelection(range);
//   //   editor.revealRangeInCenter(range);
//   // }
// };
//
// ...and its action case:
//   // highlight breaks SSR
// // case action.name === "editor-highlight-code":
// //   highlightText(editor, action.value);
// //   break;
```

## 2. `editor-delete-line` - `monaco.Range` breaks SSR

**Lived in:** `executeActionPlaybackForMonacoInstance.ts` action switch.

```ts
// case action.name === "editor-delete-line" && lineNumber !== null:
//   console.log("deleting line");
//   // @ts-ignore - this also breaks SSR
//   editor.executeEdits("", [
//     // @ts-ignore
//     { range: new monaco.Range(lineNumber, 1, lineNumber + 1, 1), text: null },
//   ]);
//   await sleep(keyboardTypingPauseMs)
//   break;
```

Note: `editor-backspace` works around the same problem by using
`editor.trigger(1, "deleteLeft")` in a loop instead of an edit with a Range.

## 3. Monokai / multiple theme support

**Lived in:** top of `CodeVideoIDE.tsx` (import) and `handleEditorDidMount`
(now in `useMonacoModelManagement.ts`).

**Why disabled:** "TODO: add multiple theme support later" - theme definition
was attempted at mount with a delayed `setTheme`; only vs / vs-dark are used
today via the `theme` prop.

```ts
// import Monokai from "monaco-themes/themes/Monokai.json";
//
// in handleEditorDidMount:
// // Ensure theme is applied after a short delay
// monaco.editor.defineTheme(
//   "Monokai",
//   Monokai as monaco.editor.IStandaloneThemeData
// );
// setTimeout(() => {
//   monaco.editor.setTheme('Monokai');
// }, 1);
```

## 4. Auto-scroll caret row to center ("Gemini says this is not needed")

**Lived in:** `CodeVideoIDE.tsx` effects (then `useMonacoModelManagement.ts`).

**Why disabled:** redundant with the reveal calls inside the caret effects;
left as a breadcrumb in case scroll-follow regressions appear.

```ts
// always auto-scroll to line in center when the caret row position changes
// useEffect(() => {
//   if (monacoEditorRef.current) {
//     monacoEditorRef.current.revealLineInCenter(currentCaretPosition.row);
//   }
// }, [currentCaretPosition.row]);
```

## 5. Model URI cleanup / mode-transition refs (never implemented)

**Lived in:** `CodeVideoIDE.tsx` ("for cleanup TODO"). Monaco models created
per-file URI are never disposed; a long session that opens many files leaks
models. The refs sketched for a fix:

```ts
// const modelUrisRef = useRef<Set<string>>(new Set());
// const prevMode = useRef<GUIMode>(mode);
// const isInitialMount = useRef(true);
```

## 6. `editor.getSupportedActions()` debugging aid

**Lived in:** `executeActionPlaybackForMonacoInstance.ts` entry.

```ts
// helpful for debugging
// editor.getSupportedActions().forEach((value) => {
//   console.log(value);
// });
```

## 7. KNOWN BUG: repeatable actions animate once instead of N times

**Lives in:** `executeActionPlaybackForMonacoInstance.ts` (`const times = ...`).

`isRepeatableAction(action.name)` passes a string where codevideo-types'
`isRepeatableAction(action: IAction)` expects the full action; the
implementation reads `.name` off its argument, so a string argument yields
`undefined` and the check is always false - `times` is always 1. Repeatable
actions like `editor-arrow-down: "3"` therefore animate ONCE in replay; the
final state still snaps correct because `updateState`'s VirtualIDE
reconstitution applies repeats properly.

The type error was masked for ages by a stray `// @ts-ignore` inside the
since-removed `highlightText` comment block (it suppressed the next *code*
line, far below it). Discovered 2026-06 while graveyarding that block.

**Deliberately NOT fixed during the refactor** (fixing changes replay
behavior). The fix, when wanted, is `isRepeatableAction(action)` plus a visual
re-test of repeatable actions in replay mode.
