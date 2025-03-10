import * as React from "react"
import { GUIMode, IAction, Project } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { AudioItem } from "../utils/audioElements";

// currently, audio manifests can be generated from codevideo-backend-engine npm run generate-audio-manifest
const audios: Array<AudioItem> = [
  {
    "text": "Right now, we're just looking at a blank editor. We don't even have a file open yet! Let's begin by creating a TypeScript file for this 'areEqual' function.",
    "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/3fc8d70f4676b4f5984b85c34a7f273fc72a29fc39ceda594e5284bc67b7c594.mp3"
  },
  {
    "text": "Let's first write a JS doc comment for our function:",
    "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/6fd64043adaaa45a60fa6d95dace98cd71db4b82d869e95b4cbef5317d2e0d47.mp3"
  },
  {
    "text": "Now let's implement the actual function:",
    "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/715b505c019f626596cd310c49cf3f6fb37a2a9427ab1cdceaa99daa5c3f76c8.mp3"
  },
  {
    "text": "That should be all we need to do for this 'areEqual' function. I hope you enjoyed the lesson!!!",
    "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/25caae0805190bdfe8e6db5aa00eddd9c1f4e5ca71e0367d0e805143e65fb249.mp3"
  }
]

const actions: Array<IAction> = [
  {
    "name": "author-speak-before",
    "value": "Right now, we're just looking at a blank editor. We don't even have a file open yet! Let's begin by creating a TypeScript file for this 'areEqual' function."
  },
  {
    "name": "file-explorer-create-file",
    "value": "areEqual.ts"
  },
  {
    "name": "file-explorer-open-file",
    "value": "areEqual.ts"
  },
  {
    "name": "editor-type",
    "value": "// areEqual.ts\n"
  },
  {
    "name": "author-speak-before",
    "value": "Let's first write a JS doc comment for our function:"
  },
  {
    "name": "editor-type",
    "value": "/**\n* Compares two numbers for strict equality.\n*\n* @param a - The first number to compare\n* @param b - The second number to compare\n* @returns true if the numbers are strictly equal, false otherwise\n*/\n"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's implement the actual function:"
  },
  {
    "name": "editor-type",
    "value": "export const areEqual = (a: number, b: number): boolean => {\n    return a === b;\n}"
  },
  {
    "name": "author-speak-before",
    "value": "That should be all we need to do for this 'areEqual' function. I hope you enjoyed the lesson!!!"
  }
]

// TODO: actually none of these other strings affect the project... so?????
const project: Project = {
  id: '',
  name: '',
  description: '',
  primaryLanguage: '',
  lessons: [
    {
      id: '',
      name: '',
      description: '',
      actions: actions
    }
  ]
};

// this example is nearly the same as the record example, but with some puppeteer window injections
export default function Puppeteer() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  // on user interaction, set mode to 'replay' and reset the current action index
  const [userInteracted, setUserInteracted] = useState(false)

  // Handle user interaction
  const handleUserInteraction = () => {
    if (!userInteracted) {
      setCurrentActionIndex(0)
      setMode('replay')
      setUserInteracted(true)
    }
  }

  // Set up event listeners for user interaction
  useEffect(() => {
    // Common user interaction events
    const interactionEvents = ['click', 'keydown', 'touchstart']

    const handleInteraction = () => handleUserInteraction()

    // Add event listeners
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true })
    })

    // Clean up
    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }
  }, [userInteracted])

  // to continue to next action in replay mode, you need to implementation a function for the actionFinishedCallback prop
  const goToNextAction = () => {
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

    // Send final progress update (the one with 100%) only once when the final action is reached this is actually when nextIndex === actions.length
    if (nextIndex === actions.length) {
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
    setCurrentActionIndex(nextIndex)
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
            project={project}
            mode={mode}
            allowFocusInEditor={false}
            defaultLanguage={'python'}
            isExternalBrowserStepUrl={null}
            currentActionIndex={currentActionIndex}
            currentLessonIndex={0}
            isSoundOn={true}
            // if you're using CodeVideo to record a video for something like youtube, captions may not be a good idea
            // if you're exporting a video to your own site, captions might be really nice!
            // for this example we assume the youtube use case
            withCaptions={true}
            actionFinishedCallback={goToNextAction}
            // this example has audios! see codevideo-backend-engine, command: `npm run generate-audio-manifest <your actions json or ts file here> elevenlabs`
            speakActionAudios={audios}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="black"
            fontSizePx={20}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
