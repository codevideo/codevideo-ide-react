import * as React from 'react';
import { CodeVideoIDE, ICodeVideoIDEProps } from './CodeVideoIDE';
import { Box, Flex, Theme } from '@radix-ui/themes';
import { useState } from 'react';
import { extractActionsFromProject, GUIMode } from '@fullstackcraftllc/codevideo-types';

export interface EmbeddableCodeVideoIDEProps extends ICodeVideoIDEProps {
    width?: number | string;
    height?: number | string;
}

export function EmbeddableCodeVideoIDE({
    width = '854px',
    height = '480px',
    ...props
}: EmbeddableCodeVideoIDEProps) {
    const { project, currentActionIndex, currentLessonIndex, theme, mode } = props;
    const actions = extractActionsFromProject(project, currentLessonIndex);
    const [modeInternal, setModeInternal] = useState<GUIMode>(mode);
    const [currentActionIndexInternal, setCurrentActionIndexInternal] = useState(currentActionIndex);
    const [isSoundOn, setIsSoundOn] = useState(false);

    const goToNextAction = () => {
        if (currentActionIndexInternal < actions.length - 1) {
            setIsSoundOn(false);
            setCurrentActionIndexInternal((prevIndex) => prevIndex + 1);
        }
    };

    const goToPreviousAction = () => {
        if (currentActionIndexInternal > 0) {
            setIsSoundOn(false);
            setCurrentActionIndexInternal((prevIndex) => prevIndex - 1);
        }
    };

    const startPlayback = () => {
        setCurrentActionIndexInternal(0);
        setModeInternal('replay');
        setIsSoundOn(true);
    };

    if (!actions) {
        console.log("No current project");
        return null;
    }

    return (
        <Theme
            accentColor="mint"
            appearance="dark"
            panelBackground="translucent"
            radius="large"
        >
            <Flex direction="column" justify="center" align="center">
                <Box style={{ width, height }}>
                    <CodeVideoIDE
                        fontSizePx={12}
                        theme={theme}
                        project={project}
                        mode={modeInternal}
                        allowFocusInEditor={false}
                        defaultLanguage={'python'}
                        isExternalBrowserStepUrl={null}
                        currentActionIndex={currentActionIndexInternal}
                        currentLessonIndex={currentLessonIndex}
                        isSoundOn={isSoundOn}
                        withCaptions={true}
                        actionFinishedCallback={goToNextAction}
                        speakActionAudios={[]}
                        fileExplorerWidth={300}
                        terminalHeight={150}
                        mouseColor="black"
                        isEmbedMode={true}
                        requestStepModeCallback={() => setModeInternal('step')}
                        requestNextActionCallback={goToNextAction}
                        requestPreviousActionCallback={goToPreviousAction}
                        requestPlaybackStartCallback={startPlayback}
                    />
                </Box>
            </Flex>
        </Theme>
    );
}
