import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates";
import { DEFAULT_MOUSE_POSITION } from "src/constants/CodeVideoIDEConstants";

export const getCoordinatesOfTerminalInput = (containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    const terminal = document.querySelector('[data-codevideo-id="terminal"]');
    if (!terminal) return DEFAULT_MOUSE_POSITION;
    // console.log('terminal element', terminal);
    const rect = terminal.getBoundingClientRect();
    return convertToContainerCoordinates({
      x: rect.left + 20, // Add padding for prompt
      y: rect.top + 20   // Position near top of terminal
    }, containerRef);
  };