import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CodeVideoIDE } from './CodeVideoIDE.jsx';
import { Theme } from '@radix-ui/themes';
import { useState } from 'react';
import { extractActionsFromProject, GUIMode, ICodeVideoIDEProps } from '@fullstackcraftllc/codevideo-types';

export function mountEmbeddableCodeVideoIDE(props: any, containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found');
        return;
    }
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(EmbeddableCodeVideoIDE, props));
}

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
            style={{ width, height }}
        >
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
                resolution='1080p'
            />
        </Theme>
    );
}
