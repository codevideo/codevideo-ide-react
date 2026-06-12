import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";
import { debugLog, debugWarn } from '../../utils/debugLog.js';

export const convertToContainerCoordinates = (point: IPoint, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    if (!containerRef?.current) return point;
    if (!point || point.x === undefined || point.y === undefined || isNaN(point.x) || isNaN(point.y)) {
        debugWarn('Invalid point provided to convertToContainerCoordinates:', point);
        return DEFAULT_MOUSE_POSITION;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    debugLog('🔧 [convertToContainerCoordinates] Container rect:', JSON.stringify({
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height
    }));
    debugLog('🔧 [convertToContainerCoordinates] Input point:', JSON.stringify(point));
    
    const x = point.x - containerRect.left;
    const y = point.y - containerRect.top;

    debugLog('🔧 [convertToContainerCoordinates] Converted coordinates:', JSON.stringify({ x, y }));

    return { x, y };
};