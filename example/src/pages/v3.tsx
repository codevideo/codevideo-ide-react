import * as React from "react"
import { GUIMode, IAction, IAudioItem, ICodeVideoManifest } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// this example is nearly the same as the record example, but with some puppeteer window injections
// it also loads the manifest from the CodeVideo API running at localhost:7000
export default function Puppeteer() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [actions, setActions] = useState<Array<IAction>>([])
  const [audioItems, setAudioItems] = useState<Array<IAudioItem>>([])
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false)
  const [monacoLoaded, setMonacoLoaded] = useState<boolean>(false)

  // on user interaction, set mode to 'replay' and reset the current action index
  const [readyToReplay, setReadyToReplay] = useState(false)

  // Expose the __startRecording function globally.
  useEffect(() => {
    (window as any).__startRecording = () => {
      console.log("Recording triggered programmatically!");
      setReadyToReplay(true);
    };
  }, []);

  // set user interacted to true on user interaction
  // const handleUserInteraction = () => {
  //   console.log("User interacted, attempting to replay...")
  //   if (actions.length === 0) {
  //     console.log("No actions to replay yet; won't set interacted to true!")
  //     return
  //   }
  //   setUserInteracted(true)
  // }

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
          progress: (currentActionIndex / actions.length * 100).toFixed(1),
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
      const response = await fetch(`http://codevideo-api:7000/get-manifest-v3?uuid=${uuid}`)
      const data: ICodeVideoManifest = await response.json()
      console.log("Manifest data: ", data)
      setActions(data.actions)
      setAudioItems(data.audioItems)
    } catch (error) {
      console.error("Error getting manifest: ", error)
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

  // not needed in puppeteer since we use the 
  // On mount, set up event listeners for user interaction
  // useEffect(() => {
  //   // Common user interaction events
  //   const interactionEvents = ['click', 'keydown', 'touchstart']

  //   const handleInteraction = () => handleUserInteraction()

  //   // Add event listeners
  //   interactionEvents.forEach(event => {
  //     document.addEventListener(event, handleInteraction, { once: true })
  //   })

  //   // Clean up
  //   return () => {
  //     interactionEvents.forEach(event => {
  //       document.removeEventListener(event, handleInteraction)
  //     })
  //   }
  // }, [])

  // to continue to next action in replay mode, you need to implementation a function for the actionFinishedCallback prop
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
            theme='dark'
            project={actions}
            mode={mode}
            allowFocusInEditor={false}
            defaultLanguage={'python'}
            isExternalBrowserStepUrl={null}
            currentActionIndex={currentActionIndex}
            currentLessonIndex={0}
            isSoundOn={isSoundOn}
            // if you're using CodeVideo to record a video for something like youtube, captions may not be a good idea
            // if you're exporting a video to your own site, captions might be really nice!
            // for this example, since the user gets directly in their email, captions are nice
            withCaptions={true}
            actionFinishedCallback={goToNextAction}
            playBackCompleteCallback={playBackCompleteCallback}
            // this example has audios! see codevideo-backend-engine, command: `npm run generate-audio-manifest <your actions json or ts file here> elevenlabs`
            speakActionAudios={audioItems}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="black"
            fontSizePx={24}
            monacoLoadedCallback={() => setMonacoLoaded(true)}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
