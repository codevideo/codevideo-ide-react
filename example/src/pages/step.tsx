import * as React from "react"
import { GUIMode, IAction, ILesson } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// const actions: Array<IAction> = [
//   {
//     "name": "author-speak-before",
//     "value": "In this quick little lesson, I'd like to show you all about a small unit test I made which my colleagues made fun of me a little bit for, but I think is actually the perfect unit test for .NET"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "In .NET, there's something known as the build directory props where you can set pretty long-lasting properties about your software, including properties like the software copyright."
//   },
//   {
//     "name": "author-speak-before",
//     "value": "So let's just create a little example of the directory build props file."
//   },
//   {
//     "name": "file-explorer-create-file",
//     "value": "Directory.Build.props"
//   },
//   {
//     "name": "file-explorer-open-file",
//     "value": "Directory.Build.props"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "And I'll just write in the XML content into this file, including the copyright..."
//   },
//   {
//     "name": "editor-type",
//     "value": "<Project>\n\t<PropertyGroup>\n\t\t<Copyright>Copyright 2025 (c) Full Stack Craft LLC</Copyright>\n    </PropertyGroup>\n</Project>"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "Of course this is a toy example; typically you have much more information in Directory.Build.props, but for the illustration of what the unit test will do, this is fine."
//   },
//   {
//     "name": "author-speak-before",
//     "value": "We can save and close that for now."
//   },
//   {
//     "name": "editor-save",
//     "value": "1"
//   },
//   {
//     "name": "file-explorer-close-file",
//     "value": "Directory.Build.Props"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "Now, to the actual unit test."
//   },
//   {
//     "name": "file-explorer-create-file",
//     "value": "DirectoryBuildPropsTests.cs"
//   },
//   {
//     "name": "file-explorer-open-file",
//     "value": "DirectoryBuildPropsTests.cs"
//   },
//   {
//     "name": "editor-type",
//     "value": "public class DirectoryBuildPropsTests"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "{"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "We'll assume we're using X Unit, so I'll write in 'fact' here."
//   },
//   {
//     "name": "editor-type",
//     "value": "    [Fact]"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "And now for the main event! What I believe is an absolutely perfect unit test: checking that the copyright year in the DirectoryBuildProps is equal to the current year!"
//   },
//   {
//     "name": "editor-type",
//     "value": "    public void CopyrightYear_ShouldBeCurrentYear()"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "    {"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "        // Arrange"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "For arranging, we'll just read the directory props file as well as store a var for the actual current year."
//   },
//   {
//     "name": "editor-type",
//     "value": "        var filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, \"Directory.Build.props\");\n        var fileContent = File.ReadAllText(filePath);\n        var currentYear = DateTime.Now.Year.ToString();"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "        // Act"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "And we'll get the year stored in the file via regex."
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "        var match = Regex.Match(fileContent, @\"<Copyright>.*?(\\d{4}).*?</Copyright>\");"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "        // Assert"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "If we don't even get a match, we'll log out a clear message - that the copyright tag couldn't be found."
//   },
//   {
//     "name": "editor-type",
//     "value": "        Assert.True(match.Success, \"Copyright tag not found\");"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "And the real import check, what we're all here for - to confirm that the actual current year matches the year in our build props!"
//   },
//   {
//     "name": "editor-type",
//     "value": "        Assert.Equal(currentYear, match.Groups[1].Value);"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "    }"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "}"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "Let's add all the imports we need now."
//   },
//   {
//     "name": "editor-arrow-left",
//     "value": "1"
//   },
//   {
//     "name": "editor-arrow-up",
//     "value": "18"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-arrow-up",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "using System;\nusing System.IO;\nusing System.Text.RegularExpressions;\nusing XUnit;"
//   },
//   {
//     "name": "author-speak-before",
//     "value": "Wonderful! I love this as a unit test because, by definition, it's something that only needs to be updated once per year and therefore definitely something everyone will forget to do."
//   },
//   {
//     "name": "author-speak-before",
//     "value": "So, if this unit test runs in a CI / CD pipeline (and your unit tests always should!), then whoever is lucky enough to be the first to kick off the first pipeline of the year will see they forgot to update the copyright! It's just perfect!"
//   }
// ]



