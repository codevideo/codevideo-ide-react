import { Project, IAction, IPoint, isRepeatableAction } from "@fullstackcraftllc/codevideo-types";
import { KEYBOARD_TYPING_PAUSE_MS, STANDARD_PAUSE_MS, LONG_PAUSE_MS } from "src/constants/CodeVideoIDEConstants";
import { getNewMousePosition } from "src/MouseOverlay/utils/getNewMousePosition";
import { reconstituteAllPartsOfState } from "./reconstituteAllPartsOfState";
import { sleep } from "./sleep";
import { speakText } from "./speakText";
import { simulateHumanTypingWithReactSetterCallback } from "./simulateHumanTypingWithReactSetterCallback";
import { simulateHumanTypingInMonaco } from "./simulateHumanTypingInMonaco";
import * as monaco from 'monaco-editor';

export const executeActionPlaybackForMonacoInstance = async (
  editor: monaco.editor.IStandaloneCodeEditor,
  project: Project,
  currentActionIndex: number,
  currentLessonIndex: number | null,
  action: IAction,
  isSoundOn: boolean,
  setEditors: (value: any) => void,
  setCurrentEditor: (value: any) => void,
  setCurrentFileName: (value: any) => void,
  setCurrentCode: (value: any) => void,
  setCurrentCaretPosition: (value: any) => void,
  setTerminalBuffer: (value: any) => void,
  mousePosition: IPoint,
  containerRef: React.RefObject<HTMLDivElement | null>,
  setMousePosition: (value: any) => void,
  setCaptionText: (value: any) => void,
  speakActionAudios: Array<{ text: string, mp3Url: string }>,
  setNewFileInputValue: React.Dispatch<React.SetStateAction<string>>,
  setNewFolderInputValue: React.Dispatch<React.SetStateAction<string>>,
  setRenameFileInputValue: React.Dispatch<React.SetStateAction<string>>,
  setRenameFolderInputValue: React.Dispatch<React.SetStateAction<string>>,
  keyboardTypingPauseMs: number = KEYBOARD_TYPING_PAUSE_MS,
  standardPauseMs: number = STANDARD_PAUSE_MS,
  longPauseMs: number = LONG_PAUSE_MS,
) => {
  let startTime = -1;

  // helpful for debugging
  // editor.getSupportedActions().forEach((value) => {
  //   console.log(value);
  // });

  const { editors, currentEditor, currentFilename, currentCaretPosition, currentCode } = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex);


  // OPEN FILE ANIMATION, STATE NEEDS TO BE SET HERE BEFORE TYPING OR WE ALWAYS TYPE ONE CHARACTER TOO LATE
  switch (action.name) {
    case 'file-explorer-open-file':
      console.log("SET CURRENT FILE to ", action.value)
      setEditors(editors);
      setCurrentEditor(currentEditor);
      setCurrentFileName(currentFilename);
      setCurrentCode(currentCode);
      setCurrentCaretPosition(currentCaretPosition);
      
      // Immediately set Monaco editor content for replay mode to fix visibility issue
      const model = editor.getModel();
      if (model && model.getValue() !== currentCode) {
        model.setValue(currentCode);
      }
      break;
    // for this we actually only need to set when clicking on a file...
    case 'mouse-left-click':
      // if we are clicking on a file, we need to set the editor content to the current
      setCurrentCode(currentCode);
      
      // Also immediately set Monaco editor content for replay mode
      const clickModel = editor.getModel();
      if (clickModel && clickModel.getValue() !== currentCode) {
        clickModel.setValue(currentCode);
      }
      break;
  }

  // before continuing, wait a little bit so file explorer can update the DOM
  // TODO: how can we do this properly without needing a hardcode sleep?
  // NEED TO DO THIS OR WE GET COORDINATE FINDING ISSUES WITH THE MOUSE
  await sleep(standardPauseMs);

  // MOUSE MOVEMENT ANIMATIONS, PASS THROUGH AND CONTINUE BELOW
  const newPosition = getNewMousePosition(mousePosition, action, containerRef);
  
  // Safety check before setting mouse position
  if (newPosition && newPosition.x !== undefined && newPosition.y !== undefined && 
      !isNaN(newPosition.x) && !isNaN(newPosition.y)) {
    setMousePosition(newPosition);
  } else {
    console.warn('Invalid mouse position from getNewMousePosition, keeping current position:', newPosition);
  }

  // const highlightText = (
  //   editor: monaco.editor.IStandaloneCodeEditor,
  //   searchText: string
  // ) => {
  //   const model = editor.getModel();

  // findNextMatch BREAKS SSR
  // Find the position of the searchText in the model
  // @ts-ignore
  // const searchTextPosition = model.findNextMatch(
  //   searchText,
  //   // @ts-ignore
  //   new monaco.Position(1, 1)
  // );


  // this ALSO BREAKS SSR
  // const searchTextPosition: monaco.editor.FindMatch = {
  //   range: new monaco.Range(1, 1, 1, 1),
  // }

  // If searchText is found
  // if (searchTextPosition) {
  //   const line = searchTextPosition.range.startLineNumber;
  //   const column = searchTextPosition.range.startColumn;

  //   // Move the cursor to the beginning of the searchText
  //   editor.setPosition({ lineNumber: line, column });

  //   // Reveal the line in the center
  //   editor.revealLineInCenter(line);

  //   // Calculate the range of the searchText
  //   const searchTextLength = searchText.length;
  //   // @ts-ignore
  //   const range = new monaco.Range(
  //     line,
  //     column,
  //     line,
  //     column + searchTextLength
  //   );

  //   // Set the selection to highlight the searchText
  //   editor.setSelection(range);

  //   // Reveal the range in the center
  //   editor.revealRangeInCenter(range);
  // }
  // };

  // try to parse the 'times' value as an integer for repeatable actions, if it fails, default to 1
  // the "times" doesn't always apply to most actions, so we do that action just once
  const times = isRepeatableAction(action.name) ? parseInt(action.value) : 1;
  const pos = editor.getPosition();
  console.log(`Editor position is at line ${pos?.lineNumber}, column ${pos?.column}`);
  // const lineNumber = pos?.lineNumber;
  for (let i = 0; i < times; i++) {
    // actual logic
    switch (true) {
      case action.name.startsWith("external-"):
      case action.name.startsWith("slides-"):
        // no op - but do a long pause
        // await sleep(longPauseMs);
        break;
      // AUTHOR ACTIONS
      case action.name === "author-speak-before":
      case action.name === "author-speak-during":
      case action.name === "author-speak-after":
        setCaptionText(action.value);
        // try to find a matching mp3 url by matching the text of it to action.value in the speakActionAudios array
        const mp3Url = speakActionAudios.find((audio) => audio.text === action.value)?.mp3Url;

        // Handle different types of author actions
        if (action.name === "author-speak-during") {
          // Fire and forget - don't await
          speakText(action.value, isSoundOn ? 1 : 0, mp3Url);
        } else {
          // Default behavior for author-speak-before and other author actions - await completion
          await speakText(action.value, isSoundOn ? 1 : 0, mp3Url);
        }
        break;
      case action.name === "author-wait":
        // Wait for the specified duration
        const waitDuration = parseInt(action.value) || 1000; // Default to 1000ms if parsing fails
        console.log(`Waiting for ${waitDuration}ms`);
        await sleep(waitDuration);
        break;
      // BEGIN FILE EXPLORER TYPING ACTIONS
      case action.name === "file-explorer-type-new-file-input":
        simulateHumanTypingWithReactSetterCallback(setNewFileInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-new-file-input":
        setNewFileInputValue("")
        break;
      case action.name === "file-explorer-type-new-folder-input":
        simulateHumanTypingWithReactSetterCallback(setNewFolderInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-new-folder-input":
        setNewFolderInputValue("")
        break;
      case action.name === "file-explorer-type-rename-file-input":
        simulateHumanTypingWithReactSetterCallback(setRenameFileInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-rename-file-input":
        setRenameFileInputValue("")
        break;
      case action.name === "file-explorer-type-rename-folder-input":
        simulateHumanTypingWithReactSetterCallback(setRenameFolderInputValue, action.value, keyboardTypingPauseMs)
        break;
      case action.name === "file-explorer-enter-rename-folder-input":
        setRenameFolderInputValue("")
        break;
      // BEGIN TERMINAL ACTIONS
      case action.name === 'terminal-type':
        const terminalOutput = action.value;
        const terminalLines = terminalOutput.split('\n');
        const latestLine = terminalLines[terminalLines.length - 1];
        if (latestLine) {
          // loop at character level to simulate typing
          for (let i = 0; i < latestLine.length; i++) {
            setTerminalBuffer((prev: string) => prev + latestLine[i]);
            await sleep(keyboardTypingPauseMs)
          }
        }
        break;
      // BEGIN EDITOR ACTIONS
      case action.name === "editor-arrow-down" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber + 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-up" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber - 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-tab" && pos !== null:
        // @ts-ignore
        pos.lineNumber = pos.lineNumber + 2;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-left" && pos !== null:
        // @ts-ignore
        pos.column = pos.column - 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-arrow-right" && pos !== null:
        // @ts-ignore
        pos.column = pos.column + 1;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-enter":
        await simulateHumanTypingInMonaco(editor, "\n", keyboardTypingPauseMs);
        break;
      // case action.name === "editor-delete-line" && lineNumber !== null:
      //   console.log("deleting line");
      //   // @ts-ignore - this also breaks SSR
      //   editor.executeEdits("", [
      //     // @ts-ignore
      //     { range: new monaco.Range(lineNumber, 1, lineNumber + 1, 1), text: null },
      //   ]);
      //   await sleep(keyboardTypingPauseMs)
      //   break;
      case action.name === "editor-command-right" && pos !== null:
        // simulate moving to the end of the current line
        // @ts-ignore
        pos.column = 100000;
        editor.setPosition(pos);
        await sleep(keyboardTypingPauseMs)
        break;
      //   // highlight breaks SSR
      // // case action.name === "editor-highlight-code":
      // //   highlightText(editor, action.value);
      // //   break;
      case action.name === "editor-space":
        await simulateHumanTypingInMonaco(editor, " ", keyboardTypingPauseMs);
        break;
      case action.name === "editor-backspace":
        // @ts-ignore - this also breaks SSR
        // typeof window !== "undefined" && editor.trigger(1, "deleteLeft");
        // for number of times, we need to delete the left character
        // if the action.value is a number, we delete that many characters
        const deleteCount = parseInt(action.value) || 1; // Default to 1 character
        for (let j = 0; j < deleteCount; j++) {
          // @ts-ignore - test to see if this works
          editor.trigger(1, "deleteLeft");
        }
        await sleep(keyboardTypingPauseMs)
        break;
      case action.name === "editor-type":
        await simulateHumanTypingInMonaco(editor, action.value, keyboardTypingPauseMs);
        break;
      // EDITOR SCROLL ACTIONS
      case action.name === "editor-scroll-up":
        const scrollUpDistance = parseInt(action.value) || 3; // Default to 3 lines
        // Smooth scroll animation for replay mode
        const currentLine = editor.getPosition()?.lineNumber || 1;
        const targetLine = Math.max(1, currentLine - scrollUpDistance);

        // Use Monaco's smooth reveal animation
        editor.revealLineInCenterIfOutsideViewport(targetLine);
        await sleep(standardPauseMs); // Small delay for animation
        break;
      case action.name === "editor-scroll-down":
        const scrollDownDistance = parseInt(action.value) || 3; // Default to 3 lines
        // Smooth scroll animation for replay mode
        const currentLineDown = editor.getPosition()?.lineNumber || 1;
        const targetLineDown = currentLineDown + scrollDownDistance;

        // Use Monaco's smooth reveal animation
        editor.revealLineInCenterIfOutsideViewport(targetLineDown);
        await sleep(standardPauseMs); // Small delay for animation
        break;
      case action.name.startsWith("mouse-move-"):
        // do the standard delay for mouse movement - padded with 300ms so it allows time for the animation to complete
        await sleep(standardPauseMs + 300);
        break;
      default:
        // no op - but still do default delay
        // await sleep(standardPauseMs);
        console.warn("Unable to apply action", JSON.stringify(action));
        break;
    }
  }
  return startTime;
};
