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
    "value": "Hi everyone! Today we're going to build two incredibly powerful MCP tools that will transform how you work with Claude Desktop. These tools essentially give you Claude Code functionality for free. We'll be creating 'list_repo_locations' - a smart repository finder using fuzzy matching, and 'issue_terminal_command' - a controlled terminal execution tool. By the end of this lesson, you'll have your own customizable versions of these game-changing tools!"
  },
  {
    "name": "author-speak-before",
    "value": "Let's start by creating our project structure. We'll need a directory for our MCP tools with separate folders for tools and utilities."
  },
  {
    "name": "file-explorer-create-folder",
    "value": "src"
  },
  {
    "name": "file-explorer-create-folder",
    "value": "src/tools"
  },
  {
    "name": "file-explorer-create-folder",
    "value": "src/utils"
  },
  {
    "name": "author-speak-before",
    "value": "Let's create our first MCP tool - the repository location finder. This tool will use fuzzy matching to help Claude intelligently navigate your codebases."
  },
  {
    "name": "file-explorer-create-file",
    "value": "src/tools/list_repo_locations.ts"
  },
  {
    "name": "file-explorer-open-file",
    "value": "src/tools/list_repo_locations.ts"
  },
  {
    "name": "editor-type",
    "value": `// We'll organize repos by environment for different projects
`
  },
  {
    "name": "editor-type",
    "value": "const workRepoMap: Array<{ keywords: string[], repoPath: string}> = [\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywords: [\"main-project\", \"core\", \"backend\"],\n"
  },
  {
    "name": "editor-type",
    "value": "        repoPath: \"/Users/yourname/work/main-project\"\n"
  },
  {
    "name": "editor-type",
    "value": "    },\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywords: [\"documentation\", \"docs\", \"wiki\"],\n"
  },
  {
    "name": "editor-type",
    "value": "        repoPath: \"/Users/yourname/work/documentation\"\n"
  },
  {
    "name": "editor-type",
    "value": "    },\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywords: [\"frontend\", \"ui\", \"client\"],\n"
  },
  {
    "name": "editor-type",
    "value": "        repoPath: \"/Users/yourname/work/frontend\"\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": "];\n\n"
  },
  {
    "name": "editor-type",
    "value": "const personalRepoMap: Array<{ keywords: string[], repoPath: string}> = [\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywords: [\"blog\", \"website\", \"personal-site\"],\n"
  },
  {
    "name": "editor-type",
    "value": "        repoPath: \"/Users/yourname/personal/blog\"\n"
  },
  {
    "name": "editor-type",
    "value": "    },\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywords: [\"side-project\", \"experiment\"],\n"
  },
  {
    "name": "editor-type",
    "value": "        repoPath: \"/Users/yourname/personal/side-project\"\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": "];\n\n"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's implement the main function that does the fuzzy matching. Notice how we provide helpful hints and suggestions when exact matches aren't found - this makes the tool much more conversational and user-friendly."
  },
  {
    "name": "editor-type",
    "value": "export const listRepoLocations = async (environment: string, keyword: string) => {\n"
  },
  {
    "name": "editor-type",
    "value": "    const keywordLower = keyword.toLowerCase();\n"
  },
  {
    "name": "editor-type",
    "value": "    let keywordRepoMap: Array<{ keywords: string[], repoPath: string}> = [];\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Select the right environment\n"
  },
  {
    "name": "editor-type",
    "value": "    if (environment === \"work\") {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywordRepoMap = workRepoMap;\n"
  },
  {
    "name": "editor-type",
    "value": "    } else if (environment === \"personal\") {\n"
  },
  {
    "name": "editor-type",
    "value": "        keywordRepoMap = personalRepoMap;\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // First, try exact or substring matches\n"
  },
  {
    "name": "editor-type",
    "value": "    const exactMatches = keywordRepoMap.filter(repo => \n"
  },
  {
    "name": "editor-type",
    "value": "        repo.keywords.some(kw => kw.toLowerCase().includes(keywordLower))\n"
  },
  {
    "name": "editor-type",
    "value": "    );\n\n"
  },
  {
    "name": "editor-type",
    "value": "    if (exactMatches.length > 0) {\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: `Found matching repo(s): ${exactMatches.map(repo => repo.repoPath).join(\", \")}`\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: false\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // If no exact matches, use fuzzy matching\n"
  },
  {
    "name": "editor-type",
    "value": "    const DISTANCE_THRESHOLD = 3; // This is where the NLP magic happens!\n"
  },
  {
    "name": "editor-type",
    "value": "    const fuzzyMatches: Array<{repo: typeof keywordRepoMap[0], keyword: string, distance: number}> = [];\n\n"
  },
  {
    "name": "editor-type",
    "value": "    for (const repo of keywordRepoMap) {\n"
  },
  {
    "name": "editor-type",
    "value": "        for (const kw of repo.keywords) {\n"
  },
  {
    "name": "editor-type",
    "value": "            const distance = levenshteinDistance(keywordLower, kw.toLowerCase());\n"
  },
  {
    "name": "editor-type",
    "value": "            if (distance <= DISTANCE_THRESHOLD) {\n"
  },
  {
    "name": "editor-type",
    "value": "                fuzzyMatches.push({repo, keyword: kw, distance});\n"
  },
  {
    "name": "editor-type",
    "value": "            }\n"
  },
  {
    "name": "editor-type",
    "value": "        }\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Sort by distance (closest matches first)\n"
  },
  {
    "name": "editor-type",
    "value": "    fuzzyMatches.sort((a, b) => a.distance - b.distance);\n\n"
  },
  {
    "name": "editor-type",
    "value": "    if (fuzzyMatches.length > 0) {\n"
  },
  {
    "name": "editor-type",
    "value": "        const suggestions = fuzzyMatches\n"
  },
  {
    "name": "editor-type",
    "value": "            .slice(0, 5)\n"
  },
  {
    "name": "editor-type",
    "value": "            .map(match => `${match.keyword} (${match.repo.repoPath})`)\n"
  },
  {
    "name": "editor-type",
    "value": "            .join(\", \");\n\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: `No exact matches found for '${keyword}'. Did you mean: ${suggestions}?`\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: true\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Final fallback with full context - still being helpful!\n"
  },
  {
    "name": "editor-type",
    "value": "    return {\n"
  },
  {
    "name": "editor-type",
    "value": "        content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "            type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "            text: `No matching repo found for '${keyword}'. Available keywords: ${keywordRepoMap.map(repo => repo.keywords.join(\", \")).join(\"; \")}`\n"
  },
  {
    "name": "editor-type",
    "value": "        }],\n"
  },
  {
    "name": "editor-type",
    "value": "        isError: true\n"
  },
  {
    "name": "editor-type",
    "value": "    };\n"
  },
  {
    "name": "editor-type",
    "value": "};"
  },
  {
    "name": "author-speak-before",
    "value": "Let's go back up to the top of this file and import our levenshteinDistance function that we'll need."
  },
  {
    "name": "editor-arrow-up",
    "value": "1000"
  },
  {
    "name": "editor-type",
    "value": "import { levenshteinDistance } from \"../utils/levenshteinDistance.js\";\n\n"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Let's create our utility function for fuzzy matching. We'll implement the Levenshtein distance algorithm which is crucial for making our tools feel more natural and human-friendly."
  },
  {
    "name": "file-explorer-create-file",
    "value": "src/utils/levenshteinDistance.ts"
  },
  {
    "name": "file-explorer-open-file",
    "value": "src/utils/levenshteinDistance.ts"
  },
  {
    "name": "editor-type",
    "value": "// This algorithm calculates the minimum number of edits to transform one string to another\n"
  },
  {
    "name": "editor-type",
    "value": "export function levenshteinDistance(str1: string, str2: string): number {\n"
  },
  {
    "name": "editor-type",
    "value": "    const m = str1.length;\n"
  },
  {
    "name": "editor-type",
    "value": "    const n = str2.length;\n"
  },
  {
    "name": "editor-type",
    "value": "    const matrix: number[][] = [];\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Initialize matrix\n"
  },
  {
    "name": "editor-type",
    "value": "    for (let i = 0; i <= m; i++) {\n"
  },
  {
    "name": "editor-type",
    "value": "        matrix[i] = [i];\n"
  },
  {
    "name": "editor-type",
    "value": "        for (let j = 1; j <= n; j++) {\n"
  },
  {
    "name": "editor-type",
    "value": "            matrix[0][j] = j;\n"
  },
  {
    "name": "editor-type",
    "value": "        }\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Calculate distance\n"
  },
  {
    "name": "editor-type",
    "value": "    for (let i = 1; i <= m; i++) {\n"
  },
  {
    "name": "editor-type",
    "value": "        for (let j = 1; j <= n; j++) {\n"
  },
  {
    "name": "editor-type",
    "value": "            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;\n"
  },
  {
    "name": "editor-type",
    "value": "            matrix[i][j] = Math.min(\n"
  },
  {
    "name": "editor-type",
    "value": "                matrix[i - 1][j] + 1,     // deletion\n"
  },
  {
    "name": "editor-type",
    "value": "                matrix[i][j - 1] + 1,     // insertion\n"
  },
  {
    "name": "editor-type",
    "value": "                matrix[i - 1][j - 1] + cost // substitution\n"
  },
  {
    "name": "editor-type",
    "value": "            );\n"
  },
  {
    "name": "editor-type",
    "value": "        }\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    return matrix[m][n];\n"
  },
  {
    "name": "editor-type",
    "value": "}"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Excellent! Now let's create our second tool - the terminal command executor. This tool provides a safe way for Claude to execute terminal commands with proper security guardrails."
  },
  {
    "name": "file-explorer-create-file",
    "value": "issue_terminal_command.ts"
  },
  {
    "name": "file-explorer-open-file",
    "value": "issue_terminal_command.ts"
  },
  {
    "name": "editor-type",
    "value": "import { exec } from 'child_process';\n"
  },
  {
    "name": "editor-type",
    "value": "import { promisify } from 'util';\n\n"
  },
  {
    "name": "editor-type",
    "value": "// Safety first - toggle this to control read-only mode\n"
  },
  {
    "name": "editor-type",
    "value": "const READ_ONLY_MODE = true;\n\n"
  },
  {
    "name": "editor-type",
    "value": "// List of allowed commands (read-only operations)\n"
  },
  {
    "name": "editor-type",
    "value": "const ALLOWED_COMMANDS = [\n"
  },
  {
    "name": "editor-type",
    "value": "    'ls', 'dir', 'cat', 'head', 'tail', 'grep',\n"
  },
  {
    "name": "editor-type",
    "value": "    'pwd', 'echo', 'date', 'whoami', 'df', 'du', 'ps',\n"
  },
  {
    "name": "editor-type",
    "value": "    'wc', 'which', 'whereis', 'type', 'file', 'uname',\n"
  },
  {
    "name": "editor-type",
    "value": "    'history', 'env', 'printenv', 'git', 'cd', 'find'\n"
  },
  {
    "name": "editor-type",
    "value": "];\n\n"
  },
  {
    "name": "editor-type",
    "value": "export const issueTerminalCommand = async (command: string) => {\n"
  },
  {
    "name": "editor-type",
    "value": "    // Extract the base command (first word)\n"
  },
  {
    "name": "editor-type",
    "value": "    const baseCommand = command.trim().split(/\\s+/)[0];\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Special handling for problematic commands\n"
  },
  {
    "name": "editor-type",
    "value": "    if (baseCommand === 'find') {\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: `Warning: The 'find' command can be slow on large directories. Consider using 'ls' or 'tree' for specific directories instead.`\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: false\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "author-speak-before",
    "value": "Notice how we're implementing security checks that still provide helpful feedback. Instead of just saying 'no', we're explaining why and suggesting alternatives."
  },
  {
    "name": "editor-type",
    "value": "    // Security check with helpful error messages\n"
  },
  {
    "name": "editor-type",
    "value": "    if (READ_ONLY_MODE && !ALLOWED_COMMANDS.includes(baseCommand)) {\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: `Error: Command '${baseCommand}' is not allowed in read-only mode. Allowed commands: ${ALLOWED_COMMANDS.join(', ')}`\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: true\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    // Execute the command\n"
  },
  {
    "name": "editor-type",
    "value": "    try {\n"
  },
  {
    "name": "editor-type",
    "value": "        const execPromise = promisify(exec);\n"
  },
  {
    "name": "editor-type",
    "value": "        const { stdout, stderr } = await execPromise(command);\n\n"
  },
  {
    "name": "editor-type",
    "value": "        if (stderr) {\n"
  },
  {
    "name": "editor-type",
    "value": "            return {\n"
  },
  {
    "name": "editor-type",
    "value": "                content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                    type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                    text: `Error: ${stderr}`\n"
  },
  {
    "name": "editor-type",
    "value": "                }],\n"
  },
  {
    "name": "editor-type",
    "value": "                isError: true\n"
  },
  {
    "name": "editor-type",
    "value": "            };\n"
  },
  {
    "name": "editor-type",
    "value": "        }\n\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: stdout\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: false\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    } catch (error: any) {\n"
  },
  {
    "name": "editor-type",
    "value": "        return {\n"
  },
  {
    "name": "editor-type",
    "value": "            content: [{\n"
  },
  {
    "name": "editor-type",
    "value": "                type: \"text\",\n"
  },
  {
    "name": "editor-type",
    "value": "                text: `Error executing command: ${error.message}`\n"
  },
  {
    "name": "editor-type",
    "value": "            }],\n"
  },
  {
    "name": "editor-type",
    "value": "            isError: true\n"
  },
  {
    "name": "editor-type",
    "value": "        };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": "};"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's create the main MCP server file that registers our tools and handles the requests. This is where we wire everything together."
  },
  {
    "name": "file-explorer-set-present-working-directory",
    "value": "/Users/dev/mcp-tools/src"
  },
  {
    "name": "file-explorer-create-file",
    "value": "index.ts"
  },
  {
    "name": "file-explorer-open-file",
    "value": "index.ts"
  },
  {
    "name": "editor-type",
    "value": "import { Server } from '@modelcontextprotocol/sdk/server/index.js';\n"
  },
  {
    "name": "editor-type",
    "value": "import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n"
  },
  {
    "name": "editor-type",
    "value": "import {\n"
  },
  {
    "name": "editor-type",
    "value": "    ListToolsRequestSchema,\n"
  },
  {
    "name": "editor-type",
    "value": "    CallToolRequestSchema,\n"
  },
  {
    "name": "editor-type",
    "value": "    McpError,\n"
  },
  {
    "name": "editor-type",
    "value": "    ErrorCode\n"
  },
  {
    "name": "editor-type",
    "value": "} from '@modelcontextprotocol/sdk/types.js';\n\n"
  },
  {
    "name": "editor-type",
    "value": "import { listRepoLocations } from './tools/list_repo_locations.js';\n"
  },
  {
    "name": "editor-type",
    "value": "import { issueTerminalCommand } from './tools/issue_terminal_command.js';\n\n"
  },
  {
    "name": "editor-type",
    "value": "const server = new Server(\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        name: 'mcp-dev-tools',\n"
  },
  {
    "name": "editor-type",
    "value": "        version: '0.1.0',\n"
  },
  {
    "name": "editor-type",
    "value": "    },\n"
  },
  {
    "name": "editor-type",
    "value": "    {\n"
  },
  {
    "name": "editor-type",
    "value": "        capabilities: {\n"
  },
  {
    "name": "editor-type",
    "value": "            tools: {},\n"
  },
  {
    "name": "editor-type",
    "value": "        },\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": ");\n\n"
  },
  {
    "name": "author-speak-before",
    "value": "Let's set up the tool registration. This is where we define the interface that Claude will use to interact with our tools."
  },
  {
    "name": "editor-type",
    "value": "server.setRequestHandler(ListToolsRequestSchema, async () => {\n"
  },
  {
    "name": "editor-type",
    "value": "    return {\n"
  },
  {
    "name": "editor-type",
    "value": "        tools: [\n"
  },
  {
    "name": "editor-type",
    "value": "            {\n"
  },
  {
    "name": "editor-type",
    "value": "                name: \"list_repo_locations\",\n"
  },
  {
    "name": "editor-type",
    "value": "                description: \"Given a keyword, returns the relevant repo path based on the keyword provided. If no matching keyword is found, it gives context of the nearest matches.\",\n"
  },
  {
    "name": "editor-type",
    "value": "                inputSchema: {\n"
  },
  {
    "name": "editor-type",
    "value": "                    type: \"object\",\n"
  },
  {
    "name": "editor-type",
    "value": "                    properties: {\n"
  },
  {
    "name": "editor-type",
    "value": "                        keyword: { type: \"string\" },\n"
  },
  {
    "name": "editor-type",
    "value": "                    },\n"
  },
  {
    "name": "editor-type",
    "value": "                    required: [\"keyword\"]\n"
  },
  {
    "name": "editor-type",
    "value": "                }\n"
  },
  {
    "name": "editor-type",
    "value": "            },\n"
  },
  {
    "name": "editor-type",
    "value": "            {\n"
  },
  {
    "name": "editor-type",
    "value": "                name: \"issue_terminal_command\",\n"
  },
  {
    "name": "editor-type",
    "value": "                description: \"Executes a terminal command and returns the result.\",\n"
  },
  {
    "name": "editor-type",
    "value": "                inputSchema: {\n"
  },
  {
    "name": "editor-type",
    "value": "                    type: \"object\",\n"
  },
  {
    "name": "editor-type",
    "value": "                    properties: {\n"
  },
  {
    "name": "editor-type",
    "value": "                        command: { type: \"string\" },\n"
  },
  {
    "name": "editor-type",
    "value": "                    },\n"
  },
  {
    "name": "editor-type",
    "value": "                    required: [\"command\"]\n"
  },
  {
    "name": "editor-type",
    "value": "                }\n"
  },
  {
    "name": "editor-type",
    "value": "            }\n"
  },
  {
    "name": "editor-type",
    "value": "        ]\n"
  },
  {
    "name": "editor-type",
    "value": "    };\n"
  },
  {
    "name": "editor-type",
    "value": "});\n\n"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's implement the tool call handler. This is the brain of our MCP server that routes tool calls to the appropriate functions."
  },
  {
    "name": "editor-type",
    "value": "server.setRequestHandler(CallToolRequestSchema, async (request) => {\n"
  },
  {
    "name": "editor-type",
    "value": "    if (request.params.name === \"list_repo_locations\") {\n"
  },
  {
    "name": "editor-type",
    "value": "        const args = request.params.arguments as { keyword: string };\n"
  },
  {
    "name": "editor-type",
    "value": "        const { keyword } = args;\n"
  },
  {
    "name": "editor-type",
    "value": "        // You can configure environment via process.env\n"
  },
  {
    "name": "editor-type",
    "value": "        const environment = process.env.MCP_ENVIRONMENT || \"work\";\n"
  },
  {
    "name": "editor-type",
    "value": "        return { toolResult: await listRepoLocations(environment, keyword) };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": "    else if (request.params.name === \"issue_terminal_command\") {\n"
  },
  {
    "name": "editor-type",
    "value": "        const args = request.params.arguments as { command: string };\n"
  },
  {
    "name": "editor-type",
    "value": "        const { command } = args;\n"
  },
  {
    "name": "editor-type",
    "value": "        return { toolResult: await issueTerminalCommand(command) };\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n\n"
  },
  {
    "name": "editor-type",
    "value": "    throw new McpError(ErrorCode.MethodNotFound, \"Tool not found\");\n"
  },
  {
    "name": "editor-type",
    "value": "});\n\n"
  },
  {
    "name": "editor-type",
    "value": "// Start the server\n"
  },
  {
    "name": "editor-type",
    "value": "async function main() {\n"
  },
  {
    "name": "editor-type",
    "value": "    const transport = new StdioServerTransport();\n"
  },
  {
    "name": "editor-type",
    "value": "    await server.connect(transport);\n"
  },
  {
    "name": "editor-type",
    "value": "    console.error('MCP dev tools server running on stdio');\n"
  },
  {
    "name": "editor-type",
    "value": "}\n\n"
  },
  {
    "name": "editor-type",
    "value": "main().catch((error) => {\n"
  },
  {
    "name": "editor-type",
    "value": "    console.error('Server error:', error);\n"
  },
  {
    "name": "editor-type",
    "value": "    process.exit(1);\n"
  },
  {
    "name": "editor-type",
    "value": "});"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Let's create a package.json file to manage our dependencies and scripts."
  },
  {
    "name": "file-explorer-set-present-working-directory",
    "value": "/Users/dev/mcp-tools"
  },
  {
    "name": "file-explorer-create-file",
    "value": "package.json"
  },
  {
    "name": "file-explorer-open-file",
    "value": "package.json"
  },
  {
    "name": "editor-type",
    "value": "{\n"
  },
  {
    "name": "editor-type",
    "value": "  \"name\": \"mcp-dev-tools\",\n"
  },
  {
    "name": "editor-type",
    "value": "  \"version\": \"0.1.0\",\n"
  },
  {
    "name": "editor-type",
    "value": "  \"description\": \"Custom MCP tools for repository navigation and terminal commands\",\n"
  },
  {
    "name": "editor-type",
    "value": "  \"type\": \"module\",\n"
  },
  {
    "name": "editor-type",
    "value": "  \"main\": \"dist/index.js\",\n"
  },
  {
    "name": "editor-type",
    "value": "  \"scripts\": {\n"
  },
  {
    "name": "editor-type",
    "value": "    \"build\": \"tsc\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"start\": \"node dist/index.js\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"dev\": \"tsc --watch\"\n"
  },
  {
    "name": "editor-type",
    "value": "  },\n"
  },
  {
    "name": "editor-type",
    "value": "  \"dependencies\": {\n"
  },
  {
    "name": "editor-type",
    "value": "    \"@modelcontextprotocol/sdk\": \"^0.1.0\"\n"
  },
  {
    "name": "editor-type",
    "value": "  },\n"
  },
  {
    "name": "editor-type",
    "value": "  \"devDependencies\": {\n"
  },
  {
    "name": "editor-type",
    "value": "    \"@types/node\": \"^20.10.0\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"typescript\": \"^5.3.2\"\n"
  },
  {
    "name": "editor-type",
    "value": "  }\n"
  },
  {
    "name": "editor-type",
    "value": "}"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Now let's create a TypeScript configuration file."
  },
  {
    "name": "file-explorer-create-file",
    "value": "tsconfig.json"
  },
  {
    "name": "file-explorer-open-file",
    "value": "tsconfig.json"
  },
  {
    "name": "editor-type",
    "value": "{\n"
  },
  {
    "name": "editor-type",
    "value": "  \"compilerOptions\": {\n"
  },
  {
    "name": "editor-type",
    "value": "    \"target\": \"ES2022\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"module\": \"ESNext\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"moduleResolution\": \"node\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"outDir\": \"./dist\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"rootDir\": \"./src\",\n"
  },
  {
    "name": "editor-type",
    "value": "    \"strict\": true,\n"
  },
  {
    "name": "editor-type",
    "value": "    \"esModuleInterop\": true,\n"
  },
  {
    "name": "editor-type",
    "value": "    \"resolveJsonModule\": true,\n"
  },
  {
    "name": "editor-type",
    "value": "    \"skipLibCheck\": true\n"
  },
  {
    "name": "editor-type",
    "value": "  },\n"
  },
  {
    "name": "editor-type",
    "value": "  \"include\": [\"src/**/*\"],\n"
  },
  {
    "name": "editor-type",
    "value": "  \"exclude\": [\"node_modules\"]\n"
  },
  {
    "name": "editor-type",
    "value": "}"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Let's create a README file to document how to use these tools."
  },
  {
    "name": "file-explorer-create-file",
    "value": "README.md"
  },
  {
    "name": "file-explorer-open-file",
    "value": "README.md"
  },
  {
    "name": "editor-type",
    "value": "# MCP Dev Tools\n\n"
  },
  {
    "name": "editor-type",
    "value": "Two powerful MCP tools that unlock fully agentic workflows with Claude Desktop.\n\n"
  },
  {
    "name": "editor-type",
    "value": "## Tools\n\n"
  },
  {
    "name": "editor-type",
    "value": "### 1. list_repo_locations\n"
  },
  {
    "name": "editor-type",
    "value": "A smart repository finder with fuzzy matching and helpful hints.\n\n"
  },
  {
    "name": "editor-type",
    "value": "### 2. issue_terminal_command\n"
  },
  {
    "name": "editor-type",
    "value": "A controlled terminal execution tool with safety guardrails.\n\n"
  },
  {
    "name": "editor-type",
    "value": "## Setup\n\n"
  },
  {
    "name": "editor-type",
    "value": "1. Install dependencies:\n"
  },
  {
    "name": "editor-type",
    "value": "```bash\n"
  },
  {
    "name": "editor-type",
    "value": "npm install\n"
  },
  {
    "name": "editor-type",
    "value": "```\n\n"
  },
  {
    "name": "editor-type",
    "value": "2. Build the project:\n"
  },
  {
    "name": "editor-type",
    "value": "```bash\n"
  },
  {
    "name": "editor-type",
    "value": "npm run build\n"
  },
  {
    "name": "editor-type",
    "value": "```\n\n"
  },
  {
    "name": "editor-type",
    "value": "3. Configure in Claude Desktop:\n"
  },
  {
    "name": "editor-type",
    "value": "Add to your `claude_desktop_config.json`:\n\n"
  },
  {
    "name": "editor-type",
    "value": "```json\n"
  },
  {
    "name": "editor-type",
    "value": "{\n"
  },
  {
    "name": "editor-type",
    "value": "  \"mcpServers\": {\n"
  },
  {
    "name": "editor-type",
    "value": "    \"mcp-dev-tools\": {\n"
  },
  {
    "name": "editor-type",
    "value": "      \"command\": \"node\",\n"
  },
  {
    "name": "editor-type",
    "value": "      \"args\": [\"/path/to/mcp-tools/dist/index.js\"]\n"
  },
  {
    "name": "editor-type",
    "value": "    }\n"
  },
  {
    "name": "editor-type",
    "value": "  }\n"
  },
  {
    "name": "editor-type",
    "value": "}\n"
  },
  {
    "name": "editor-type",
    "value": "```\n\n"
  },
  {
    "name": "editor-type",
    "value": "## Customization\n\n"
  },
  {
    "name": "editor-type",
    "value": "Customize the repository maps in `src/tools/list_repo_locations.ts` to match your project structure.\n\n"
  },
  {
    "name": "editor-type",
    "value": "Adjust command permissions in `src/tools/issue_terminal_command.ts` as needed.\n\n"
  },
  {
    "name": "editor-type",
    "value": "## Safety\n\n"
  },
  {
    "name": "editor-type",
    "value": "Always use READ_ONLY_MODE unless you absolutely trust the environment!\n"
  },
  {
    "name": "editor-save",
    "value": "true"
  },
  {
    "name": "author-speak-before",
    "value": "Perfect! Let's now run the build to make sure everything compiles correctly."
  },
  {
    "name": "terminal-open",
    "value": "true"
  },
  {
    "name": "terminal-type",
    "value": "cd /Users/dev/mcp-tools"
  },
  {
    "name": "terminal-enter",
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
    "value": "added 156 packages from 342 contributors and audited 157 packages in 3.245s\nfound 0 vulnerabilities"
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
    "value": "Built successfully! Your MCP tools are ready to use."
  },
  {
    "name": "author-speak-before",
    "value": "Congratulations! We've successfully built two powerful MCP tools that will transform how you work with Claude Desktop. These tools give you the core functionality of Claude Code without the subscription cost. The repository finder eliminates navigation friction with its smart fuzzy matching, while the controlled terminal executor provides Claude with real power to help with development tasks - all with proper safety guardrails. Remember to customize the repository maps to match your project structure, and always be mindful of security when using the terminal command tool. With these tools, you now have a truly agentic development workflow at your fingertips. Happy coding!"
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
