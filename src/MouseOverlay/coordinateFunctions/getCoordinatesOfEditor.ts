import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates";
import { DEFAULT_MOUSE_POSITION } from "src/constants/CodeVideoIDEConstants";

export const getCoordinatesOfEditor = (containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
  if (!containerRef) return DEFAULT_MOUSE_POSITION;
    const editor = document.querySelector('[data-codevideo-id="editor"]');
    if (!editor) return DEFAULT_MOUSE_POSITION;
    // console.log('editor element', editor);
    const rect = editor.getBoundingClientRect();
    return convertToContainerCoordinates({
      x: rect.left + 50,  // Position inside editor
      y: rect.top + 50    // Position inside editor
    }, containerRef);
  };