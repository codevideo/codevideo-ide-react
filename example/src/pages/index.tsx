import * as React from "react"
import { GUIMode, IAction, Project } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

const pythonExampleActions: Array<IAction> = [
  {
    "name": "file-explorer-create-file",
    "value": "Directory.Build.props"
  },
  {
    "name": "file-explorer-open-file",
    "value": "Directory.Build.props"
  },
  {
    "name": "editor-type",
    "value": "<Project>\n\t<PropertyGroup>\n\t\t<Copyright>Copyright 2025 (c) Full Stack Craft LLC</Copyright>\n    </PropertyGroup>\n</Project>"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "file-explorer-close-file",
    "value": "Directory.Build.Props"
  },
  {
    "name": "file-explorer-create-file",
    "value": "DirectoryBuildPropsTests.cs"
  },
  {
    "name": "file-explorer-open-file",
    "value": "DirectoryBuildPropsTests.cs"
  },
  {
    "name": "editor-type",
    "value": "public class DirectoryBuildPropsTests"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "{"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "We'll assume we're using Xunit, so I'll write in 'fact' here."
  },
  {
    "name": "editor-type",
    "value": "    [Fact]"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "And now for the main event! What I believe is an absolutely perfect unit test: checking that the copyright year in the DirectoryBuildProps is equal to the current year!"
  },
  {
    "name": "editor-type",
    "value": "    public void CopyrightYear_ShouldBeCurrentYear()"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "    {"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "        // Arrange"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "For arranging, we'll just read the directory props file as well as store a var for the actual current year."
  },
  {
    "name": "editor-type",
    "value": "        var filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, \"Directory.Build.props\");\n        var fileContent = File.ReadAllText(filePath);\n        var currentYear = DateTime.Now.Year.ToString();"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "        // Act"
  },
  {
    "name": "author-speak-before",
    "value": "And we'll get the year stored in the file via regex."
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "        var match = Regex.Match(fileContent, @\"<Copyright>.*?(\\d{4}).*?</Copyright>\");"
  },
  {
    "name": "editor-enter",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "        // Assert"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "If we don't even get a match, we'll log out a clear message - that the copyright tag couldn't be found."
  },
  {
    "name": "editor-type",
    "value": "        Assert.True(match.Success, \"Copyright tag not found\");"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "And the real import check, what we're all here for - to confirm that actual current year matches the year in our build props!"
  },
  {
    "name": "editor-type",
    "value": "        Assert.Equal(currentYear, match.Groups[1].Value);"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "    }"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "}"
  },
  {
    "name": "author-speak-before",
    "value": "Let's add all the imports we need now."
  },
  {
    "name": "editor-arrow-left",
    "value": "1"
  },
  {
    "name": "editor-arrow-up",
    "value": "18"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-enter",
    "value": "1"
  },
  {
    "name": "editor-arrow-up",
    "value": "2"
  },
  {
    "name": "editor-type",
    "value": "using System;\nusing System.IO;\nusing System.Text.RegularExpressions;\nusing Xunit;"
  },
  {
    "name": "author-speak-before",
    "value": "Wonderful! I love this as a unit test because it's definitely something everyone will forget. Something that is so small - and also only needs to be done once per year."
  },
  {
    "name": "author-speak-before",
    "value": "If this runs in a CI / CD, then the first build of the year will show you that you forgot to update the copyright! It's just perfect."
  }
]

const project: Project = {
  id: 'python',
  name: 'Python Print Example',
  description: 'Learn how to use print in Python',
  primaryLanguage: 'python',
  lessons: [
    {
      id: 'python',
      name: 'Python Print Example',
      description: 'Learn how to use print in Python',
      actions: pythonExampleActions
    }
  ]
};
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
      if (e.key === 'ArrowRight' && currentActionIndex < pythonExampleActions.length - 1) {
        setCurrentActionIndex(currentActionIndex + 1)
      } else if (e.key === 'ArrowLeft' && currentActionIndex > 0) {
        setCurrentActionIndex(currentActionIndex - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, currentActionIndex])


  const goToNextAction = () => {
    if (currentActionIndex < pythonExampleActions.length - 1) {
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
            // withCaptions={true}
            actionFinishedCallback={goToNextAction}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
