import { KEYBOARD_TYPING_PAUSE_MS } from "src/constants/CodeVideoIDEConstants";
import { sleep } from "./sleep";

export const simulateHumanTypingWithReactSetterCallback = async (
  setter: React.Dispatch<React.SetStateAction<string>>,
  text: string,
  typingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS
) => {
  const characters = text.split("");
  for (var i = 0; i < characters.length; i++) {
    setter((prev: string) => prev + characters[i]);
    await sleep(typingPauseMs);
  }
}