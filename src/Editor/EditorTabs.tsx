import * as React from 'react';
import { IEditor } from '@fullstackcraftllc/codevideo-types';
import { Flex, Text, Box } from '@radix-ui/themes';

export interface IEditorTabsProps {
    editors: Array<IEditor>;
    theme: 'light' | 'dark';
    currentEditor?: IEditor; // Add this prop
}

export function EditorTabs(props: IEditorTabsProps) {
    const { editors, theme, currentEditor } = props;

    // if editors are empty, render fixed height to prevent layout shift
    if (editors.length === 0) {
        return <Box style={{
            backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
            height: '30px',
            borderBottom: '1px solid var(--gray-7)',
        }} />;
    }

    return (
        <Flex
            data-testid="editor-tabs"
            style={{
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                height: '40px',
                borderBottom: '1px solid var(--gray-7)',
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            {editors.map(editor => {
                const absoluteFileName = editor.filename;
                const baseFileName = absoluteFileName.split('/').pop();
                const isActive = currentEditor?.filename === editor.filename;
                
                return (
                    <Flex
                        data-codevideo-id={`editor-tab-${absoluteFileName}`}
                        key={editor.filename}
                        align="center"
                        px="4"
                        py="3"
                        style={{ 
                            borderRight: '1px solid var(--gray-7)', 
                            backgroundColor: isActive 
                                ? (theme === 'light' ? 'var(--gray-3)' : 'var(--gray-6)')
                                : 'transparent',
                            borderBottom: isActive ? '2px solid var(--mint-9)' : 'none',
                            position: 'relative'
                        }}
                    >
                        <Text style={{ 
                            fontFamily: 'Fira Code, monospace', 
                            color: isActive 
                                ? (theme === 'light' ? 'var(--gray-12)' : 'var(--gray-12)')
                                : '#CCCECC',
                            fontWeight: isActive ? '500' : '400'
                        }}>
                            {baseFileName}
                        </Text>

                        {editor.isSaved ? (
                            <Box
                                data-codevideo-id={`editor-tab-close-${absoluteFileName}`}
                                ml="2"
                                style={{
                                    color: isActive ? 'var(--gray-10)' : 'var(--gray-8)',
                                    padding: 0,
                                    lineHeight: 1,
                                    minWidth: 'auto',
                                }}
                            >
                                ×
                            </Box>
                        ) : (
                            <Box
                                data-codevideo-id={`editor-tab-close-${absoluteFileName}`}
                                ml="2"
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: isActive ? 'var(--mint-9)' : 'var(--gray-8)',
                                    borderRadius: '9999px'
                                }}
                            />
                        )}
                    </Flex>
                )
            }
            )}
        </Flex>
    );
}