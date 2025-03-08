import { IPoint } from "@fullstackcraftllc/codevideo-types";

export const convertToContainerCoordinates = (point: IPoint, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return { x: 0, y: 0 };
    if (!containerRef?.current) return point;

    const containerRect = containerRef.current.getBoundingClientRect();

    return {
        x: point.x - containerRect.left,
        y: point.y - containerRect.top
    };
};