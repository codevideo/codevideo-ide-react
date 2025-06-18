import React, { useEffect, useRef, useState } from 'react';
import { GUIMode, IPoint } from '@fullstackcraftllc/codevideo-types';
import { Box } from '@radix-ui/themes';
import { samplePathPoints } from './coordinateFunctions/mouse-movement/samplePathPoints.js';
import { generateControlPoints } from './coordinateFunctions/mouse-movement/generateControlPoints.js';

interface IMouseOverlayProps {
  mode: GUIMode;
  targetMousePosition: IPoint;
  maximumAnimationDuration: number;
  mouseVisible: boolean;
  mouseColor?: string;
  previousPosition?: IPoint;
  arcHeight?: number;
  numberOfCurves?: number;
  onAnimationFinished?: () => void;
  onCurrentPositionChange?: (position: IPoint) => void;
}

export const MouseOverlay = (props: IMouseOverlayProps) => {
  const {
    mode,
    mouseVisible,
    targetMousePosition,
    maximumAnimationDuration,
    mouseColor,
    arcHeight = 0.3,
    numberOfCurves = 1,
    onAnimationFinished,
    onCurrentPositionChange
  } = props;

  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Safe initialization with fallback to default position
  const safeTargetPosition = targetMousePosition && 
    targetMousePosition.x !== undefined && targetMousePosition.y !== undefined 
    ? targetMousePosition 
    : { x: 0, y: 0 };
    
  const [currentPosition, setCurrentPosition] = useState<IPoint>(safeTargetPosition);
  const [prevPosition, setPrevPosition] = useState<IPoint>(safeTargetPosition);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [pathPoints, setPathPoints] = useState<IPoint[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTargetPositionRef = useRef<IPoint>(safeTargetPosition);

  // Call the position change callback whenever currentPosition changes
  useEffect(() => {
    if (onCurrentPositionChange) {
      onCurrentPositionChange(currentPosition);
    }
  }, [currentPosition, onCurrentPositionChange]);

  useEffect(() => {
    // Safety check: ensure targetMousePosition is valid
    if (!targetMousePosition || targetMousePosition.x === undefined || targetMousePosition.y === undefined) {
      console.warn('Invalid targetMousePosition provided to MouseOverlay:', targetMousePosition);
      return;
    }

    // Skip if we're already animating to avoid double animations
    if (isAnimating) {
      return;
    }

    // Skip if target position hasn't changed
    if (targetMousePosition && lastTargetPositionRef.current &&
        targetMousePosition.x === lastTargetPositionRef.current.x &&
        targetMousePosition.y === lastTargetPositionRef.current.y) {
      return;
    }

    // Update the last target position ref
    lastTargetPositionRef.current = targetMousePosition;

    // Handle first render or non-replay mode with direct position update
    if (mode !== 'replay') {
      setCurrentPosition(targetMousePosition);
      setPrevPosition(targetMousePosition);
      return;
    }

    // Skip animation if positions are the same
    if (prevPosition && targetMousePosition && 
        prevPosition.x === targetMousePosition.x && prevPosition.y === targetMousePosition.y) {
      setCurrentPosition(targetMousePosition);
      setPrevPosition(targetMousePosition);
      return;
    }

    // Always use the current position as the starting point for animation
    // This ensures we start from where the mouse actually is
    const startPosition = currentPosition;

    // Safety check: ensure we have valid positions before generating control points
    if (!startPosition || !targetMousePosition || 
        startPosition.x === undefined || startPosition.y === undefined ||
        targetMousePosition.x === undefined || targetMousePosition.y === undefined) {
      console.warn('Invalid positions for animation, skipping:', { startPosition, targetMousePosition });
      return;
    }

    // Only animate in replay mode
    const curvesToUse = numberOfCurves === 1 ?
      Math.floor(Math.random() * 3) + 1 :
      numberOfCurves;

    // Generate control points for the path
    const controlPoints = generateControlPoints(
      startPosition,
      targetMousePosition,
      curvesToUse,
      arcHeight
    );

    // Store previous position before updating
    setPrevPosition(startPosition);

    // Pre-calculate points along the path for smoother animation
    // Safety check: ensure control points are valid
    if (!controlPoints || controlPoints.length === 0) {
      console.warn('No valid control points generated, skipping animation');
      return;
    }

    // Calculate distance-based animation parameters for consistent velocity
    const distance = Math.hypot(targetMousePosition.x - startPosition.x, targetMousePosition.y - startPosition.y);
    
    // Define consistent mouse velocity (pixels per second)
    const MOUSE_VELOCITY = 600; // pixels per second - adjust for desired speed
    const MIN_DURATION = 300;   // minimum animation time in ms
    const MAX_DURATION = maximumAnimationDuration; // respect the maximum limit
    
    // Calculate duration based on distance and velocity
    const calculatedDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, (distance / MOUSE_VELOCITY) * 1000));
    
    // Calculate dynamic point count based on duration for smooth animation
    // Target ~120 fps for optimal smoothness, but scale with duration
    const targetFps = 120;
    const dynamicPointCount = Math.max(30, Math.min(240, Math.floor((calculatedDuration / 1000) * targetFps)));

    const animationPoints = samplePathPoints(controlPoints, dynamicPointCount);

    // Safety check: ensure animation points are valid
    if (!animationPoints || animationPoints.length === 0) {
      console.warn('No valid animation points generated, skipping animation');
      return;
    }

    // Validate all animation points
    const validAnimationPoints = animationPoints.filter(point => 
      point && 
      typeof point.x === 'number' && !isNaN(point.x) && isFinite(point.x) &&
      typeof point.y === 'number' && !isNaN(point.y) && isFinite(point.y)
    );

    if (validAnimationPoints.length === 0) {
      console.warn('No valid animation points after filtering, skipping animation');
      return;
    }

    console.log(`🎬 Distance: ${distance.toFixed(1)}px, Duration: ${calculatedDuration}ms, Points: ${validAnimationPoints.length}, Velocity: ${(distance / (calculatedDuration / 1000)).toFixed(1)}px/s`);

    setPathPoints(validAnimationPoints);

    setIsAnimating(true);

    // Animate along the pre-calculated path
    let startTime: number | null = null;
    
    // Use calculated duration for consistent velocity
    const duration = calculatedDuration;

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Get the point at the current progress
      const frameIndex = Math.min(
        Math.floor(progress * (validAnimationPoints.length - 1)),
        validAnimationPoints.length - 1
      );

      const newPosition = validAnimationPoints[frameIndex]; // Use validAnimationPoints instead
      
      // Safety check: ensure the new position is valid
      if (!newPosition || newPosition.x === undefined || newPosition.y === undefined) {
        console.warn('Invalid animation position detected, ending animation:', newPosition);
        setIsAnimating(false);
        if (onAnimationFinished) {
          onAnimationFinished();
        }
        return;
      }
      
      setCurrentPosition(newPosition);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateFrame);
      } else {
        setIsAnimating(false);
        if (onAnimationFinished) {
          onAnimationFinished();
        }
      }
    };

    animationRef.current = requestAnimationFrame(animateFrame);

    // Cleanup function to cancel animation if component unmounts during animation
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };

  }, [targetMousePosition?.x, targetMousePosition?.y, mode]);

  // For step mode, always update position immediately
  useEffect(() => {
    if (mode === 'step' && targetMousePosition && 
        targetMousePosition.x !== undefined && targetMousePosition.y !== undefined) {
      setCurrentPosition(targetMousePosition);
      setPrevPosition(targetMousePosition);
      setIsAnimating(false);
      lastTargetPositionRef.current = targetMousePosition;
    }
  }, [mode, targetMousePosition]);

  if (!mouseVisible) {
    return <></>;
  }

  // Safety check to prevent undefined coordinates from causing transform errors
  const safeCurrentPosition = {
    x: isNaN(currentPosition.x) || currentPosition.x === undefined ? 0 : currentPosition.x,
    y: isNaN(currentPosition.y) || currentPosition.y === undefined ? 0 : currentPosition.y
  };

  return (
    <Box
      id="mouse-overlay"
      data-testid="mouse-overlay"
      ref={overlayRef}
      style={{
        transform: `translate(${safeCurrentPosition.x}px, ${safeCurrentPosition.y}px) scale(0.8)`,
        transition: isAnimating ? undefined : (mode === 'replay' ? 'transform 0.05s linear' : undefined),
        zIndex: 10000,
        position: 'absolute',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 0,0 L 0,20 L 4.5,15.5 L 8.75,23 L 11,22 L 6.75,15 L 13.75,15 Z"
          fill={mouseColor ? mouseColor : 'black'}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};