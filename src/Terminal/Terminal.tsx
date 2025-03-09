import React, { useEffect, useRef } from 'react';
import { Box } from '@radix-ui/themes';

export interface ITerminalProps {
    theme?: 'light' | 'dark';
    terminalBuffer: string;
    terminalHeight?: number;
}

export function Terminal(props: ITerminalProps) {
    const { theme, terminalBuffer, terminalHeight } = props;
    const terminalRef = useRef<HTMLDivElement>(null);

    // always auto-scroll to the bottom whenever the terminal buffer changes
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalBuffer]);

    // if the terminal buffer has no length, return a placeholder <Box/>
    if (terminalBuffer.length === 0) {
        return (
            <Box 
            style={{ 
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)', 
                height: terminalHeight ? `${terminalHeight}px` : '150px',
                borderTop: '1px solid var(--gray-7)' 
            }} />
        )
    }

    return (
        <Box
            data-codevideo-id="terminal"
            ref={terminalRef}
            style={{
                borderTop: '1px solid var(--gray-7)',
                height: terminalHeight ? `${terminalHeight}px` : '150px',
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                fontFamily: 'Fira Code, monospace',
                padding: '8px',
                position: 'relative',
                overflow: 'auto', // Changed from 'hidden' to 'auto' to enable scrolling
                scrollBehavior: 'smooth', // Add smooth scrolling effect
            }}
        >
            <Box style={{
                whiteSpace: 'pre-wrap',  // This enables text wrapping
                wordBreak: 'break-word', // This ensures words break properly
                fontWeight: 'bold',
                width: '100%',           // Ensure the content takes full width of container
            }}>
                {terminalBuffer}
                <Box
                    style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '19px',
                        marginBottom: '-4px',
                        backgroundColor: 'var(--gray-12)',
                        animation: 'blink 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                />
            </Box>
        </Box>
    );
}