import { IPoint } from "@fullstackcraftllc/codevideo-types";

// Function to calculate a point on a cubic Bezier curve
export const calculateCubicBezierPoint = (
    t: number,
    p0: IPoint,
    p1: IPoint,
    p2: IPoint,
    p3: IPoint
): IPoint => {
    // Safety checks for invalid points
    const points = [p0, p1, p2, p3];
    for (const point of points) {
        if (!point || point.x === undefined || point.y === undefined || 
            isNaN(point.x) || isNaN(point.y)) {
            console.warn('Invalid point provided to calculateCubicBezierPoint:', { p0, p1, p2, p3 });
            return { x: 0, y: 0 };
        }
    }

    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

    return { x, y };
};