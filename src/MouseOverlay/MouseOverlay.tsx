import React, { useEffect, useRef, useState } from 'react';
import { GUIMode, IPoint } from '@fullstackcraftllc/codevideo-types';
import { Box } from '@radix-ui/themes';
import { samplePathPoints } from './coordinateFunctions/mouse-movement/samplePathPoints';
import { generateControlPoints } from './coordinateFunctions/mouse-movement/generateControlPoints';

interface IMouseOverlayProps {
  mode: GUIMode;
  targetMousePosition: IPoint;
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
    mouseColor,
    arcHeight = 0.3,
    numberOfCurves = 1,
    onAnimationFinished,
    onCurrentPositionChange
  } = props;

  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentPosition, setCurrentPosition] = useState<IPoint>(targetMousePosition);
  const [prevPosition, setPrevPosition] = useState<IPoint>(targetMousePosition);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [pathPoints, setPathPoints] = useState<IPoint[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTargetPositionRef = useRef<IPoint>(targetMousePosition);

  // Call the position change callback whenever currentPosition changes
  useEffect(() => {
    if (onCurrentPositionChange) {
      onCurrentPositionChange(currentPosition);
    }
  }, [currentPosition, onCurrentPositionChange]);

  useEffect(() => {
    // Skip if we're already animating to avoid double animations
    if (isAnimating) {
      return;
    }

    // Skip if target position hasn't changed
    if (targetMousePosition.x === lastTargetPositionRef.current.x &&
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
    if (prevPosition.x === targetMousePosition.x && prevPosition.y === targetMousePosition.y) {
      setCurrentPosition(targetMousePosition);
      setPrevPosition(targetMousePosition);
      return;
    }

    // Always use the current position as the starting point for animation
    // This ensures we start from where the mouse actually is
    const startPosition = currentPosition;

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
    const animationPoints = samplePathPoints(controlPoints, 60);
    setPathPoints(animationPoints);

    setIsAnimating(true);

    // Animate along the pre-calculated path
    let startTime: number | null = null;

    // random duration from 750 to 1000
    const duration = Math.floor(Math.random() * 250) + 750;

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Get the point at the current progress
      const frameIndex = Math.min(
        Math.floor(progress * (animationPoints.length - 1)),
        animationPoints.length - 1
      );

      const newPosition = animationPoints[frameIndex];
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

  }, [targetMousePosition.x, targetMousePosition.y, mode]);

  // For step mode, always update position immediately
  useEffect(() => {
    if (mode === 'step') {
      setCurrentPosition(targetMousePosition);
      setPrevPosition(targetMousePosition);
      setIsAnimating(false);
      lastTargetPositionRef.current = targetMousePosition;
    }
  }, [mode, targetMousePosition]);

  if (!mouseVisible) {
    return <></>;
  }

  return (
    <Box
      id="mouse-overlay"
      ref={overlayRef}
      style={{
        transform: `translate(${currentPosition.x}px, ${currentPosition.y}px) scale(0.8)`,
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