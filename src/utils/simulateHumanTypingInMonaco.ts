import { KEYBOARD_TYPING_PAUSE_MS } from "src/constants/CodeVideoIDEConstants";
import * as monaco from 'monaco-editor';

// define the human typing here in the puppeteer environment
export const simulateHumanTypingInMonaco = (
  editor: monaco.editor.IStandaloneCodeEditor,
  charactersToType: string,
  typingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS
) => {
  return new Promise<void>((resolve) => {
    const characters: string[] = charactersToType.split("");
    let index: number = 0;

    function typeNextCharacter(): void {
      if (index < characters.length) {
        const char = characters[index];
        const selection = editor.getSelection();
        editor.executeEdits("simulateTyping", [
          {
            range: {
              startLineNumber: selection?.selectionStartLineNumber || 1,
              startColumn: selection?.selectionStartColumn || 1,
              endLineNumber: selection?.endLineNumber || 1,
              endColumn: selection?.endColumn || 1,
            },
            text: char || "",
            forceMoveMarkers: true,
          },
        ]);
        // editor.setPosition({
        //   lineNumber: selection?.endLineNumber || 1,
        //   column: selection?.endColumn || 1
        // });

        // this keeps the line we are currently typing in the center of the screen
        editor.revealPositionInCenter({
          lineNumber: selection?.endLineNumber || 1,
          column: selection?.endColumn || 1
        });

        // trigger a focus to actually highlight where the caret is
        editor.focus();
        index++;
        setTimeout(typeNextCharacter, typingPauseMs);
      } else {
        resolve();
      }
    }

    typeNextCharacter();
  });
};
