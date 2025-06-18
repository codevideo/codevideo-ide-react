import { IPoint } from "@fullstackcraftllc/codevideo-types";

// Function to generate random control points for multi-bend curves
export const generateControlPoints = (
    start: IPoint,
    end: IPoint,
    numberOfCurves: number,
    arcHeight: number
): IPoint[] => {
    const points: IPoint[] = [];
    const baseDistance = Math.hypot(end.x - start.x, end.y - start.y);

    // Always include start and end points
    points.push(start);

    // Limit numberOfCurves to 1-3 range
    const curveCount = Math.max(1, Math.min(3, numberOfCurves));

    if (curveCount === 1) {
        // Simple single curve - one control point above the midpoint
        const controlPoint: IPoint = {
            x: (start.x + end.x) / 2,
            y: Math.min(start.y, end.y) - baseDistance * arcHeight
        };
        points.push(controlPoint, controlPoint); // Duplicate for cubic bezier format
    } else {
        // Multiple bends - create intermediate control points
        const segment = 1 / (curveCount + 1);

        for (let i = 1; i <= curveCount; i++) {
            const progress = i * segment;

            // Create a zig-zag pattern by alternating control point direction
            const direction = i % 2 === 1 ? -1 : 1;
            const perpFactor = Math.random() * 0.5 + 0.5; // Random factor between 0.5 and 1.0

            // Linear interpolation for base position
            const baseX = start.x + (end.x - start.x) * progress;
            const baseY = start.y + (end.y - start.y) * progress;

            // Apply perpendicular offset to create bends
            // This creates the control points perpendicular to the path
            const dx = -(end.y - start.y);
            const dy = end.x - start.x;
            const len = Math.hypot(dx, dy);

            // Prevent division by zero when start and end points are the same
            const controlPoint: IPoint = len > 0 ? {
                x: baseX + (dx / len) * baseDistance * arcHeight * direction * perpFactor,
                y: baseY + (dy / len) * baseDistance * arcHeight * direction * perpFactor
            } : {
                x: baseX,
                y: baseY
            };

            points.push(controlPoint);
        }
    }

    points.push(end);
    return points;
};