const project: ILesson = {
  "id": "typescript-mcp-lesson",
  "name": "Building an MCP Server with TypeScript",
  "description": "Learn how to create the same MCP server using TypeScript and Anthropic's official SDK",
  "actions": [
    {
      "name": "author-speak-before",
      "value": "In the previous lesson, we built our first MCP server using FastMCP in Python and successfully tested it with mcp-cli."
    },
    {
      "name": "author-speak-before",
      "value": "Now let's create the exact same functionality using TypeScript and Anthropic's official MCP SDK. First, we'll organize our project by moving the Python file into its own folder."
    },
    {
      "name": "author-speak-before",
      "value": "We can close this python file for now."
    },
    {
      "name": "mouse-move-editor-tab-close",
      "value": "hello_mcp.py"
    },
    {
      "name": "mouse-left-click",
      "value": "1"
    },
    {
      "name": "terminal-open",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "We'll make the folder with mkdir in the terminal."
    },
    {
      "name": "terminal-type",
      "value": "mkdir python"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "And move it into that folder."
    },
    {
      "name": "terminal-type",
      "value": "mv hello_mcp.py python/hello_mcp.py"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Now let's create a typescript folder to keep our TypeScript implementation organized."
    },
    {
      "name": "terminal-type",
      "value": "mkdir typescript"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-type",
      "value": "cd typescript"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Perfect! Now let's set up our TypeScript project. We'll start by initializing a new Node.js project."
    },
    {
      "name": "terminal-type",
      "value": "npm init -y"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "file-explorer-create-file",
      "value": "~/typescript/package.json"
    },
    {
      "name": "file-explorer-set-file-contents",
      "value": "~/typescript/package.json_____{\n  \"name\": \"hello-mcp-typescript\",\n  \"version\": \"1.0.0\",\n  \"type\": \"module\",\n  \"main\": \"build/index.js\",\n  \"bin\": {\n    \"hello-mcp-ts\": \"./build/index.js\"\n  },\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node build/index.js\"\n  },\n  \"dependencies\": {\n    \"@modelcontextprotocol/sdk\": \"^1.13.1\",\n    \"zod\": \"^3.22.4\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^22.10.5\",\n    \"typescript\": \"^5.7.2\"\n  }\n}"
    },
    {
      "name": "terminal-set-output",
      "value": "Wrote to package.json"
    },
    {
      "name": "author-speak-before",
      "value": "Now we'll install the Anthropic MCP SDK and TypeScript dependencies."
    },
    {
      "name": "terminal-type",
      "value": "npm install @modelcontextprotocol/sdk zod"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-set-output",
      "value": "added 15 packages, and audited 16 packages in 2s"
    },
    {
      "name": "terminal-type",
      "value": "npm install -D typescript @types/node"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-set-output",
      "value": "added 3 packages, and audited 19 packages in 1s"
    },
    {
      "name": "author-speak-before",
      "value": "Let's create our TypeScript configuration file."
    },
    {
      "name": "mouse-move-file-explorer-folder",
      "value": "typescript"
    },
    {
      "name": "mouse-right-click",
      "value": "1"
    },
    {
      "name": "mouse-move-file-explorer-folder-context-menu-new-file",
      "value": "1"
    },
    {
      "name": "mouse-left-click",
      "value": "1"
    },
    {
      "name": "file-explorer-type-new-file-input",
      "value": "tsconfig.json"
    },
    {
      "name": "file-explorer-enter-new-file-input",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"Node16\",\n    \"moduleResolution\": \"Node16\",\n    \"outDir\": \"./build\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true\n  },\n  \"include\": [\"src /**/*\"],\n  \"exclude\": [\"node_modules\"]\n}"
    },
    {
      "name": "editor-save",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Now let's create a source directory and our main TypeScript file."
    },
    {
      "name": "mouse-move-file-explorer-folder",
      "value": "typescript"
    },
    {
      "name": "mouse-right-click",
      "value": "1"
    },
    {
      "name": "mouse-move-file-explorer-folder-context-menu-new-folder",
      "value": "1"
    },
    {
      "name": "mouse-left-click",
      "value": "1"
    },
    {
      "name": "file-explorer-type-new-folder-input",
      "value": "src"
    },
    {
      "name": "file-explorer-enter-new-folder-input",
      "value": "1"
    },
    {
      "name": "mouse-move-file-explorer-folder",
      "value": "typescript/src"
    },
    {
      "name": "mouse-right-click",
      "value": "1"
    },
    {
      "name": "mouse-move-file-explorer-folder-context-menu-new-file",
      "value": "1"
    },
    {
      "name": "mouse-left-click",
      "value": "1"
    },
    {
      "name": "file-explorer-type-new-file-input",
      "value": "index.ts"
    },
    {
      "name": "file-explorer-enter-new-file-input",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Perfect! Now let's write our TypeScript MCP server. We'll start by importing the necessary modules from Anthropic's SDK."
    },
    {
      "name": "editor-type",
      "value": "import { McpServer } from \"@modelcontextprotocol/sdk/server/mcp.js\";"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "import { StdioServerTransport } from \"@modelcontextprotocol/sdk/server/stdio.js\";"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "import { z } from \"zod\";"
    },
    {
      "name": "editor-enter",
      "value": "2"
    },
    {
      "name": "author-speak-before",
      "value": "Next, we'll create our MCP server instance with the same 'hello' namespace we used in Python."
    },
    {
      "name": "editor-type",
      "value": "// 1. Create an MCP server with the same namespace"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "const server = new McpServer({"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  name: \"hello\","
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  version: \"1.0.0\""
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "});"
    },
    {
      "name": "editor-enter",
      "value": "2"
    },
    {
      "name": "author-speak-before",
      "value": "Now we'll register our greet tool using the same logic as our Python version. The TypeScript SDK uses registerTool method with Zod schema validation."
    },
    {
      "name": "editor-type",
      "value": "// 2. Register the same greet tool"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "server.registerTool("
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  \"greet\","
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  {"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "    title: \"Greeting Tool\","
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "    description: \"Return a friendly greeting\","
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "    inputSchema: {"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "      name: z.string().describe(\"Name to greet\")"
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
      "value": "  },"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  async ({ name }) => ({"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "    content: [{"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "      type: \"text\","
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "      text: `Hello, ${name}! 👋`"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "    }]"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  })"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": ");"
    },
    {
      "name": "editor-enter",
      "value": "2"
    },
    {
      "name": "author-speak-before",
      "value": "Finally, let's add the startup code that connects our server to the stdio transport, just like our Python version."
    },
    {
      "name": "editor-type",
      "value": "// 3. Start the server with stdio transport"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "async function main() {"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  const transport = new StdioServerTransport();"
    },
    {
      "name": "editor-enter",
      "value": "1"
    },
    {
      "name": "editor-type",
      "value": "  await server.connect(transport);"
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
      "name": "editor-enter",
      "value": "2"
    },
    {
      "name": "editor-type",
      "value": "main().catch(console.error);"
    },
    {
      "name": "author-speak-before",
      "value": "Excellent! Our TypeScript MCP server is complete. Let's save the file and then update our package.json to include build scripts."
    },
    {
      "name": "editor-save",
      "value": "1"
    },
    {
      "name": "mouse-move-file-explorer",
      "value": "1"
    },
    {
      "name": "mouse-left-click",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Now let's build our TypeScript project."
    },
    {
      "name": "terminal-type",
      "value": "npm run build"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-set-output",
      "value": "TypeScript compilation completed successfully"
    },
    {
      "name": "author-speak-before",
      "value": "Perfect! Now let's test our TypeScript MCP server the same way we tested the Python version."
    },
    {
      "name": "terminal-type",
      "value": "nohup npm start &"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-set-output",
      "value": "🚀 MCP server \"hello\" listening on STDIN/STDOUT"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Excellent! Our TypeScript server is now running. Let's test it with the exact same mcp-cli command we used before."
    },
    {
      "name": "terminal-open",
      "value": "1"
    },
    {
      "name": "terminal-type",
      "value": "echo '{ \"tool\": \"hello\", \"action\": \"greet\", \"params\": { \"name\": \"world\" } }' | npx mcp-cli call -"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "terminal-set-output",
      "value": "{ \"status\": \"ok\", \"result\": \"Hello, world! 👋\" }"
    },
    {
      "name": "terminal-enter",
      "value": "1"
    },
    {
      "name": "author-speak-before",
      "value": "Perfect! We've successfully recreated the exact same MCP server functionality using TypeScript and Anthropic's official SDK."
    },
    {
      "name": "author-speak-before",
      "value": "Let's compare what we just built. Both servers expose the same 'hello' namespace with a 'greet' action that returns identical responses. The key differences are in the implementation approach."
    },
    {
      "name": "author-speak-before",
      "value": "The Python version used FastMCP with decorators - a more pythonic approach where @mcp.tool automatically converts functions into tools."
    },
    {
      "name": "author-speak-before",
      "value": "The TypeScript version uses Anthropic's official SDK with explicit registration and Zod schema validation, giving you more control over input validation and response formatting."
    },
    {
      "name": "author-speak-before",
      "value": "Both approaches achieve the same goal: creating MCP servers that any compatible client can connect to. Whether you choose Python or TypeScript depends on your team's preferences and existing tech stack."
    },
    {
      "name": "author-speak-before",
      "value": "In our next lesson, we'll explore more advanced MCP capabilities like resources and prompts, and see how to add multiple tools to create more sophisticated AI integrations!"
    }
  ],
  "initialSnapshot": {
    "isUnsavedChangesDialogOpen": false,
    "unsavedFileName": "",
    "fileExplorerSnapshot": {
      "fileStructure": {
        "hello_mcp.py": {
          "type": "file",
          "content": "from fastmcp import FastMCP\n\n# 1. Instantiate a server and give our tool a namespace\nmcp = FastMCP(\"hello\")\n\n# 2. Expose a single action\n@mcp.tool\ndef greet(name: str) -> str:\n    \"\"\"Return a friendly greeting.\"\"\"\n    return f\"Hello,{name}! 👋\"\n\n# 3. Run with the built-in stdio transport (works with any client)\nif __name__ == \"__main__\":\n    mcp.run()",
          "language": "py",
          "caretPosition": {
            "row": 0,
            "col": 0
          }
        }
      },
      "isFileExplorerContextMenuOpen": false,
      "isFileContextMenuOpen": false,
      "isFolderContextMenuOpen": false,
      "isNewFileInputVisible": false,
      "isNewFolderInputVisible": false,
      "newFileInputValue": "",
      "newFolderInputValue": "",
      "isRenameFileInputVisible": false,
      "isRenameFolderInputVisible": false,
      "originalFileBeingRenamed": "",
      "originalFolderBeingRenamed": "",
      "renameFileInputValue": "",
      "renameFolderInputValue": "",
      "newFileParentPath": "",
      "newFolderParentPath": ""
    },
    "editorSnapshot": {
      "editors": [
        {
          "isActive": true,
          "filename": "hello_mcp.py",
          "content": "from fastmcp import FastMCP\n\n# 1. Instantiate a server and give our tool a namespace\nmcp = FastMCP(\"hello\")\n\n# 2. Expose a single action\n@mcp.tool\ndef greet(name: str) -> str:\n    \"\"\"Return a friendly greeting.\"\"\"\n    return f\"Hello,{name}! 👋\"\n\n# 3. Run with the built-in stdio transport (works with any client)\nif __name__ == \"__main__\":\n    mcp.run()",
          "caretPosition": {
            "row": 14,
            "col": 14
          },
          "highlightCoordinates": null,
          "isSaved": true
        }
      ],
      "isEditorContextMenuOpen": false
    },
    "terminalSnapshot": {
      "terminals": [
        {
          "content": ""
        }
      ]
    },
    "mouseSnapshot": {
      "location": "editor",
      "currentHoveredFileName": "",
      "currentHoveredFolderName": "",
      "currentHoveredEditorTabFileName": "",
      "x": 0,
      "y": 0,
      "timestamp": 0,
      "type": "move",
      "button": 0,
      "buttonStates": {
        "left": false,
        "right": false,
        "middle": false
      },
      "scrollPosition": {
        "x": 0,
        "y": 0
      },
      "scrollDelta": 0
    },
    "authorSnapshot": {
      "authors": [
        {
          "currentSpeechCaption": "In the next lesson, we'll see how to create the same server but using TypeScript with Anthropic's TypeScript SDK. See you there!"
        }
      ]
    }
  }
}

export default function Step() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  // on mount, ensure that currentActionIndex is set to 0
  useEffect(() => {
    setCurrentActionIndex(0)
    setMode('step')
  }, [])

  // in step mode, we can add some fancy keyboard shortcuts to navigate between actions
  // on mount, setup event listeners for left and right arrow keys - to navigate between actions
  useEffect(() => {
    if (mode !== 'step') {
      return
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentActionIndex < project.actions.length - 1) {
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
            // not needed in step mode
            actionFinishedCallback={() => {}}
            playBackCompleteCallback={() => {}}
            speakActionAudios={[]}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="green"
            resolution="1080p"
            showDevBox={false}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
