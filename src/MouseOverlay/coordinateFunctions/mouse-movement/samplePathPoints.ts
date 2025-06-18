import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { calculateCubicBezierPoint } from "./calculateCubicBezierPoint.js";

// Function to sample points along a complex path for animation
export const samplePathPoints = (
    controlPoints: IPoint[],
    numSamples: number
  ): IPoint[] => {
    const result: IPoint[] = [];
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / (numSamples - 1);
      
      if (controlPoints.length === 4) {
        // Cubic Bezier curve
        result.push(
          calculateCubicBezierPoint(
            t,
            controlPoints[0],
            controlPoints[1],
            controlPoints[2],
            controlPoints[3]
          )
        );
      } else if (controlPoints.length > 4) {
        // For more complex paths, use De Casteljau's algorithm
        // This is a simplification - for multiple bends we're treating 
        // the entire set of control points as a higher-order Bezier curve
        let tmp = [...controlPoints];
        let n = tmp.length;
        
        for (let j = 1; j < n; j++) {
          for (let k = 0; k < n - j; k++) {
            // Safety check to prevent NaN values from propagating
            const currentPoint = tmp[k];
            const nextPoint = tmp[k + 1];
            
            if (isNaN(currentPoint.x) || isNaN(currentPoint.y) || 
                isNaN(nextPoint.x) || isNaN(nextPoint.y)) {
              console.warn('NaN values detected in control points, skipping interpolation');
              continue;
            }
            
            tmp[k] = {
              x: (1 - t) * currentPoint.x + t * nextPoint.x,
              y: (1 - t) * currentPoint.y + t * nextPoint.y
            };
          }
        }
        
        result.push(tmp[0]);
      }
    }
    
    return result;
  };