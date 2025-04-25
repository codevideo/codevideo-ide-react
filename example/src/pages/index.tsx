import * as React from "react"
import { GUIMode, IAction, Project, IAudioItem } from "@fullstackcraftllc/codevideo-types"
// actual package import
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
// local import from src below - doesn't seem to work because of relative path issues
// import { CodeVideoIDE } from "../../../src/CodeVideoIDE"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

const audios: Array<IAudioItem> = []
const speakActionAudios =  [];

const actions: Array<IAction> = [
  {
    "name": "author-speak-before",
    "value": "Hi guys, Chris here again with another CodeVideo update! We've just added slideshow support within the CodeVideo ecosystem! You can show a slide by using the 'slide-display' action and specifying the slide's content with markdown, like so:"
  },
  {
    "name": "slide-display",
    "value": "# This is a slide!\n\n## And this is a subheading\n\n- This is a bullet point\n- This is another bullet point\n- This is a third bullet point\n\nAnd this is some text below the bullet points.\n\n```typescript\nexport interface MyInterface {\n    name: string;\n    age: number;\n}\n```\n\nAnd that ^ is a TypeScript code block! We can also render `inline code` and emojis 😎.\n\n"
  },
  {
    "name": "author-speak-before",
    "value": "You can see out of the box that we support headings, bullet points, and code blocks! In fact, any valid markdown will work for these slides."
  },
  {
    "name": "author-speak-before",
    "value": "I can keep talking on the same slide as much as I want."
  },
  {
    "name": "author-speak-before",
    "value": "The slide won't change until we do a non-speaking or non-slide action."
  },
  {
    "name": "author-speak-before",
    "value": "Alright, let's go on to the next slide by issuing 'slide-display' with new markdown content!"
  },
  {
    "name": "slide-display",
    "value": "# This is the NEXT slide!\n\nWow, CodeVideo™ is great! Maybe we should just start calling it EducationalVideo™!"
  },
  {
    "name": "author-speak-before",
    "value": "Let's go to the next slide!"
  },
  {
    "name": "slide-display",
    "value": "# Here's a final third slide\n\nthis is the last slide :( I'm sad to see it end... :("
  },
  {
    "name": "author-speak-before",
    "value": "Alright, let's get back into the editor."
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "All I did to hide the slide was issue the 'mouse-left-click' action - this is an editor related action, so the slides will no longer be shown."
  },
  {
    "name": "author-speak-before",
    "value": "That's it for this new feature! I hope you enjoy it, and I can't wait to see what you create with CodeVideo! Until next time, cheers everyone!"
  },
];

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

// same as step for now - probably should become more universal example
export default function Home() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  // on mount, ensure that currentActionIndex is set to 0
  useEffect(() => {
    setCurrentActionIndex(0)
    setMode('step')
  }, [])

  // on mount, setup event listeners for left and right arrow keys - to navigate between actions
  useEffect(() => {
    if (mode !== 'step') {
      return
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentActionIndex < actions.length - 1) {
        console.log('going to next action')
        setCurrentActionIndex(currentActionIndex + 1)
      } else if (e.key === 'ArrowLeft' && currentActionIndex > 0) {
        console.log('going to previous action')
        setCurrentActionIndex(currentActionIndex - 1)
      } else if (e.key === ' ') {
        console.log('replaying mode active')
        // reset actions to 0 and set mode to replay
        setCurrentActionIndex(0)
        setMode('replay')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, currentActionIndex])



  const goToNextAction = () => {
    if (currentActionIndex < actions.length - 1) {
      setCurrentActionIndex(currentActionIndex + 1)
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
            project={project}
            mode={mode}
            allowFocusInEditor={false}
            defaultLanguage={'python'}
            isExternalBrowserStepUrl={null}
            currentActionIndex={currentActionIndex}
            currentLessonIndex={0}
            isSoundOn={true}
            withCaptions={true}
            actionFinishedCallback={goToNextAction}
            speakActionAudios={speakActionAudios}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="black" 
            playBackCompleteCallback={() => {}}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
