import React, { useEffect, useRef } from 'react';
import { Box } from '@radix-ui/themes';
import { TERMINAL_ID } from 'src/constants/CodeVideoDataIds.js';

export interface ITerminalProps {
    theme?: 'light' | 'dark';
    terminalBuffer: string;
    fontSizePx?: number;
    terminalHeight?: number;
    showBlockCaret?: boolean;
}

export function Terminal(props: ITerminalProps) {
    const { theme, terminalBuffer, terminalHeight, fontSizePx = 14, showBlockCaret = false } = props;
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
            data-codevideo-id={TERMINAL_ID}
            data-testid="terminal"
            ref={terminalRef}
            style={{
                borderTop: '1px solid var(--gray-7)',
                height: terminalHeight ? `${terminalHeight}px` : '150px',
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                fontFamily: 'Fira Code, monospace',
                fontSize: `${fontSizePx}px`,
                padding: '8px',
                position: 'relative',
                overflow: 'auto',
                scrollBehavior: 'smooth',
            }}
        >
            <Box style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontWeight: 'bold',
                width: '100%',
            }}>
                {terminalBuffer}
                <Box
                    style={{
                        display: 'inline-block',
                        width: `${fontSizePx * 0.6}px`,
                        height: `${fontSizePx}px`,
                        marginBottom: '-2px',
                        backgroundColor: showBlockCaret ? 'var(--gray-12)' : 'transparent',
                        border: showBlockCaret ? 'none' : `1px solid var(--gray-12)`,
                        boxSizing: 'border-box',
                    }}
                />
            </Box>
        </Box>
    );
}