import * as React from 'react';
import { Kbd, Text, Box, Flex, Link } from '@radix-ui/themes';

export function EmbedOverlay() {
    return (
        <Box
            style={{
                zIndex: 10000000000,
                position: 'absolute',
                pointerEvents: 'none',
                userSelect: 'none',
                backgroundColor: 'var(--black-a9)',
                inset: 0, // shorthand for top/right/bottom/left: 0
            }}
        >
            <Flex
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                direction="column"
                gap="2"
            >
                <Box>
                    <Text size="9">{'/>'} CodeVideo Software Tutorial</Text>
                </Box>
                <Box>
                    <Text size="2" mb="9">Create your own at <Link href='https://studio.codevideo.io' target="_blank">studio.codevideo.io</Link></Text>
                </Box>
                <Box>
                    <Text size="6">Press <Kbd>Space</Kbd> to playback</Text>
                </Box>
                <Box>
                    <Text size="6">Press the <Kbd>{'\u25C0'}</Kbd> and <Kbd>{'\u25B6'}</Kbd> arrow keys to move through the steps.</Text>
                </Box>
            </Flex>
        </Box>
    );
}
