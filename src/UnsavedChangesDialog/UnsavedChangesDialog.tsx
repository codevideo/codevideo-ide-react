import * as React from 'react';
import { Dialog, Flex, Text, Button, Box, Code } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

export interface IUnsavedChangesDialogProps {
    isUnsavedChangesDialogOpen: boolean;
    unsavedFileName: string;
}

export function UnsavedChangesDialog(props: IUnsavedChangesDialogProps) {
    const { isUnsavedChangesDialogOpen, unsavedFileName } = props;

    // if showUnsavedChangesDialog is false, return null
    if (!isUnsavedChangesDialogOpen) {
        return <></>;
    }

    return (
        <Box
            data-testid="unsaved-changes-dialog"
            style={{
                zIndex: 9999,
                position: 'absolute',
                inset: 0, // shorthand for top/right/bottom/left: 0
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                backgroundColor: 'var(--black-a7)',
            }}
        >
            {/* Custom dialog content instead of Radix Dialog */}
            <Box
                style={{
                    backgroundColor: 'var(--gray-4)',
                    borderRadius: 'var(--radius-4)',
                    boxShadow: 'var(--shadow-5)',
                    padding: '24px',
                    maxWidth: '350px',
                    width: '100%',
                }}
            >
                <Flex direction="column" align="center" justify="center">
                    <ExclamationTriangleIcon
                        height="36"
                        width="36" />
                    <Text size="2" mt="4" style={{ textAlign: 'center' }}>
                        Do you want to save the changes you made to <Code>{unsavedFileName}</Code>?
                    </Text>
                    <Text size="1" mb="4" style={{ textAlign: 'center' }} >
                        Your changes will be lost if you don't save them.
                    </Text>
                </Flex>
                <Flex direction="column">
                    <Button
                        data-codevideo-id='unsaved-changes-dialog-button-save'
                        color='mint'
                        style={{
                            outline: 'none',
                        }}
                    >
                        Save
                    </Button>
                    <Button
                        data-codevideo-id='unsaved-changes-dialog-button-dont-save'
                        color='gray'
                        mt="1"
                        style={{
                            outline: 'none',
                        }}>
                        Don't Save
                    </Button>
                    <Button
                        data-codevideo-id='unsaved-changes-dialog-button-cancel'
                        color='gray'
                        mt="4"
                        style={{
                            outline: 'none',
                        }}>
                        Cancel
                    </Button>
                </Flex>
            </Box>
        </Box>
    );
}
