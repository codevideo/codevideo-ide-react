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
    "value": "Hi guys, we've just added some major updates to the CodeVideo React IDE. I'm excited to show you the new features we've implemented!"
  },
  {
    "name": "author-speak-before",
    "value": "One of our biggest improvements is the enhanced file explorer with context menus. Let me demonstrate how to create files using this new feature."
  },
  {
    "name": "author-speak-before",
    "value": "Let's create our first file called a.txt using the new context menu."
  },
  {
    "name": "mouse-move-file-explorer",
    "value": "1"
  },
  {
    "name": "mouse-right-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Notice how we now have a full context menu - this is one of our new features!"
  },
  {
    "name": "mouse-move-file-explorer-context-menu-new-file",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "file-explorer-type-new-file-input",
    "value": "a.txt"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! Now let's create a second file to show how our multi-tab support works."
  },
  {
    "name": "mouse-move-file-explorer",
    "value": "1"
  },
  {
    "name": "mouse-right-click",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-context-menu-new-file",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "file-explorer-type-new-file-input",
    "value": "b.txt"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "And now a third file - our advanced mouse tracking system allows for seamless interaction between multiple files."
  },
  {
    "name": "mouse-move-file-explorer",
    "value": "1"
  },
  {
    "name": "mouse-right-click",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-context-menu-new-file",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "file-explorer-type-new-file-input",
    "value": "c.txt"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's add some content to our c.txt file to demonstrate another new feature - our unsaved changes detection system."
  },
  {
    "name": "mouse-move-editor",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "console.log('Hello, world!');"
  },
  {
    "name": "author-speak-before",
    "value": "Great! Now let's try to close this file without saving it to trigger our brand new unsaved changes dialog."
  },
  {
    "name": "mouse-move-editor-tab-close",
    "value": "c.txt"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "As you can see, we now have a professional IDE-style unsaved changes dialog that prompts you to save your work!"
  },
  {
    "name": "mouse-move-unsaved-changes-dialog-button-dont-save",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "We chose not to save the changes, and now the file is closed. Let's close another tab to show how our tab management works."
  },
  {
    "name": "mouse-move-editor-tab-close",
    "value": "a.txt"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "And that's it! We now have a fully functional IDE with context menus, advanced mouse tracking, tab management, and unsaved changes detection. Thanks for checking out our latest updates to the CodeVideo React IDE!"
  }
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
            mouseColor="green" 
            playBackCompleteCallback={() => {}}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
