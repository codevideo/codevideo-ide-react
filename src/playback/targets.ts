import type * as monaco from 'monaco-editor';
import type { PlaybackTarget } from './types.js';

export function monacoTarget(editor: monaco.editor.IStandaloneCodeEditor): PlaybackTarget {
  return {
    allowsTypos: () => !!editor.getSelection()?.isEmpty(),
    insert(text, correction) {
      const model = editor.getModel();
      const selection = editor.getSelection();
      if (!model) throw new Error('Typing requires an active Monaco model');
      const range = selection ?? { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
      const start = model.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn });
      editor.executeEdits('simulateTyping', [{ range, text, forceMoveMarkers: true }]);
      // Match the existing helper: reveal the pre-insertion selection end.
      if (selection) editor.revealPositionInCenter({ lineNumber: selection.endLineNumber, column: selection.endColumn });
      editor.focus();
      return correction ? { kind: 'editor', uri: model.uri.toString(), start, text } : null;
    },
    deleteExact(target) {
      const model = editor.getModel();
      if (target.kind !== 'editor' || model?.uri.toString() !== target.uri) throw new Error('Correction model changed');
      const start = model.getPositionAt(target.start), end = model.getPositionAt(target.start + target.text.length);
      const range = { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column };
      if (model.getValueInRange(range) !== target.text) throw new Error('Correction text changed');
      editor.executeEdits('correctTyping', [{ range, text: '', forceMoveMarkers: true }]);
      editor.setPosition(start);
    },
  };
}

export function textTarget(getValue: () => string, setValue: (update: (previous: string) => string) => void): PlaybackTarget {
  // Local mirror prevents React batching from moving an insertion's recorded range.
  let value = getValue();
  return {
    allowsTypos: () => true,
    insert(text, correction) {
      const start = value.length;
      value += text;
      setValue(previous => previous + text);
      return correction ? { kind: 'text', start, text } : null;
    },
    deleteExact(target) {
      if (target.kind !== 'text' || value.slice(target.start, target.start + target.text.length) !== target.text) throw new Error('Correction text changed');
      value = value.slice(0, target.start) + value.slice(target.start + target.text.length);
      const next = value;
      setValue(() => next);
    },
  };
}
