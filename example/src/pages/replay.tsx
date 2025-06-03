import * as React from "react"
import { GUIMode, IAction, IAudioItem} from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// currently, audio manifests can be generated from codevideo-backend-engine npm run generate-audio-manifest
const audioItems: Array<IAudioItem> = [
  // {
  //   "text": "In this quick little lesson, I'd like to show you all about a small unit test I made which my colleagues made fun of me a little bit for, but I think is actually the perfect unit test for .NET",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/0b60d878fd11fcbce04cac74c5e62a503a9624319e76f8e0c21eda5d13202723.mp3"
  // },
  // {
  //   "text": "In .NET, there's something known as the build directory props where you can set pretty long-lasting properties about your software, including properties like the software copyright.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/8cf25b5171cd80ec0961b25d76eea8fad9372b406d50e69f19bfbb47e6c282ea.mp3"
  // },
  // {
  //   "text": "So let's just create a little example of the directory build props file.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/43543e58846d57a4d8a93c90c3a261af6f303800bf0eacfc7cd9836e474d48e9.mp3"
  // },
  // {
  //   "text": "And I'll just write in the XML content into this file, including the copyright...",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/6433c9cb8d7c1c8a87407af404db315caf97e5076951cd0dba73bcc6c9165b98.mp3"
  // },
  // {
  //   "text": "Of course this is a toy example; typically you have much more information in Directory.Build.props, but for the illustration of what the unit test will do, this is fine.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/9b9b6957586e67039920add57dab8b6b29d7e40a4492c4d51f3f2b9156148956.mp3"
  // },
  // {
  //   "text": "We can save and close that for now.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/0ef9e41394eddbc24eb6f7d0a45cc0fdf17c9f70ce00fd38091506e12d569d3f.mp3"
  // },
  // {
  //   "text": "Now, to the actual unit test.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/891509df2c78fb6e1c09c56c02be1059f19c128b1354662ebd395315cb96d677.mp3"
  // },
  // {
  //   "text": "We'll assume we're using X Unit, so I'll write in 'fact' here.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/bb31ef11381e77aa18a1b00c05d964057ecbe5ac16f53f44442f8ebfd42d4a81.mp3"
  // },
  // {
  //   "text": "And now for the main event! What I believe is an absolutely perfect unit test: checking that the copyright year in the DirectoryBuildProps is equal to the current year!",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/6109f808bedf34837e2e9a12e4eaa254de5247f2dd43bc4d24dc3a2c10f2d613.mp3"
  // },
  // {
  //   "text": "For arranging, we'll just read the directory props file as well as store a var for the actual current year.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/b596b7f96a1ddf11511f30234efc2c47fc5a4d0bd5cbea09eda9f3ecdce38742.mp3"
  // },
  // {
  //   "text": "And we'll get the year stored in the file via regex.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/302991497cac6b7d900f66baacb54f8afe2ba1ca9895c5111d841d6a8475379d.mp3"
  // },
  // {
  //   "text": "If we don't even get a match, we'll log out a clear message - that the copyright tag couldn't be found.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/6a45bb3af47c37958fb7595d0bff8dbff121e397ce79da1b028fe7ad1f49e3cd.mp3"
  // },
  // {
  //   "text": "And the real import check, what we're all here for - to confirm that the actual current year matches the year in our build props!",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/2f1267dc498f8365af4c44234cb1510a4743de0e91f80b83a4fc9d3a3a370eb2.mp3"
  // },
  // {
  //   "text": "Let's add all the imports we need now.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/2d1201805e26a75624c44742c39033169c1adfd86c0a9f2b1c8fd868025e21b3.mp3"
  // },
  // {
  //   "text": "Wonderful! I love this as a unit test because, by definition, it's something that only needs to be updated once per year and therefore definitely something everyone will forget to do.",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/594557e434ebc9610632a835de4273659e2a5aaa4ce93471ebb789133e19bf9f.mp3"
  // },
  // {
  //   "text": "So, if this unit test runs in a CI / CD pipeline (and your unit tests always should!), then whoever is lucky enough to be the first to kick off the first pipeline of the year will see they forgot to update the copyright! It's just perfect!",
  //   "mp3Url": "https://coffee-app.sfo2.cdn.digitaloceanspaces.com/codevideo/audio/6fee98f279cbc10524105005906f2f6958906b382681c850541d5c709e080c5a.mp3"
  // }
]

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

export default function Replay() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  // on user interaction, set mode to 'replay' and reset the current action index
  const [userInteracted, setUserInteracted] = useState(false)

  // Handle user interaction - can't replay with sound without user interaction
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
  // to continue to next action in replay mode
  const goToNextAction = () => {
    if (currentActionIndex < actions.length - 1) {
      const nextIndex = currentActionIndex + 1
      setCurrentActionIndex(nextIndex)
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
            isSoundOn={true}
            // if you're using CodeVideo to record a video for something like youtube, captions may not be a good idea
            // if you're exporting a video to your own site, captions might be really nice!
            // for this example we assume the youtube use case
            withCaptions={false}
            actionFinishedCallback={goToNextAction}
            // this example has audios! see codevideo-backend-engine, command: `npm run generate-audio-manifest <your actions json or ts file here> elevenlabs`
            speakActionAudios={audioItems}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="green"
          />
        </Box>
      </Flex>
    </Theme>
  )
}
