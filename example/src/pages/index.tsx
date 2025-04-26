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
    "value": "Hi everyone! In this tutorial, I'll guide you through creating your first Model Context Protocol (MCP) server. MCP allows you to build tools that Claude can use - think of it as creating custom plugins for Claude to enhance its capabilities!"
  },
  {
    "name": "external-browser",
    "value": "https://hackteam.io/blog/build-your-first-mcp-server-with-typescript-in-under-10-minutes/"
  },
  {
    "name": "external-browser",
    "value": "https://hackteam.io/blog/build-your-first-mcp-server-with-typescript-in-under-10-minutes/"
  },
  {
    "name": "author-speak-before",
    "value": "This post was heavily inspired by our friends over at hackteam.io - I've just updated it with the latest types as well as some other fun tidbits I've discovered along the way."
  },
  {
    "name": "author-speak-before",
    "value": "Let's create our first file - the package.json which will define our project dependencies."
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
    "value": "package.json"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-file",
    "value": "package.json"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "{\n  \"name\": \"mcp-server\",\n  \"version\": \"0.1.0\",\n  \"description\": \"A Model Context Protocol server example\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"bin\": {\n    \"mcp-server\": \"./build/index.js\"\n  },\n  \"files\": [\n    \"build\"\n  ],\n  \"scripts\": {\n    \"build\": \"tsc && node -e \\\"require('fs').chmodSync('build/index.js', '755')\\\"\",\n    \"prepare\": \"npm run build\",\n    \"watch\": \"tsc --watch\",\n    \"inspector\": \"npx @modelcontextprotocol/inspector build/index.js\"\n  },\n  \"dependencies\": {\n    \"@modelcontextprotocol/sdk\": \"0.6.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.11.24\",\n    \"typescript\": \"^5.3.3\"\n  }\n}"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Our package.json file specifies the project dependencies, including the MCP SDK and TypeScript. Next, let's create our TypeScript configuration file."
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
    "value": "tsconfig.json"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-file",
    "value": "tsconfig.json"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"Node16\",\n    \"moduleResolution\": \"Node16\",\n    \"outDir\": \"./build\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\"]\n}"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's install our dependencies using npm."
  },
  {
    "name": "mouse-move-terminal",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "terminal-type",
    "value": "npm install"
  },
  {
    "name": "terminal-enter",
    "value": "1"
  },
  {
    "name": "terminal-set-output",
    "value": "added 147 packages, and audited 148 packages in 3s\n\n32 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities"
  },
  {
    "name": "terminal-enter",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Great! Now we need to create our source directory and our main index.ts file that will contain our MCP server code."
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
    "name": "mouse-move-file-explorer-context-menu-new-folder",
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
    "value": "src"
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
    "name": "mouse-move-file-explorer-file",
    "value": "src/index.ts"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's add our boilerplate code to create a basic MCP server."
  },
  {
    "name": "editor-type",
    "value": "import { Server } from \"@modelcontextprotocol/sdk/server/index.js\";\nimport { StdioServerTransport } from \"@modelcontextprotocol/sdk/server/stdio.js\";\nimport {\n  CallToolRequestSchema,\n  ErrorCode,\n  ListToolsRequestSchema,\n  McpError,\n} from \"@modelcontextprotocol/sdk/types.js\";\n\nconst server = new Server({\n  name: \"mcp-server\",\n  version: \"1.0.0\",\n}, {\n  capabilities: {\n    tools: {}\n  }\n});\n\nserver.setRequestHandler(ListToolsRequestSchema, async () => {\n  return { tools: [] };\n});\n\nserver.setRequestHandler(CallToolRequestSchema, async (request) => {\n  if (request.params.name === \"name_of_tool\") {\n    return {};\n  }\n  throw new McpError(ErrorCode.MethodNotFound, \"Tool not found\");\n});\n\nconst transport = new StdioServerTransport();\nawait server.connect(transport);"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "This is the basic structure of an MCP server. Notice that we've used the correct ErrorCode.MethodNotFound instead of the deprecated ErrorCode.ToolNotFound. Next, let's implement a real tool that calculates the sum of two numbers."
  },
  {
    "name": "editor-command-left",
    "value": "1"
  },
  {
    "name": "editor-arrow-up",
    "value": "10"
  },
  {
    "name": "editor-arrow-down",
    "value": "4"
  },
  {
    "name": "editor-command-left",
    "value": "1"
  },
  {
    "name": "editor-shift+arrow-right",
    "value": "30"
  },
  {
    "name": "editor-delete-line",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "server.setRequestHandler(ListToolsRequestSchema, async () => {\n  return {\n    tools: [{\n      name: \"calculate_sum\",\n      description: \"Add two numbers together\",\n      inputSchema: {\n        type: \"object\",\n        properties: {\n          a: { type: \"number\" },\n          b: { type: \"number\" }\n        },\n        required: [\"a\", \"b\"]\n      }\n    }]\n  };\n});"
  },
  {
    "name": "editor-arrow-down",
    "value": "2"
  },
  {
    "name": "editor-command-left",
    "value": "1"
  },
  {
    "name": "editor-shift+arrow-right",
    "value": "100"
  },
  {
    "name": "editor-delete-line",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "server.setRequestHandler(CallToolRequestSchema, async (request) => {\n  if (request.params.name === \"calculate_sum\") {\n    const args = request.params.arguments as { a: number; b: number };\n    const { a, b } = args;\n    return { toolResult: a + b };\n  }\n  throw new McpError(ErrorCode.MethodNotFound, \"Tool not found\");\n});"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! Now let's build our MCP server to make sure everything compiles correctly."
  },
  {
    "name": "mouse-move-terminal",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
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
    "value": "> mcp-server@0.1.0 build\n> tsc && node -e \"require('fs').chmodSync('build/index.js', '755')\"\n\nExecutable build/index.js is now ready for use."
  },
  {
    "name": "author-speak-before",
    "value": "Great! Our MCP server has been built successfully. Now we need to tell Claude Desktop about our MCP server by updating the configuration file. Let's create a helpful alias to make this easier in the future."
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
    "value": ".zprofile"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-file",
    "value": ".zprofile"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "alias claudedesktopconfig='code /Users/chris/Library/Application\\ Support/Claude/claude_desktop_config.json'"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "We've created an alias that lets us easily open the Claude Desktop config file. Now just for illustration, let's create a sample config file that we'd use to integrate our MCP server with Claude Desktop."
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
    "value": "claude_desktop_config.json"
  },
  {
    "name": "file-explorer-enter-new-file-input",
    "value": "1"
  },
  {
    "name": "mouse-move-file-explorer-file",
    "value": "claude_desktop_config.json"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "editor-type",
    "value": "{\n  \"mcpServers\": {\n    \"mcp-server\": {\n      \"command\": \"node\",\n      \"args\": [\n        \"/Users/chris/playground/mcp-servermcp-server/build/index.js\"\n      ]\n    }\n  }\n}"
  },
  {
    "name": "editor-save",
    "value": "1"
  },
  {
    "name": "author-speak-before",
    "value": "This configuration file tells Claude Desktop about our MCP server. You'll need to replace 'YOUR_USER' with your actual username. With our .zprofile alias, we can easily update this configuration whenever needed."
  },
  {
    "name": "author-speak-before",
    "value": "Let's see what happens when we open the Claude Desktop configuration file using our alias."
  },
  {
    "name": "mouse-move-terminal",
    "value": "1"
  },
  {
    "name": "mouse-left-click",
    "value": "1"
  },
  {
    "name": "terminal-type",
    "value": "source ~/.zprofile"
  },
  {
    "name": "terminal-enter",
    "value": "1"
  },
  {
    "name": "terminal-type",
    "value": "claudedesktopconfig"
  },
  {
    "name": "terminal-enter",
    "value": "1"
  },
  {
    "name": "terminal-set-output",
    "value": "Opening Claude Desktop configuration in VS Code..."
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! Now whenever we need to update our Claude Desktop configuration, we can just use this alias to quickly open the file in VS Code."
  },
  {
    "name": "author-speak-before",
    "value": "Once you've restarted Claude Desktop, you'll be able to see your MCP tool. When you ask a question like 'What is the sum of 9999 + 1?', Claude will find your tool and ask for permission to use it."
  },
  {
    "name": "external-browser",
    "value": "{\"title\": \"Claude Desktop - Calculate Sum Tool\", \"content\": \"<div style='font-family: sans-serif; padding: 20px;'><h2>Tool Use Confirmation</h2><p>Claude wants to use the 'calculate_sum' tool from 'mcp-server'.</p><p>Arguments: { a: 9999, b: 1 }</p><div style='display: flex; gap: 10px; margin-top: 20px;'><button style='padding: 8px 16px; background: #5555ff; color: white; border: none; border-radius: 4px;'>Allow</button><button style='padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px;'>Deny</button></div></div>\"}"
  },
  {
    "name": "author-speak-after",
    "value": "After you grant permission, Claude will use your tool to calculate the sum and provide the answer (10000) in the chat."
  },
  {
    "name": "author-speak-before",
    "value": "And that's it! You've successfully created your first MCP server with a custom tool that Claude can use. You can expand on this by adding more tools with different capabilities."
  },
  {
    "name": "author-speak-before",
    "value": "Some ideas for tools you might want to implement:"
  },
  {
    "name": "author-speak-before",
    "value": "1. A weather tool that fetches current weather data for a given location"
  },
  {
    "name": "author-speak-before",
    "value": "2. A currency converter that converts between different currencies"
  },
  {
    "name": "author-speak-before",
    "value": "3. A database query tool that can fetch or store information"
  },
  {
    "name": "author-speak-before",
    "value": "4. A file system tool that can read or write files on your computer"
  },
  {
    "name": "author-speak-before",
    "value": "Remember, MCP is a powerful way to extend Claude's capabilities with custom tools. Happy coding!"
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
