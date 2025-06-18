import * as React from "react"
import { ICodeVideoIDEProps, GUIMode, IAction, IAudioItem, ICodeVideoManifest, Project, extractActionsFromProject } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// this example is nearly the same as the record example, but with some puppeteer window injections
// it also loads the manifest from the CodeVideo API running at localhost:7000
// this is the static page used by the codevideo-cli
export default function Puppeteer() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [project, setProject] = useState<Project>([])
  const [actions, setActions] = useState<IAction[]>([])
  // const [currentLessonIndex, setCurrentLessonIndex] = useState<number | null>(null)
  const [audioItems, setAudioItems] = useState<Array<IAudioItem>>([])
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false)
  const [monacoLoaded, setMonacoLoaded] = useState<boolean>(false)

  // CodeVideoIDE props state with defaults
  const [ideProps, setIdeProps] = useState<ICodeVideoIDEProps>({
    project: [],
    mode: 'step',
    currentLessonIndex: 0,
    currentActionIndex: 0,
    isSoundOn: false,
    actionFinishedCallback: () => {},
    speakActionAudios: [],
    theme: 'dark',
    allowFocusInEditor: true,
    defaultLanguage: 'python',
    isExternalBrowserStepUrl: null,
    withCaptions: true,
    fileExplorerWidth: 400,
    terminalHeight: 350,
    mouseColor: "black",
    fontSizePx: 26,
    keyboardTypingPauseMs: 40,
    standardPauseMs: 200,
    longPauseMs: 200,
    resolution: '1080p',
    showDevBox: false,
  })

  // on user interaction, set mode to 'replay' and reset the current action index
  const [readyToReplay, setReadyToReplay] = useState(false)

  // Expose the __startRecording function globally.
  // also log any error or unhandled rejection to the console
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.error("This code is intended to run in a browser environment.");
      return;
    }
    
    (window as any).__startRecording = () => {
      console.log("Recording triggered programmatically!");
      setReadyToReplay(true);
    };

    (window as any).addEventListener('error', (event) => {
        console.error('Global error caught:', JSON.stringify({
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error?.stack
        }));
    });

    (window as any).addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', JSON.stringify(event));
    });
  }, []);

  useEffect(() => {
    if (readyToReplay && monacoLoaded) {
      console.log('Starting replay...')
      setCurrentActionIndex(0)
      setMode('replay')
      setIsSoundOn(true)
      if (typeof (window as any).__onActionProgress === 'function') {
        (window as any).__onActionProgress({
          currentAction: currentActionIndex,
          totalActions: actions.length,
          progress: 0,
          actionName: actions[currentActionIndex]?.name || `Action ${currentActionIndex}`,
          actionValue: actions[currentActionIndex]?.value || '',
          timestamp: Date.now().toLocaleString()
        });
      }
    }
  }, [readyToReplay, monacoLoaded])

  // gets manifest from the CodeVideo API running at localhost:7000
  const getManifest = async (uuid: string) => {
    try {
      const response = await fetch(`http://localhost:7000/get-manifest-v3?uuid=${uuid}`)
      const data: ICodeVideoManifest = await response.json()
      console.log("\n-------------------\n\n\nMANIFEST DATA:\n", JSON.stringify(data, null, 2), "\n\n-------------------\n")

      // if data.actions is defined, set the actions
      let project: Project | undefined
      if (data && data.actions) {
        project = data.actions
        console.log(`FOUND ${data.actions.length} actions in manifest`)
        setActions(data.actions)
      } else if (data.lesson) {
        project = data.lesson
        console.log(`FOUND ${data.lesson.actions.length} actions in lesson`)
        setActions(data.lesson.actions)
      }
      setProject(project || [])
      setAudioItems(data.audioItems)

      // Apply codeVideoIDEProps from manifest if they exist
      if (data.codeVideoIDEProps) {
        setIdeProps(prevProps => ({
          ...prevProps,
          ...data.codeVideoIDEProps
        }))
      }
    } catch (error) {
      console.error("Error getting manifest: ", JSON.stringify(error));
    }
  }

  // on mount, load uuid from "uuid" property in the url
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const uuid = urlParams.get('uuid')
    if (uuid) {
      console.log("Retrieving manifest for uuid: ", uuid)
      getManifest(uuid)
    }
  }, [])

  // NOTE HERE: to continue to the next action in replay mode, you need to implementation a function for the actionFinishedCallback prop
  const goToNextAction = () => {
    console.log("Going to next action...")
    const nextIndex = currentActionIndex + 1
    if (nextIndex < actions.length) {
      // Send progress update - see scripts/make-video-from-record-page.js
      if (typeof (window as any).__onActionProgress === 'function') {
        (window as any).__onActionProgress({
          currentAction: nextIndex,
          totalActions: actions.length,
          progress: (nextIndex / actions.length * 100).toFixed(1),
          actionName: actions[nextIndex]?.name || `Action ${nextIndex}`,
          actionValue: actions[nextIndex]?.value || '',
          timestamp: Date.now().toLocaleString()
        });
      }
    }
    setCurrentActionIndex(nextIndex)
  }

  // when the video is complete, you need may want to implement a function for the playBackCompleteCallback prop
  const playBackCompleteCallback = () => {
    console.log("Playback complete!")
    // Send final progress update (the one with 100%) only once when the final action is reached this is actually when nextIndex === actions.length
    if (typeof (window as any).__onActionProgress === 'function') {
      (window as any).__onActionProgress({
        currentAction: actions.length,
        totalActions: actions.length,
        progress: "100.0",
        actionName: actions[actions.length - 1]?.name || `Action ${actions.length}`,
        actionValue: actions[actions.length - 1]?.value || '',
        timestamp: Date.now().toLocaleString()
      });
    }
  }

  // Note the codevideoIDE must be rendered within a radix <Theme/> scope to render properly
  return (
    <Theme
      accentColor="mint"
      appearance="dark"
      panelBackground="translucent"
      radius="large"
    >
      <Flex direction="column" justify="center" align="center">
        <Box
          style={{
            height: '100vh',
            width: '100vw',
          }}
        >
          <CodeVideoIDE
            {...ideProps}
            // should be project, but something seems broken - just use the actions for now
            project={project}
            // should be currentLessonIndex, but something seems broken
            currentLessonIndex={0}
            mode={mode}
            currentActionIndex={currentActionIndex}
            isSoundOn={isSoundOn}
            actionFinishedCallback={goToNextAction}
            playBackCompleteCallback={playBackCompleteCallback}
            // this example has audios! see codevideo-backend-engine, command: `npm run generate-audio-manifest <your actions json or ts file here> elevenlabs`
            speakActionAudios={audioItems}
            monacoLoadedCallback={() => setMonacoLoaded(true)}
            showDevBox={false} // set to 'true' to show a small dev box in the bottom left corner of the video
          />
        </Box>
      </Flex>
    </Theme>
  )
}
