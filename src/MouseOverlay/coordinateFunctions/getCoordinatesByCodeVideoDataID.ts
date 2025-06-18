import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates.js";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";

// Box-Muller transform for generating normally distributed random numbers
const generateGaussian = (mean: number, stdDev: number): number => {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
};

export const getGaussianCoordinatesByCodeVideoDataID = (
    dataId: string, 
    containerRef: React.RefObject<HTMLDivElement | null>,
    options = { 
        randomize: true,
        stdDevPercent: 0.15 // Standard deviation as percentage of element dimensions
    }
): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    
    const element = document.querySelector(`[data-codevideo-id="${dataId}"]`);
    if (!element) {
        console.warn('Element with data-codevideo-id not found', dataId);
        return DEFAULT_MOUSE_POSITION;
    }
    
    const rect = element.getBoundingClientRect();
    
    // Calculate center point
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // If randomization is disabled, just return the center point
    if (!options.randomize) {
        console.log(`Exact center of element found at: ${centerX}, ${centerY}`);
        return convertToContainerCoordinates({ x: centerX, y: centerY }, containerRef);
    }
    
    // Calculate standard deviations based on element dimensions
    const stdDevX = rect.width * options.stdDevPercent;
    const stdDevY = rect.height * options.stdDevPercent;
    
    // Define safe boundaries (with padding) to ensure we're 100% within the element
    const padding = Math.min(5, rect.width * 0.1, rect.height * 0.1);
    const minX = rect.left + padding;
    const maxX = rect.right - padding;
    const minY = rect.top + padding;
    const maxY = rect.bottom - padding;
    
    // Generate and clamp coordinates until we have a valid point
    let x, y;
    
    // Generate random point using Gaussian distribution
    x = generateGaussian(centerX, stdDevX);
    y = generateGaussian(centerY, stdDevY);
    
    // Clamp coordinates to GUARANTEE they stay within the element boundaries
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));
    
    console.log(`Random point within element: ${x}, ${y}`);
    
    return convertToContainerCoordinates({ x, y }, containerRef);
};