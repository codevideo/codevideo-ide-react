import * as React from "react"
import { GUIMode, IAction, IAudioItem, ILesson} from "@fullstackcraftllc/codevideo-types"
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

// const actions: Array<IAction> = [
//   {
//     "name": "author-speak-before",
//     "value": "This tutorial will show you how to generate PDFs from markdown using our docsascode generator tool. We'll create a markdown file, then a doc.yml file, and then run the generator."
//   },
//   {
//     "name": "file-explorer-create-file",
//     "value": "hello-world.md"
//   },
//   {
//     "name": "file-explorer-open-file",
//     "value": "hello-world.md"
//   },
//   {
//     "name": "author-speak-during",
//     "value": "First, let's create a markdown file with some sample content. Notice we can use any valid markdown: headings, code blocks, and more!"
//   },
//   {
//     "name": "editor-type",
//     "value": "# Hello World"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "This is a test of the `docsascode` generator."
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "Any standard markdown should work, including:"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "## Subtitles"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "### Subsubtitles"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "Inline `code` and **inline bold** text."
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "Code snippets:"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "```python"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "print(\"Hello World\")"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "```"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "and so on..."
//   },
//   {
//     "name": "editor-save",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-during",
//     "value": "Now let's create a doc.yml configuration file. This tells pandoc how to generate our PDF."
//   },
//   {
//     "name": "file-explorer-create-file",
//     "value": "doc.yml"
//   },
//   {
//     "name": "file-explorer-open-file",
//     "value": "doc.yml"
//   },
//   {
//     "name": "editor-type",
//     "value": "variables:"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "  title:  'My First Docsascode Generator PDF'"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "  subtitle: 'Courtesy Solve Innovation'"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "to: pdf"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "output-file: ./hello-world.pdf"
//   },
//   {
//     "name": "editor-enter",
//     "value": "2"
//   },
//   {
//     "name": "editor-type",
//     "value": "input-files:"
//   },
//   {
//     "name": "editor-enter",
//     "value": "1"
//   },
//   {
//     "name": "editor-type",
//     "value": "- hello-world.md"
//   },
//   {
//     "name": "editor-save",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-during",
//     "value": "Perfect! This config sets the title, specifies PDF output, and points to our markdown file."
//   },
//   {
//     "name": "terminal-open",
//     "value": "1"
//   },
//   {
//     "name": "author-speak-during",
//     "value": "Finally, let's run the generator using Docker. We'll mount our current directory and run the docsascode container."
//   },
//   {
//     "name": "terminal-type",
//     "value": "docker run --rm --volume \"$(pwd):/data\" -w /data/ registry.solve.ch/solve/documentation-tools/docsascode-generator:latest --defaults doc.yml"
//   },
//   {
//     "name": "terminal-enter",
//     "value": "1"
//   },
//   {
//     "name": "terminal-set-output",
//     "value": "Processing document...\n[LaTeX] Compiling PDF...\n[LaTeX] Processing markdown content...\n[LaTeX] Applying eisvogel template...\n[LaTeX] Document compilation successful!\nPDF generated: hello-world.pdf"
//   },
//   {
//     "name": "file-explorer-create-file",
//     "value": "hello-world.pdf"
//   },
//   {
//     "name": "author-speak-after",
//     "value": "Excellent! You've now generated a professional PDF from markdown. The docker flags ensure clean execution, file access, and proper cleanup."
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
    console.log('goToNextAction called, currentActionIndex:', currentActionIndex)
    if (currentActionIndex < project.actions.length - 1) {
      const nextIndex = currentActionIndex + 1
      console.log('Going to next action:', nextIndex)
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
            speakActionAudios={audioItems}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="green"
            resolution="1080p"
          />
        </Box>
      </Flex>
    </Theme>
  )
}
