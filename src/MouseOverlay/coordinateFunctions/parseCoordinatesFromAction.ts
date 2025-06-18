import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates.js";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";

export const parseCoordinatesFromMouseCoordinateAction = (value: string, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    // try to get two parts
    const parts = value.split(',')
    if (parts.length == 2) {
        return convertToContainerCoordinates({
            x: parts[0] ? parseInt(parts[0]) : 0,
            y: parts[1] ? parseInt(parts[1]) : 0
        }, containerRef);
    }
    return {
        x: 0,
        y: 0,
    }
}