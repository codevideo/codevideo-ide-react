import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { DEFAULT_MOUSE_POSITION } from "src/constants/CodeVideoIDEConstants";

export const convertToContainerCoordinates = (point: IPoint, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    if (!containerRef?.current) return point;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = point.x - containerRect.left;
    const y = point.y - containerRect.top;
    console.log(`Converted coordinates: ${x}, ${y}`);

    return {
        x: point.x - containerRect.left,
        y: point.y - containerRect.top
    };
};