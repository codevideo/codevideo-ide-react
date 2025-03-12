import * as React from "react"
import { GUIMode, IAction, Project } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useState } from "react";

const actions: Array<IAction> = [
  {
    "name": "author-speak-before",
    "value": "In this quick little lesson, I'd like to show you all about a small unit test I made which my colleagues made fun of me a little bit for, but I think is actually the perfect unit test for .NET"
  },
  {
    "name": "author-speak-before",
    "value": "In .NET, there's something known as the build directory props where you can set pretty long-lasting properties about your software, including properties like the software copyright."
  },
  {
    "name": "author-speak-before",
    "value": "So let's just create a little example of the directory build props file."
  },
  {
    "name": "file-explorer-create-file",
    "value": "Directory.Build.props"
  },
  {
    "name": "file-explorer-open-file",
    "value": "Directory.Build.props"
  },
  {
    "name": "author-speak-before",
    "value": "And I'll just write in the XML content into this file, including the copyright..."
  },
  {
    "name": "editor-type",
    "value": "<Project>\n\t<PropertyGroup>\n\t\t<Copyright>Copyright 2025 (c) Full Stack Craft LLC</Copyright>\n    </PropertyGroup>\n</Project>"
  },
  {
    "name": "author-speak-before",
    "value": "Of course this is a toy example; typically you have much more information in Directory.Build.props, but for the illustration of what the unit test will do, this is fine."
  },
  {
    "name": "author-speak-before",
    "value": "We can save and close that for now."
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
    "name": "author-speak-before",
    "value": "Now, to the actual unit test."
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
    "value": "We'll assume we're using X Unit, so I'll write in 'fact' here."
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
    "value": "And the real import check, what we're all here for - to confirm that the actual current year matches the year in our build props!"
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
    "value": "using System;\nusing System.IO;\nusing System.Text.RegularExpressions;\nusing XUnit;"
  },
  {
    "name": "author-speak-before",
    "value": "Wonderful! I love this as a unit test because, by definition, it's something that only needs to be updated once per year and therefore definitely something everyone will forget to do."
  },
  {
    "name": "author-speak-before",
    "value": "So, if this unit test runs in a CI / CD pipeline (and your unit tests always should!), then whoever is lucky enough to be the first to kick off the first pipeline of the year will see they forgot to update the copyright! It's just perfect!"
  }
]

export default function Record() {
  const [mode, setMode] = useState<GUIMode>('record')
  const [currentActionIndex, setCurrentActionIndex] = useState(30)

  // to continue to next action in replay mode, you need to implementation a function for the actionFinishedCallback prop
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
          {/* TODO, coming soon , need to pull some more stuff out of studio.codevideo.io */}
          <CodeVideoIDE
            theme='dark'
            project={actions}
            mode={mode}
            allowFocusInEditor={false}
            defaultLanguage={'python'}
            isExternalBrowserStepUrl={null}
            currentActionIndex={currentActionIndex}
            currentLessonIndex={0}
            // no need for sound playback
            isSoundOn={false}
            // captions may be helpful while recording
            withCaptions={true}
            actionFinishedCallback={goToNextAction}
            speakActionAudios={[]}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="green"
          />
        </Box>
      </Flex>
    </Theme>
  )
}
