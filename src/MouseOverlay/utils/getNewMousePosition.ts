import { IAction, IPoint } from "@fullstackcraftllc/codevideo-types";
import { getCoordinatesOfEditor } from "../coordinateFunctions/getCoordinatesOfEditor.js";
import { getCoordinatesOfFileOrFolder } from "../coordinateFunctions/getCoordinatesOfFileOrFolder.js";
import { getCoordinatesOfTerminalInput } from "../coordinateFunctions/getCoordinatesOfTerminalInput.js";
import { parseCoordinatesFromMouseCoordinateAction } from "../coordinateFunctions/parseCoordinatesFromAction.js";
import { getGaussianCoordinatesByCodeVideoDataID } from "../coordinateFunctions/getCoordinatesByCodeVideoDataID.js";
import { FILE_EXPLORER_ID } from "src/constants/CodeVideoDataIds.js";

export const getNewMousePosition = (targetMousePosition: IPoint, currentAction: IAction, containerRef: React.RefObject<HTMLDivElement | null>) => {
  let newPosition = { x: targetMousePosition.x, y: targetMousePosition.y };

  switch (currentAction.name) {
    // movement actions
    case 'mouse-move-file-explorer':
      newPosition = getGaussianCoordinatesByCodeVideoDataID(FILE_EXPLORER_ID, containerRef)
      break;
    case 'mouse-move-terminal':
      newPosition = getCoordinatesOfTerminalInput(containerRef)
      break;
    case 'mouse-move-editor':
      newPosition = getCoordinatesOfEditor(containerRef)
      break;
    case 'mouse-move-file-explorer-file':
    case 'mouse-move-file-explorer-folder':
      console.log('🚀 [getNewMousePosition] Handling file/folder movement:', JSON.stringify({
        actionName: currentAction.name,
        actionValue: currentAction.value
      }));
      newPosition = getCoordinatesOfFileOrFolder(currentAction.value, containerRef)
      console.log('🚀 [getNewMousePosition] Result position:', JSON.stringify(newPosition));
      break;
    case 'mouse-move-to-coordinates-pixels':
      newPosition = parseCoordinatesFromMouseCoordinateAction(currentAction.value, containerRef)
      break;
    case 'mouse-move-to-coordinates-percent':
      const percentages = parseCoordinatesFromMouseCoordinateAction(currentAction.value, containerRef)
      // convert x and y percentage to pixels
      const rect = containerRef?.current?.getBoundingClientRect();
      if (rect) {
        newPosition = {
          x: rect.width * percentages.x,
          y: rect?.height * percentages.y
        }
      }
      break;
    // file explorer context menu movements
    case 'mouse-move-file-explorer-context-menu-new-file':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-context-menu-new-file", containerRef)
      break;
    case 'mouse-move-file-explorer-context-menu-new-folder':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-context-menu-new-folder", containerRef)
      break;
    // file context menu movements
    case 'mouse-move-file-explorer-file-context-menu-rename':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-file-context-menu-rename", containerRef)
      break;
    case 'mouse-move-file-explorer-file-context-menu-delete':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-file-context-menu-delete", containerRef)
      break;
    // folder context menu movements
    case 'mouse-move-file-explorer-folder-context-menu-new-file':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-folder-context-menu-new-file", containerRef)
      break;
    case 'mouse-move-file-explorer-folder-context-menu-new-folder':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-folder-context-menu-new-folder", containerRef)
      break;
    case 'mouse-move-file-explorer-folder-context-menu-rename':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-folder-context-menu-rename", containerRef)
      break;
    case 'mouse-move-file-explorer-folder-context-menu-delete':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("file-explorer-folder-context-menu-delete", containerRef)
      break;
    // editor tab movements
    case 'mouse-move-editor-tab':
      newPosition = getGaussianCoordinatesByCodeVideoDataID(`editor-tab-${currentAction.value}`, containerRef)
      break;
    case 'mouse-move-editor-tab-close':
      newPosition = getGaussianCoordinatesByCodeVideoDataID(`editor-tab-close-${currentAction.value}`, containerRef)
      break;
    // unsaved changes dialog movements
    case 'mouse-move-unsaved-changes-dialog-button-save':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("unsaved-changes-dialog-button-save", containerRef)
      break;
    case 'mouse-move-unsaved-changes-dialog-button-dont-save':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("unsaved-changes-dialog-button-dont-save", containerRef)
      break;
    case 'mouse-move-unsaved-changes-dialog-button-cancel':
      newPosition = getGaussianCoordinatesByCodeVideoDataID("unsaved-changes-dialog-button-cancel", containerRef)
      break;
    // Note: All GUI related click actions should be derived directly from the virtual layer!!!!
  }

  // Safety check to ensure we never return undefined or NaN coordinates
  if (!newPosition) {
    console.warn('New position is undefined, falling back to target position:', JSON.stringify(targetMousePosition));
    return { x: targetMousePosition.x, y: targetMousePosition.y };
  }
  if (!newPosition.x) {
    console.warn('New position x is undefined, falling back to target position:', JSON.stringify(targetMousePosition));
    return { x: targetMousePosition.x, y: targetMousePosition.y };
  }

  if (!newPosition.y) {
    console.warn('New position y is undefined, falling back to target position:', JSON.stringify(targetMousePosition));
    return { x: targetMousePosition.x, y: targetMousePosition.y };
  }

  return newPosition;
}