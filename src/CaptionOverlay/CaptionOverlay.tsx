import * as React from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';

export interface ICaptionOverlayProps {
    captionText?: string;
    fontSizePx?: number;
}

export function CaptionOverlay(props: ICaptionOverlayProps) {
    const { captionText, fontSizePx } = props;
    return (
        <>
            {captionText && (
                <Box
                    style={{
                        width: '100%',
                        color: 'white',
                        position: 'absolute',
                        bottom: 65,
                        zIndex: 10001,
                    }}
                >
                    <Flex justify="center" align="center">
                        <Box style={{
                            maxWidth: '80%',
                            backgroundColor: 'var(--black-a9)',
                            // borderRadius: 'var(--radius-3)',
                            padding: '4px 8px',
                        }}>
                            {fontSizePx ? (
                                <Text style={{ fontSize: fontSizePx*1.5 }}>{captionText}</Text>
                            ) :
                                (
                                    <Text size="6">{captionText}</Text>
                                )
                            }
                        </Box>
                    </Flex>
                </Box>
            )}
        </>
    );
}
