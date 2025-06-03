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
    "value": "This tutorial will show you how to generate PDFs from markdown using our docsascode generator tool. We'll create a markdown file, then a doc.yml file, and then run the generator."
  },
  {
    "name": "file-explorer-create-file",
    "value": "hello-world.md"
  },
  {
    "name": "file-explorer-open-file",
    "value": "hello-world.md"
  },
  {
    "name": "author-speak-during",
    "value": "First, let's create a markdown file with some sample content. Notice we can use any valid markdown: headings, code blocks, and more!"
  },
  {
    "name": "editor-type",
    "value": "# Hello World"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "This is a test of the `docsascode` generator."
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "Any standard markdown should work, including:"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "## Subtitles"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "### Subsubtitles"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "Inline `code` and **inline bold** text."
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "Code snippets:"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "```python"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "print(\"Hello World\")"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "```"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "and so on..."
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-during",
    "value": "Now let's create a doc.yml configuration file. This tells pandoc how to generate our PDF."
  },
  {
    "name": "file-explorer-create-file",
    "value": "doc.yml"
  },
  {
    "name": "file-explorer-open-file",
    "value": "doc.yml"
  },
  {
    "name": "editor-type",
    "value": "variables:"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "  title:  'My First Docsascode Generator PDF'"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "  subtitle: 'Courtesy Solve Innovation'"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "to: pdf"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "output-file: ./hello-world.pdf"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "input-files:"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "- hello-world.md"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-during",
    "value": "Perfect! This config sets the title, specifies PDF output, and points to our markdown file."
  },
  {
    "name": "terminal-open",
    "value": "1"
  },
  {
    "name": "author-speak-during",
    "value": "Finally, let's run the generator using Docker. We'll mount our current directory and run the docsascode container."
  },
  {
    "name": "terminal-type",
    "value": "docker run --rm --volume \"$(pwd):/data\" -w /data/ registry.solve.ch/solve/documentation-tools/docsascode-generator:latest --defaults doc.yml"
  },
  {
    "name": "terminal-enter",
    "value": "1"
  },
  {
    "name": "terminal-set-output",
    "value": "Processing document...\n[LaTeX] Compiling PDF...\n[LaTeX] Processing markdown content...\n[LaTeX] Applying eisvogel template...\n[LaTeX] Document compilation successful!\nPDF generated: hello-world.pdf"
  },
  {
    "name": "file-explorer-create-file",
    "value": "hello-world.pdf"
  },
  {
    "name": "author-speak-after",
    "value": "Excellent! You've now generated a professional PDF from markdown. The docker flags ensure clean execution, file access, and proper cleanup."
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
          />
        </Box>
      </Flex>
    </Theme>
  )
}
