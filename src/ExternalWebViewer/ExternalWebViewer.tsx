import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { GUIMode } from '@fullstackcraftllc/codevideo-types';
import { EXTERNAL_WEB_VIEWER_ID } from 'src/constants/CodeVideoDataIds.js';

export interface IExternalWebViewerProps {
    url: string;
    mode: GUIMode;
    scrollPosition: number;
    scrollDuration?: number; // Duration in ms for replay mode animations
}

export const ExternalWebViewer = (props: IExternalWebViewerProps) => {
    const {
        url,
        mode,
        scrollPosition,
        scrollDuration = 1000
    } = props;

    const [hasError, setHasError] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const prevScrollPositionRef = useRef<number>(0);

    // Start a timeout to detect load failures
    useEffect(() => {
        // If the iframe hasn't loaded after 10 seconds, assume it failed
        const timer = setTimeout(() => {
            if (!hasLoaded) {
                setHasError(true);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [hasLoaded]);

    // Handle scrolling when scrollPosition changes
    useEffect(() => {
        if (!hasLoaded || !iframeRef.current) return;

        try {
            const iframeWindow = iframeRef.current.contentWindow;
            if (!iframeWindow) return;

            if (mode === 'step') {
                // Immediate scroll for step mode
                iframeWindow.scrollTo({
                    top: scrollPosition,
                    behavior: 'auto'
                });
            } else {
                // Smooth scroll for replay mode
                const startPosition = prevScrollPositionRef.current;
                const startTime = performance.now();

                const animateScroll = (currentTime: number) => {
                    const elapsedTime = currentTime - startTime;
                    if (elapsedTime >= scrollDuration) {
                        iframeWindow.scrollTo({
                            top: scrollPosition,
                            behavior: 'auto'
                        });
                        return;
                    }

                    // Calculate scroll position using easeInOutCubic
                    const progress = elapsedTime / scrollDuration;
                    const t = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                    const newPosition = startPosition + (scrollPosition - startPosition) * t;
                    iframeWindow.scrollTo({
                        top: newPosition,
                        behavior: 'auto'
                    });

                    requestAnimationFrame(animateScroll);
                };

                requestAnimationFrame(animateScroll);
            }

            // Store current scroll position for next animation
            prevScrollPositionRef.current = scrollPosition;
        } catch (error) {
            console.error("Failed to scroll iframe content:", JSON.stringify(error));
        }
    }, [scrollPosition, mode, hasLoaded, scrollDuration]);

    return (
        <Box
            data-codevideo-id={EXTERNAL_WEB_VIEWER_ID}
            data-testid="external-web-viewer"
            style={{ width: '100%', height: '100vh' }}>
            {hasError ? (
                <Flex align="center" justify="center" style={{ height: '100%' }}>
                    <Text size="5" style={{ color: 'var(--gray-10)' }}>
                        Failed to load external content from {url}. The site may be invalid or not allow iframes.
                    </Text>
                </Flex>
            ) : (
                <iframe
                    ref={iframeRef}
                    src={url}
                    title="External Web Viewer"
                    style={{ width: '100%', height: '100%', border: 0 }}
                    sandbox="allow-same-origin allow-scripts allow-popups"
                    onLoad={() => setHasLoaded(true)}
                    onError={() => setHasError(true)}
                />
            )}
        </Box>
    );
};