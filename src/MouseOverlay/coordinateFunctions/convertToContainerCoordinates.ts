import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";

export const convertToContainerCoordinates = (point: IPoint, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    if (!containerRef?.current) return point;
    if (!point || point.x === undefined || point.y === undefined || isNaN(point.x) || isNaN(point.y)) {
        console.warn('Invalid point provided to convertToContainerCoordinates:', point);
        return DEFAULT_MOUSE_POSITION;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    console.log('🔧 [convertToContainerCoordinates] Container rect:', JSON.stringify({
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height
    }));
    console.log('🔧 [convertToContainerCoordinates] Input point:', JSON.stringify(point));
    
    const x = point.x - containerRect.left;
    const y = point.y - containerRect.top;

    console.log('🔧 [convertToContainerCoordinates] Converted coordinates:', JSON.stringify({ x, y }));

    return { x, y };
};