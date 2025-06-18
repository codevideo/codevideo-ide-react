import React from 'react';
import { Box } from '@radix-ui/themes';

export interface IDevBoxProps {
  variables: Record<string, any>;
}

export function DevBox({ variables }: IDevBoxProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontFamily: 'Fira Code, Monaco, Consolas, "Courier New", monospace',
        fontSize: '12px',
        padding: '12px',
        borderRadius: '6px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        zIndex: 1000,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {Object.entries(variables).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '4px', wordBreak: 'break-word' }}>
          <span style={{ color: '#88c0d0' }}>{key}</span>
          <span style={{ color: '#d8dee9' }}>: </span>
          <span style={{ color: '#a3be8c' }}>
            {typeof value === 'string' 
              ? `"${value}"` 
              : JSON.stringify(value, null, 0)}
          </span>
        </div>
      ))}
    </Box>
  );
}
