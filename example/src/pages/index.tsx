import * as React from "react"
import { GUIMode, IAction, Project, IAudioItem } from "@fullstackcraftllc/codevideo-types"
// actual package import
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
// local import from src below - doesn't seem to work because of relative path issues
// import { CodeVideoIDE } from "../../../src/CodeVideoIDE"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// const audios: Array<IAudioItem> = []
const speakActionAudios =  [];

const actions: Array<IAction> = [
  {
    "name": "author-speak-before",
    "value": "Welcome to this lesson where we'll build a simple web app while testing some exciting new CodeVideo features! We'll create an HTML file, a JavaScript file, and a CSS file, then use the external web preview to see our app in action."
  },
  {
    "name": "slide-display",
    "value": "# CodeVideo New Features!\n\n- Web Preview\n- Editor Scrolling\n- External Browser Viewing\n- Color Changes with Preview Updates"
  },
  {
    "name": "author-speak-before",
    "value": "Let's start by creating our HTML file. We'll right-click in the file explorer to create a new file."
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
    "value": "index.html"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Great! Now let's add some basic HTML structure to our file."
  },
  {
    "name": "editor-type",
    "value": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Feature Test App</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n    <div class=\"container\">\n        <h1 id=\"title\">Hello World!</h1>\n        <button id=\"colorBtn\">Change Color</button>\n    </div>\n    <script src=\"index.js\"></script>\n</body>\n</html>"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's create our JavaScript file to add some interactivity."
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
    "value": "index.js"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "document.addEventListener('DOMContentLoaded', function() {\n    const colorBtn = document.getElementById('colorBtn');\n    const title = document.getElementById('title');\n\n    colorBtn.addEventListener('click', function() {\n        title.style.color = title.style.color === 'blue' ? 'red' : 'blue';\n    });\n});"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's create our CSS file with plenty of styles so we can test the editor scrolling feature."
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
    "value": "styles.css"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "/* Reset and base styles */\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    font-family: Arial, sans-serif;\n    line-height: 1.6;\n    color: #333;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    min-height: 100vh;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n/* Container styles */\n.container {\n    background: white;\n    padding: 2rem;\n    border-radius: 10px;\n    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);\n    text-align: center;\n    max-width: 400px;\n    width: 90%;\n}\n\n/* Title styles */\n#title {\n    font-size: 2.5rem;\n    margin-bottom: 1.5rem;\n    color: #2c3e50;\n    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);\n    transition: color 0.3s ease;\n}\n\n#title:hover {\n    transform: scale(1.05);\n    transition: transform 0.3s ease;\n}\n\n/* Button styles */\n#colorBtn {\n    background: linear-gradient(45deg, #ff6b6b, #ee5a24);\n    color: white;\n    border: none;\n    padding: 12px 24px;\n    font-size: 1.1rem;\n    border-radius: 25px;\n    cursor: pointer;\n    transition: all 0.3s ease;\n    box-shadow: 0 4px 15px rgba(238, 90, 36, 0.3);\n}\n\n#colorBtn:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 6px 20px rgba(238, 90, 36, 0.4);\n}\n\n#colorBtn:active {\n    transform: translateY(0);\n}\n\n/* Responsive design */\n@media (max-width: 600px) {\n    .container {\n        padding: 1.5rem;\n    }\n\n    #title {\n        font-size: 2rem;\n    }\n\n    #colorBtn {\n        padding: 10px 20px;\n        font-size: 1rem;\n    }\n}\n\n/* Additional animations */\n@keyframes fadeIn {\n    from {\n        opacity: 0;\n        transform: translateY(20px);\n    }\n    to {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n.container {\n    animation: fadeIn 0.6s ease-out;\n}\n\n/* Extra utility classes */\n.text-center {\n    text-align: center;\n}\n\n.margin-top {\n    margin-top: 1rem;\n}\n\n.margin-bottom {\n    margin-bottom: 1rem;\n}\n\n.padding-small {\n    padding: 0.5rem;\n}\n\n.padding-medium {\n    padding: 1rem;\n}\n\n.padding-large {\n    padding: 2rem;\n}"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! Now let's test the external web preview feature to see our app in action."
  },
  {
    "name": "external-web-preview",
    "value": "index.html"
  },
  {
    "name": "author-speak-before",
    "value": "Great! Our app is working. Now let's test the editor scrolling feature by going back to our CSS file and scrolling down to see the bottom styles."
  },
  {
    "name": "file-explorer-open-file",
    "value": "styles.css"
  },
  {
    "name": "author-speak-before",
    "value": "Let's scroll down in the editor to see the utility classes at the bottom of our CSS file."
  },
  {
    "name": "editor-scroll-down",
    "value": "15"
  },
  {
    "name": "author-speak-before",
    "value": "And now let's scroll back up to the top to see our base styles."
  },
  {
    "name": "editor-scroll-up",
    "value": "15"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's make a quick color change to test the web preview refresh. We'll change the background color from that blue purple gradient to a bright green one."
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
    "name": "editor-arrow-up",
    "value": "100"
  },
  {
    "name": "editor-arrow-up",
    "value": "8"
  },
  {
    "name": "editor-backspace",
    "value": "67"
  },
  {
    "name": "editor-type",
    "value": "   background: linear-gradient(135deg, #35c230 0%, #4ba27b 100%);\n "
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Let's see our updated app with the new green background color!"
  },
  {
    "name": "external-web-preview",
    "value": "index.html"
  },
  {
    "name": "author-speak-before",
    "value": "Excellent! Now let's test the external browser feature by visiting an external website to demonstrate the scroll offset functionality."
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! We've successfully tested all the new CodeVideo features: external web preview for our local files, editor scrolling to navigate through our CSS file, and color changes with preview updates. Our simple web app demonstrates how these features work together to create a smooth educational experience."
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
            allowFocusInEditor={false} // so arrow keys work for navigation, not for typing
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
            resolution="1080p"
          />
        </Box>
      </Flex>
    </Theme>
  )
}
