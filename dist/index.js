import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { extractActionsFromProject } from '@fullstackcraftllc/codevideo-types';
import { VirtualIDE } from '@fullstackcraftllc/codevideo-virtual-ide';
import { License, CodeGray, Text as Text$1, Rust, Python, Markdown, Git, Gear, Reactts, Reactjs, Cplus, Csharp, Yaml, Shell, Go, TypeScript, Js, Folder } from '@react-symbols/icons';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : undefined, done: true };
    }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function EditorTabs(props) {
    var editors = props.editors, theme = props.theme;
    // if editors are empty, render fixed height to prevent layout shift
    if (editors.length === 0) {
        return jsx(Box, { style: {
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                height: '30px',
                borderBottom: '1px solid var(--gray-7)',
            } });
    }
    return (jsx(Flex, { style: {
            backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
            height: '30px',
            borderBottom: '1px solid var(--gray-7)',
            pointerEvents: 'none',
            userSelect: 'none',
        }, children: editors.map(function (editor) { return (jsxs(Flex, { align: "center", style: { borderRight: '1px solid var(--gray-7)', padding: '0 10px' }, children: [jsx(Text, { style: { fontFamily: 'Fira Code, monospace', color: '#CCCECC' }, children: editor.filename.split('/').pop() }), editor.isSaved ? (jsx(Box, { ml: "2", style: {
                        color: 'var(--gray-8)',
                        padding: 0,
                        lineHeight: 1,
                        minWidth: 'auto',
                    }, children: "\u00D7" })) : (jsx(Box, { ml: "2", style: {
                        width: '8px',
                        height: '8px',
                        backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                        borderRadius: '9999px'
                    } }))] }, editor.filename)); }) }));
}

var ExternalWebViewer = function (props) {
    var url = props.url;
    var _a = useState(false), hasError = _a[0], setHasError = _a[1];
    var _b = useState(false), hasLoaded = _b[0], setHasLoaded = _b[1];
    // Start a timeout to detect load failures
    useEffect(function () {
        // If the iframe hasn't loaded after 10 seconds, assume it failed
        var timer = setTimeout(function () {
            if (!hasLoaded) {
                setHasError(true);
            }
        }, 10000);
        return function () { return clearTimeout(timer); };
    }, [hasLoaded]);
    return (jsx(Box, { style: { width: '100%', height: '100vh' }, children: hasError ? (jsx(Flex, { align: "center", justify: "center", style: { height: '100%' }, children: jsxs(Text, { size: "5", style: { color: 'var(--gray-10)' }, children: ["Failed to load external content from ", url, ". The site may be invalid or not allow iframes."] }) })) : (jsx("iframe", { src: url, title: "External Web Viewer", style: { width: '100%', height: '100%', border: 0 }, sandbox: "allow-same-origin allow-scripts allow-popups", onLoad: function () { return setHasLoaded(true); }, onError: function () { return setHasError(true); } })) }));
};

var sleep = function (ms) { return __awaiter(undefined, undefined, undefined, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
    });
}); };

// Keep track of the current utterance
/**
 * Speaks the given text, canceling any currently playing speech first
 * @param text The text to speak
 * @returns A promise that resolves when speech is finished
 */
var speakText = function (text, volume) {
    return new Promise(function (resolve, reject) {
        var speechSynthesis = window.speechSynthesis;
        // First, cancel any ongoing speech
        stopSpeaking();
        // Create a new SpeechSynthesisUtterance object
        var utterance = new SpeechSynthesisUtterance(text);
        // Set the volume
        utterance.volume = volume;
        // Resolve the promise when speech is done
        utterance.onend = function () {
            resolve();
        };
        // Handle any errors
        utterance.onerror = function (event) {
            // reject(`Speech synthesis error: ${event.error}`);
            resolve();
        };
        // Speak the text
        speechSynthesis.speak(utterance);
    });
};
/**
 * Immediately stops any ongoing speech synthesis
 */
var stopSpeaking = function () {
    var speechSynthesis = window.speechSynthesis;
    // Cancel all queued utterances
    speechSynthesis.cancel();
};

function getLanguageFromFilename(filename) {
    var _a;
    if (!filename)
        return 'plaintext';
    var extension = (_a = filename.split('.').pop()) === null || _a === undefined ? undefined : _a.toLowerCase();
    var extensionMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'php': 'php',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'go': 'go',
        'rb': 'ruby',
        'rs': 'rust',
        'sh': 'shell',
        'sql': 'sql',
        'yaml': 'yaml',
        'yml': 'yaml',
        // Add more mappings as needed
    };
    return extension && extension in extensionMap ? extensionMap[extension] : 'plaintext';
}

function FileIcon(props) {
    var _a;
    var filename = props.filename;
    var ext = (_a = filename.split('.').pop()) === null || _a === undefined ? undefined : _a.toLowerCase();
    switch (ext) {
        case 'js':
            return jsx(Js, { height: "20" });
        case 'ts':
            return jsx(TypeScript, { height: "20" });
        case 'go':
            return jsx(Go, { height: "20" });
        case 'sh':
        case 'zsh':
            return jsx(Shell, { height: "20" });
        case 'yaml':
            return jsx(Yaml, { height: "20" });
        case 'cs':
            return jsx(Csharp, { height: "20" });
        case 'cpp':
            return jsx(Cplus, { height: "20" });
        case 'jsx':
            return jsx(Reactjs, { height: "20" });
        case 'tsx':
            return jsx(Reactts, { height: "20" });
        case 'env':
        case 'toml':
            return jsx(Gear, { height: "20" });
        case 'gitignore':
            return jsx(Git, { height: "20" });
        case 'md':
            return jsx(Markdown, { height: "20" });
        case 'py':
            return jsx(Python, { height: "20" });
        case 'rs':
            return jsx(Rust, { height: "20" });
        case "txt":
            return jsx(Text$1, { height: "20" });
        default:
            if (filename.toUpperCase() === 'LICENSE') {
                return jsx(License, { height: "20" });
            }
            return jsx(CodeGray, { height: "20" });
    }
}

function FileExplorer(props) {
    var theme = props.theme, currentFileName = props.currentFileName, fileStructure = props.fileStructure;
    var renderFileTree = function (structure, path, level) {
        if (path === undefined) { path = ''; }
        // Sort entries alphabetically, with directories first, then files
        var sortedEntries = Object.entries(structure).sort(function (a, b) {
            var aIsDir = a[1].type === 'directory';
            var bIsDir = b[1].type === 'directory';
            // If both are directories or both are files, sort alphabetically
            if (aIsDir === bIsDir) {
                return a[0].localeCompare(b[0]);
            }
            // Otherwise, directories come first
            return aIsDir ? -1 : 1;
        });
        return sortedEntries.map(function (_a) {
            var name = _a[0], item = _a[1];
            var fullPath = path ? "".concat(path, "/").concat(name) : name;
            var isDirectory = item.type === 'directory';
            var leftMargin = level === 0 ? "0" : "4";
            var nextLevel = level + 1;
            return (jsxs(Box, { ml: leftMargin, children: [jsxs(Flex, { "data-codevideo-id": "file-explorer-".concat(fullPath), align: "center", gap: "2", style: {
                            borderRadius: 'var(--radius-2)',
                            backgroundColor: currentFileName === fullPath ? 'var(--mint-8)' : 'transparent',
                        }, children: [isDirectory ? jsx(Folder, { height: "20" }) : jsx(FileIcon, { filename: name }), jsx(Text, { style: { fontFamily: 'Fira Code, monospace', color: '#CCCECC', fontSize: '0.9em' }, children: name })] }), isDirectory && item.children && renderFileTree(item.children, fullPath, nextLevel)] }, fullPath));
        });
    };
    if (!fileStructure) {
        return jsx(Fragment, {});
    }
    return (jsx(Box, { p: "1", style: {
            height: '100%',
            minWidth: '250px',
            borderRight: '1px solid var(--gray-7)',
            backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
            pointerEvents: 'none',
            userSelect: 'none',
        }, children: jsx(Box, { p: "2", children: renderFileTree(fileStructure, '', 0) }) }));
}

function Terminal(props) {
    var theme = props.theme, terminalBuffer = props.terminalBuffer;
    var terminalRef = useRef(null);
    // always auto-scroll to the bottom whenever the terminal buffer changes
    useEffect(function () {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalBuffer]);
    return (jsx(Box, { "data-codevideo-id": "terminal", ref: terminalRef, style: {
            borderTop: '1px solid var(--gray-7)',
            height: '150px',
            backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
            fontFamily: 'Fira Code, monospace',
            padding: '8px',
            position: 'relative',
            overflow: 'auto', // Changed from 'hidden' to 'auto' to enable scrolling
            scrollBehavior: 'smooth', // Add smooth scrolling effect
        }, children: jsxs(Box, { style: {
                whiteSpace: 'pre-wrap', // This enables text wrapping
                wordBreak: 'break-word', // This ensures words break properly
                fontWeight: 'bold',
                width: '100%', // Ensure the content takes full width of container
            }, children: [terminalBuffer, jsx(Box, { style: {
                        display: 'inline-block',
                        width: '2px',
                        height: '19px',
                        marginBottom: '-4px',
                        backgroundColor: 'var(--gray-12)',
                        animation: 'blink 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    } })] }) }));
}

var MouseOverlay = function (props) {
    var mode = props.mode, mouseVisible = props.mouseVisible, mousePosition = props.mousePosition;
    var overlayRef = useRef(null);
    if (!mouseVisible) {
        return jsx(Fragment, {});
    }
    // only animate mouse movement in replay mode - in step mode, we will "jump" from location to location when in step mode
    var transition = mode === 'replay' ? 'transform 0.75s ease-in-out' : undefined;
    return (jsx(Box, { id: "mouse-overlay", ref: overlayRef, style: {
            transform: "translate(".concat(mousePosition.x, "px, ").concat(mousePosition.y, "px) scale(0.8)"),
            transition: transition,
            zIndex: 100000000,
            position: 'absolute',
            pointerEvents: 'none',
            userSelect: 'none',
        }, children: jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", version: "1.1", xmlns: "http://www.w3.org/2000/svg", children: jsx("path", { d: "M 0,0 L 0,20 L 4.5,15.5 L 8.75,23 L 11,22 L 6.75,15 L 13.75,15 Z", fill: "black", stroke: "white", strokeWidth: "1.5", strokeLinejoin: "round" }) }) }));
};

var convertToContainerCoordinates = function (point, containerRef) {
    if (!containerRef)
        return { x: 0, y: 0 };
    if (!(containerRef === null || containerRef === undefined ? undefined : containerRef.current))
        return point;
    var containerRect = containerRef.current.getBoundingClientRect();
    return {
        x: point.x - containerRect.left,
        y: point.y - containerRect.top
    };
};

var getCoordinatesOfTerminalInput = function (containerRef) {
    if (!containerRef)
        return { x: 0, y: 0 };
    var terminal = document.querySelector('[data-codevideo-id="terminal"]');
    if (!terminal)
        return { x: 0, y: 0 };
    // console.log('terminal element', terminal);
    var rect = terminal.getBoundingClientRect();
    return convertToContainerCoordinates({
        x: rect.left + 20, // Add padding for prompt
        y: rect.top + 20 // Position near top of terminal
    }, containerRef);
};

var getCoordinatesOfEditor = function (containerRef) {
    if (!containerRef)
        return { x: 0, y: 0 };
    var editor = document.querySelector('[data-codevideo-id="editor"]');
    if (!editor)
        return { x: 0, y: 0 };
    // console.log('editor element', editor);
    var rect = editor.getBoundingClientRect();
    return convertToContainerCoordinates({
        x: rect.left + 50, // Position inside editor
        y: rect.top + 50 // Position inside editor
    }, containerRef);
};

var getCoordinatesOfFileOrFolder = function (fileOrFolderPath, containerRef) {
    if (!containerRef)
        return { x: 0, y: 0 };
    console.log('fileOrFolderPath', fileOrFolderPath);
    var fileElement = document.querySelector("[data-codevideo-id=\"file-explorer-".concat(fileOrFolderPath, "\"]"));
    // TODO: happens quite a lot, need to rearrange when the file tree is ready to be found.
    if (!fileElement) {
        // console.log('fileElement not found');
        return { x: 0, y: 0 };
    }
    // console.log('fileElement', fileElement);
    var rect = fileElement.getBoundingClientRect();
    return convertToContainerCoordinates({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    }, containerRef);
};

var parseCoordinatesFromAction = function (value, containerRef) {
    if (!containerRef)
        return { x: 0, y: 0 };
    // try to get two parts
    var parts = value.split(',');
    if (parts.length == 2) {
        return convertToContainerCoordinates({
            x: parts[0] ? parseInt(parts[0]) : 0,
            y: parts[1] ? parseInt(parts[1]) : 0
        }, containerRef);
    }
    return {
        x: 0,
        y: 0,
    };
};

function CaptionOverlay(props) {
    var captionText = props.captionText;
    return (jsx(Fragment, { children: captionText && (jsx(Box, { style: {
                width: '100%',
                color: 'white',
                position: 'absolute',
                bottom: 65,
            }, children: jsx(Flex, { justify: "center", align: "center", children: jsx(Box, { style: {
                        maxWidth: '80%',
                        backgroundColor: 'var(--black-a9)',
                        // borderRadius: 'var(--radius-3)',
                        padding: '4px 8px',
                    }, children: jsx(Text, { size: "6", children: captionText }) }) }) })) }));
}

var LONG_PAUSE_MS = 5000;
var STANDARD_PAUSE_MS = 1000;
var KEYBOARD_TYPING_PAUSE_MS = 50;
var DEFAULT_CARET_POSITION = { row: 1, col: 1 };
var reconstituteAllPartsOfState = function (project, currentActionIndex, currentLessonIndex) {
    var _a, _b, _c;
    // console.log("project is ", project)
    // console.log("currentLessonIndex is ", currentLessonIndex)
    var actions = extractActionsFromProject(project, currentLessonIndex);
    // console.log("actions extracted are ", actions)
    var actionsToApply = actions.slice(0, currentActionIndex + 1);
    var virtualIDE = new VirtualIDE(project, undefined, true);
    virtualIDE.applyActions(actionsToApply);
    // console.log("applied actions", actionsToApply);
    var courseSnapshot = virtualIDE.getCourseSnapshot();
    var editors = courseSnapshot.editorSnapshot.editors;
    var currentEditor = (editors === null || editors === undefined ? undefined : editors.find(function (editor) { return editor.isActive; })) || (editors === null || editors === undefined ? undefined : editors[0]) || {
        filename: '',
        content: '',
        caretPosition: DEFAULT_CARET_POSITION,
        highlightCoordinates: null,
        isActive: false,
        isSaved: false
    };
    var currentFilename = currentEditor.filename;
    var fileStructure = courseSnapshot.fileExplorerSnapshot.fileStructure;
    var currentCode = currentEditor ? currentEditor.content : '';
    var currentCaretPosition = virtualIDE.virtualEditors && virtualIDE.virtualEditors.length > 0 ? ((_a = virtualIDE.virtualEditors[0]) === null || _a === undefined ? undefined : _a.virtualEditor.getCurrentCaretPosition()) || DEFAULT_CARET_POSITION : DEFAULT_CARET_POSITION;
    var currentTerminalBuffer = virtualIDE.virtualTerminals.length > 0 ? ((_b = virtualIDE.virtualTerminals[0]) === null || _b === undefined ? undefined : _b.getBuffer().join('\n')) || '' : '';
    var captionText = ((_c = courseSnapshot === null || courseSnapshot === undefined ? undefined : courseSnapshot.authorSnapshot.authors[0]) === null || _c === undefined ? undefined : _c.currentSpeechCaption) || '';
    return { editors: editors, currentEditor: currentEditor, currentFilename: currentFilename, fileStructure: fileStructure, currentCode: currentCode, currentCaretPosition: currentCaretPosition, currentTerminalBuffer: currentTerminalBuffer, captionText: captionText, actions: actions };
};
/**
 * Represents a powerful IDE with file explorer, multiple editors, and terminal
 * @param props
 * @returns
 */
function CodeVideoIDE(props) {
    var _this = this;
    var theme = props.theme, project = props.project, mode = props.mode, allowFocusInEditor = props.allowFocusInEditor, defaultLanguage = props.defaultLanguage, isExternalBrowserStepUrl = props.isExternalBrowserStepUrl, currentActionIndex = props.currentActionIndex, currentLessonIndex = props.currentLessonIndex, isSoundOn = props.isSoundOn, actionFinishedCallback = props.actionFinishedCallback;
    var isRecording = mode === 'record';
    var _a = useState(), editors = _a[0], setEditors = _a[1];
    var _b = useState(), currentEditor = _b[0], setCurrentEditor = _b[1];
    var _c = useState(), currentFileName = _c[0], setCurrentFileName = _c[1];
    var _d = useState(), currentFileStructure = _d[0], setCurrentFileStructure = _d[1];
    var _e = useState(''), currentCode = _e[0], setCurrentCode = _e[1];
    var _f = useState(''), terminalBuffer = _f[0], setTerminalBuffer = _f[1];
    var _g = useState({ x: 0, y: 0 }), mousePosition = _g[0], setMousePosition = _g[1];
    var _h = useState(DEFAULT_CARET_POSITION), currentCaretPosition = _h[0], setCurrentCaretPosition = _h[1];
    var _j = useState(''), captionText = _j[0], setCaptionText = _j[1];
    var _k = useState(defaultLanguage), currentEditorLanguage = _k[0], setCurrentEditorLanguage = _k[1];
    var containerRef = useRef(null);
    var monacoEditorRef = useRef(undefined);
    var globalMonacoRef = useRef(undefined);
    // for cleanup TODO
    useRef(new Set());
    useRef(mode);
    useRef(true);
    var applyAnimation = function () { return __awaiter(_this, undefined, undefined, function () {
        var actions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    actions = extractActionsFromProject(project, currentLessonIndex);
                    if (!(monacoEditorRef.current && actions[currentActionIndex])) return [3 /*break*/, 2];
                    return [4 /*yield*/, executeActionPlaybackForMonacoInstance(monacoEditorRef.current, project, currentActionIndex, currentLessonIndex, actions[currentActionIndex], isSoundOn, setEditors, setCurrentEditor, setCurrentFileName, setCurrentCaretPosition, setTerminalBuffer, mousePosition, containerRef, setMousePosition, setCaptionText)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    updateState();
                    actionFinishedCallback();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateState = function () {
        var _a = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex), editors = _a.editors, currentEditor = _a.currentEditor, currentFilename = _a.currentFilename, fileStructure = _a.fileStructure, currentCode = _a.currentCode, currentCaretPosition = _a.currentCaretPosition, currentTerminalBuffer = _a.currentTerminalBuffer, captionText = _a.captionText, actions = _a.actions;
        setEditors(editors);
        setCurrentEditor(currentEditor);
        setCurrentFileName(currentFilename);
        setCurrentFileStructure(fileStructure);
        setCurrentCode(currentCode);
        setCurrentCaretPosition(currentCaretPosition);
        setTerminalBuffer(currentTerminalBuffer);
        setCaptionText(captionText);
        // TODO: these should be derived from the snapshot directly but I ran out of time :(
        // can unit test and add back in later - though the coordinate based stuff is a mix of client.. not sure how to solve that one discreetly.
        updateMouseState(actions);
    };
    // This is copied basically in animation way down logic below, could be refactored
    var updateMouseState = function (actions) {
        if (currentActionIndex === 0 && mode === 'step') {
            if (!(containerRef === null || containerRef === undefined ? undefined : containerRef.current)) {
                return;
            }
            var rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
                x: rect.width / 2,
                y: rect.height / 2,
            });
            return;
        }
        var currentAction = actions[currentActionIndex];
        if (!currentAction)
            return;
        var newPosition = { x: mousePosition.x, y: mousePosition.y };
        switch (currentAction.name) {
            case 'mouse-click-terminal':
            case 'terminal-open':
                newPosition = getCoordinatesOfTerminalInput(containerRef);
                break;
            case 'mouse-click-editor':
            case 'editor-type':
                newPosition = getCoordinatesOfEditor(containerRef);
                break;
            case 'file-explorer-create-folder':
            case 'file-explorer-create-file':
            case 'file-explorer-open-file':
            case 'mouse-click-filename':
                newPosition = getCoordinatesOfFileOrFolder(currentAction.value, containerRef);
                break;
            case 'mouse-move':
                newPosition = parseCoordinatesFromAction(currentAction.value, containerRef);
                break;
        }
        setMousePosition(newPosition);
    };
    // whenever issoundon changes or currentActionIndex, and we are in step mode, and the current action includes 'speak', we should speak
    useEffect(function () {
        var _a;
        var actions = extractActionsFromProject(project, currentLessonIndex);
        if (isSoundOn && mode === 'step' && ((_a = actions[currentActionIndex]) === null || _a === undefined ? undefined : _a.name.startsWith('author-'))) {
            speakText(actions[currentActionIndex].value, 1);
        }
        else {
            stopSpeaking();
        }
    }, [isSoundOn, project, currentActionIndex, currentLessonIndex]);
    // update virtual when current action index changes
    useEffect(function () {
        // normal step by step mode OR initial replay state - can update state immediately
        if (mode === 'step') {
            console.log('updating state for step mode');
            updateState();
            return;
        }
        // if playback mode, we need to animate the typing on the editor, then we can apply the action to maintain state, then we call the actionFinishedCallback
        if (mode === 'replay') {
            // need to handle the first reset
            if (currentActionIndex === 0) {
                updateState();
            }
            // this in turn calls updateState once the animation is complete, and then calls actionFinishedCallback
            applyAnimation();
        }
    }, [mode, currentActionIndex, project]);
    var handleEditorDidMount = function (monacoEditor, monaco) {
        monacoEditorRef.current = monacoEditor;
        globalMonacoRef.current = monaco;
        // Set the model with the current code and language
        // TODO could probably be looped for all files?
        var model = monaco.editor.createModel(currentCode, currentEditorLanguage);
        monacoEditor.setModel(model);
        // Ensure theme is applied after a short delay
        // monaco.editor.defineTheme(
        //   "Monokai",
        //   Monokai as monaco.editor.IStandaloneThemeData
        // );
        // setTimeout(() => {
        //   monaco.editor.setTheme('Monokai');
        // }, 1);
    };
    // caret position effect - we don't use in replay mode because it is handled in the animation
    // works fine for step by step mode though!
    useEffect(function () {
        if (monacoEditorRef.current && mode === 'step') {
            monacoEditorRef.current.setPosition({
                lineNumber: currentCaretPosition.row,
                column: currentCaretPosition.col
            });
            monacoEditorRef.current.revealPositionInCenter({
                lineNumber: currentCaretPosition.row,
                column: currentCaretPosition.col
            });
            // trigger a focus to actually highlight where the caret is
            // TODO: need to prevent this when they are typing elsewhere!!!!
            if (allowFocusInEditor) {
                monacoEditorRef.current.focus();
            }
        }
    }, [currentCaretPosition, allowFocusInEditor]);
    // TODO: figure out highlights! (breaks due to SSR)
    // const currentHighlightCoordinates = currentFile ? currentFile.highlightCoordinates : null;
    // // highlight effect (only when not recording)
    // useEffect(() => {
    //   // if (typeof window !== "undefined" && !isRecording && monacoEditorRef.current && currentHighlightCoordinates) {
    //   // TODO: this line breaks SSR:
    //   // maybe we can hack our own highlight functionality...
    //   //   monacoEditorRef.current.createDecorationsCollection([
    //   //     {
    //   //       range: new monaco.Range(
    //   //         currentHighlightCoordinates.start.row,
    //   //         currentHighlightCoordinates.start.col,
    //   //         currentHighlightCoordinates.end.row,
    //   //         currentHighlightCoordinates.end.col
    //   //       ),
    //   //       options: { inlineClassName: 'highlighted-code' }
    //   //     }
    //   //   ]);
    //   //   // log out decorations for debugging
    //   //   // console.log(monacoEditorRef.current.getVisibleRanges());
    //   //   // trigger a focus to actually highlight where the highlight is
    //   //   // monacoEditorRef.current.focus();
    //   // }
    // }, [currentHighlightCoordinates]);
    // always auto-scroll to line in center when the caret row position changes
    useEffect(function () {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.revealLineInCenter(currentCaretPosition.row);
        }
    }, [currentCaretPosition.row]);
    // update the language of the editor based on the current filename every time it changes
    useEffect(function () {
        if (currentFileName) {
            var detectedLanguage = getLanguageFromFilename(currentFileName);
            setCurrentEditorLanguage(detectedLanguage);
            // If we have an active editor model, update its language
            if (monacoEditorRef.current && globalMonacoRef.current) {
                var model = monacoEditorRef.current.getModel();
                if (model) {
                    globalMonacoRef.current.editor.setModelLanguage(model, detectedLanguage);
                }
            }
        }
    }, [currentFileName]);
    // monaco cleanup - whenever replay ends, clear all models
    // useEffect(() => {
    //   if (mode !== 'replay' && monacoEditorRef.current) {
    //     monacoEditorRef.current.setModel(null);
    //   }
    // }, [mode]);
    // Comprehensive cleanup function
    // TODO this doesn't fix the playback bug and causes SSR issues anyway
    // const cleanupMonacoState = () => {
    //   console.log('Cleaning up Monaco state');
    //   // 1. Dispose specific tracked models by URI
    //   modelUrisRef.current.forEach(uriString => {
    //     try {
    //       const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
    //       if (model) {
    //         model.dispose();
    //       }
    //     } catch (e) {
    //       console.error('Error disposing model:', e);
    //     }
    //   });
    //   // Reset tracking
    //   modelUrisRef.current.clear();
    //   // 2. Safety check: dispose any remaining models
    //   monaco.editor.getModels().forEach(model => {
    //     try {
    //       console.log('Disposing model:', model.uri.toString());
    //       model.dispose();
    //       console.log('Disposed.');
    //     } catch (e) {
    //       console.error('Error disposing leftover model:', e);
    //     }
    //   });
    //   // 3. Reset editor state but preserve the instance
    //   if (monacoEditorRef.current) {
    //     try {
    //       // Create a temporary empty model with a unique URI
    //       const tempUri = monaco.Uri.parse(`temp-${Date.now()}`);
    //       const emptyModel = monaco.editor.createModel('', defaultLanguage, tempUri);
    //       monacoEditorRef.current.setModel(emptyModel);
    //       // Reset editor viewstate
    //       monacoEditorRef.current.restoreViewState(null);
    //       // Reset cursor and selection
    //       monacoEditorRef.current.setPosition({ lineNumber: 1, column: 1 });
    //       monacoEditorRef.current.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
    //     } catch (e) {
    //       console.error('Error resetting editor state:', e);
    //     }
    //   }
    //   console.log('Cleaning up complete');
    // };
    // // Add this effect to handle mode changes
    // useEffect(() => {
    //   // Skip on initial mount
    //   if (isInitialMount.current) {
    //     isInitialMount.current = false;
    //     return;
    //   }
    //   // Cleanup when exiting replay mode
    //   if (mode !== 'replay' && prevMode.current === 'replay') {
    //     cleanupMonacoState();
    //     // Explicitly update state after cleanup
    //     // updateState();
    //   }
    //   // Store current mode for next comparison
    //   prevMode.current = mode;
    // }, [mode]);
    // Add cleanup on component unmount
    // TODO this doesn't fix the playback bug and causes SSR issues anyway
    // useEffect(() => {
    //   return () => {
    //     cleanupMonacoState();
    //   };
    // }, []);
    // useful for debugging
    // // before rendering log out all relevant stuff
    // // current file
    // console.log('currentFile', currentFile);
    // // current file structure
    // console.log('currentFileStructure', currentFileStructure);
    // // current code
    // console.log('currentCode', currentCode);
    // // terminal buffer
    // console.log('terminalBuffer', terminalBuffer);
    // // mouse position
    // console.log('mousePosition', mousePosition);
    // // current caret position
    // console.log('currentCaretPosition', currentCaretPosition);
    // // caption text
    // console.log('captionText', captionText);
    // current filepath
    // console.log("currentFileName", currentFileName)
    return (jsxs(Flex, { direction: "column", style: { height: '100%', width: '100%' }, id: 'advanced-editor', children: [jsxs(Flex, { direction: "row", style: {
                    height: '100%',
                    borderTopLeftRadius: 'var(--radius-3)',
                    borderTopRightRadius: 'var(--radius-3)',
                    overflow: 'hidden',
                    // necessary so mouse overlay can be positioned absolutely
                    position: 'relative',
                }, ref: containerRef, children: [isExternalBrowserStepUrl !== null ? (jsx(Flex, { direction: "row", style: {
                            height: '100%',
                            width: '100%',
                            borderRadius: 'var(--radius-3)',
                            position: 'relative'
                        }, ref: containerRef, children: jsx(ExternalWebViewer, { url: isExternalBrowserStepUrl }) })) : (jsxs(Fragment, { children: [jsx(FileExplorer, { theme: theme, currentFileName: currentFileName, fileStructure: currentFileStructure }), jsxs(Flex, { direction: "column", width: "100%", children: [jsx(EditorTabs, { theme: theme, editors: editors || [] }), jsxs(Box, { "data-codevideo-id": "editor", style: {
                                            flex: 1,
                                            position: 'relative',
                                            userSelect: isRecording ? 'auto' : 'none'
                                        }, children: [jsx(Box, { style: {
                                                    display: editors && editors.length === 0 ? 'block' : 'none',
                                                    backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                                                    height: '100%',
                                                    width: '100%'
                                                } }), jsx(Editor, { path: currentEditor === null || currentEditor === undefined ? undefined : currentEditor.filename, theme: theme === 'light' ? 'vs' : 'vs-dark', className: "no-mouse ".concat(editors && editors.length === 0 ? 'display-none' : 'display-block'), value: isRecording || mode === 'replay' ? undefined : currentCode, defaultValue: isRecording ? currentCode : undefined, defaultLanguage: defaultLanguage, options: {
                                                    automaticLayout: true,
                                                    minimap: { enabled: true },
                                                    scrollBeyondLastLine: true,
                                                    fontSize: 14,
                                                    fontFamily: 'Fira Code, monospace',
                                                    fontLigatures: true,
                                                    readOnly: mode === 'step',
                                                    lineNumbers: 'on',
                                                    renderWhitespace: 'selection',
                                                    bracketPairColorization: { enabled: true },
                                                    matchBrackets: 'never',
                                                    formatOnPaste: true,
                                                    formatOnType: true,
                                                }, onMount: handleEditorDidMount })] }), terminalBuffer.length > 0 ? (jsx(Terminal, { theme: theme, terminalBuffer: terminalBuffer })) : (
                                    /* Empty terminal - colored background */
                                    jsx(Box, { style: { backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)', height: '150px', borderTop: '1px solid var(--gray-7)' } }))] })] })), jsx(MouseOverlay, { mode: mode, mouseVisible: true, mousePosition: mousePosition })] }), jsx(CaptionOverlay, { captionText: captionText })] }));
}
// define the human typing here in the puppeteer environment
var simulateHumanTyping = function (editor, code) {
    return new Promise(function (resolve) {
        var characters = code.split("");
        var index = 0;
        function typeNextCharacter() {
            if (index < characters.length) {
                var char = characters[index];
                var selection = editor.getSelection();
                editor.executeEdits("simulateTyping", [
                    {
                        range: {
                            startLineNumber: (selection === null || selection === undefined ? undefined : selection.selectionStartLineNumber) || 1,
                            startColumn: (selection === null || selection === undefined ? undefined : selection.selectionStartColumn) || 1,
                            endLineNumber: (selection === null || selection === undefined ? undefined : selection.endLineNumber) || 1,
                            endColumn: (selection === null || selection === undefined ? undefined : selection.endColumn) || 1,
                        },
                        text: char || "",
                        forceMoveMarkers: true,
                    },
                ]);
                // editor.setPosition({
                //   lineNumber: selection?.endLineNumber || 1,
                //   column: selection?.endColumn || 1
                // });
                // editor.revealPositionInCenter({
                //   lineNumber: selection?.endLineNumber || 1,
                //   column: selection?.endColumn || 1
                // });
                // trigger a focus to actually highlight where the caret is
                editor.focus();
                index++;
                setTimeout(typeNextCharacter, KEYBOARD_TYPING_PAUSE_MS);
            }
            else {
                resolve();
            }
        }
        typeNextCharacter();
    });
};
var simulateKeyboardPause = function () { return __awaiter(undefined, undefined, undefined, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (resolve) {
                    return setTimeout(resolve, KEYBOARD_TYPING_PAUSE_MS);
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// TODO: copied the EDITOR parts mostly from the backend single editor endpoint from codevideo-backend-engine... can we generalize this?
// the speaking and terminal stuff is new
var executeActionPlaybackForMonacoInstance = function (editor, project, currentActionIndex, currentLessonIndex, action, isSoundOn, setEditors, setCurrentEditor, setCurrentFileName, setCurrentCaretPosition, setTerminalBuffer, mousePosition, containerRef, setMousePosition, setCaptionText) { return __awaiter(undefined, undefined, undefined, function () {
    var startTime, _a, _b, editors, currentEditor, currentFilename, currentCaretPosition, newPosition, times, pos, _loop_1, i;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                startTime = -1;
                _a = action.name;
                switch (_a) {
                    case 'file-explorer-open-file': return [3 /*break*/, 1];
                }
                return [3 /*break*/, 3];
            case 1:
                console.log("SET CURRENT FILE to ", action.value);
                _b = reconstituteAllPartsOfState(project, currentActionIndex, currentLessonIndex), editors = _b.editors, currentEditor = _b.currentEditor, currentFilename = _b.currentFilename, currentCaretPosition = _b.currentCaretPosition;
                setEditors(editors);
                setCurrentEditor(currentEditor);
                setCurrentFileName(currentFilename);
                return [4 /*yield*/, sleep(STANDARD_PAUSE_MS)];
            case 2:
                _c.sent();
                setCurrentCaretPosition(currentCaretPosition);
                return [3 /*break*/, 3];
            case 3:
                newPosition = { x: mousePosition.x, y: mousePosition.y };
                switch (action.name) {
                    case 'mouse-click-terminal':
                    case 'terminal-open':
                        newPosition = getCoordinatesOfTerminalInput(containerRef);
                        break;
                    case 'mouse-click-editor':
                    case 'editor-type':
                        newPosition = getCoordinatesOfEditor(containerRef);
                        break;
                    case 'file-explorer-create-folder':
                    case 'file-explorer-create-file':
                    case 'file-explorer-open-file':
                    case 'mouse-click-filename':
                        newPosition = getCoordinatesOfFileOrFolder(action.value, containerRef);
                        break;
                    case 'mouse-move':
                        newPosition = parseCoordinatesFromAction(action.value, containerRef);
                        break;
                }
                setMousePosition(newPosition);
                times = parseInt(action.value) || 1;
                pos = editor.getPosition();
                _loop_1 = function (i) {
                    var _d, terminalOutput, terminalLines, latestLine_1, _loop_2, i_1;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                _d = true;
                                switch (_d) {
                                    case action.name.startsWith("external-"): return [3 /*break*/, 1];
                                    case action.name.startsWith("author-"): return [3 /*break*/, 3];
                                    case action.name === 'terminal-type': return [3 /*break*/, 5];
                                    case action.name === "editor-arrow-down" && pos !== null: return [3 /*break*/, 10];
                                    case action.name === "editor-arrow-up" && pos !== null: return [3 /*break*/, 12];
                                    case action.name === "editor-tab" && pos !== null: return [3 /*break*/, 14];
                                    case action.name === "editor-arrow-left" && pos !== null: return [3 /*break*/, 16];
                                    case action.name === "editor-arrow-right" && pos !== null: return [3 /*break*/, 18];
                                    case action.name === "editor-enter": return [3 /*break*/, 20];
                                    case action.name === "editor-command-right" && pos !== null: return [3 /*break*/, 22];
                                    case action.name === "editor-space": return [3 /*break*/, 24];
                                    case action.name === "editor-backspace": return [3 /*break*/, 26];
                                    case action.name === "editor-type": return [3 /*break*/, 28];
                                }
                                return [3 /*break*/, 30];
                            case 1: 
                            // no op - but do a long pause
                            return [4 /*yield*/, sleep(LONG_PAUSE_MS)];
                            case 2:
                                // no op - but do a long pause
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 3:
                                setCaptionText(action.value);
                                return [4 /*yield*/, speakText(action.value, isSoundOn ? 1 : 0)];
                            case 4:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 5:
                                terminalOutput = action.value;
                                terminalLines = terminalOutput.split('\n');
                                latestLine_1 = terminalLines[terminalLines.length - 1];
                                if (!latestLine_1) return [3 /*break*/, 9];
                                _loop_2 = function (i_1) {
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0:
                                                setTerminalBuffer(function (prev) { return prev + latestLine_1[i_1]; });
                                                return [4 /*yield*/, sleep(100)];
                                            case 1:
                                                _f.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                i_1 = 0;
                                _e.label = 6;
                            case 6:
                                if (!(i_1 < latestLine_1.length)) return [3 /*break*/, 9];
                                return [5 /*yield**/, _loop_2(i_1)];
                            case 7:
                                _e.sent();
                                _e.label = 8;
                            case 8:
                                i_1++;
                                return [3 /*break*/, 6];
                            case 9: return [3 /*break*/, 32];
                            case 10:
                                // @ts-ignore
                                pos.lineNumber = pos.lineNumber + 1;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 11:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 12:
                                // @ts-ignore
                                pos.lineNumber = pos.lineNumber - 1;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 13:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 14:
                                // @ts-ignore
                                pos.lineNumber = pos.lineNumber + 2;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 15:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 16:
                                // @ts-ignore
                                pos.column = pos.column - 1;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 17:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 18:
                                // @ts-ignore
                                pos.column = pos.column + 1;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 19:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 20: return [4 /*yield*/, simulateHumanTyping(editor, "\n")];
                            case 21:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 22:
                                // simulate moving to the end of the current line
                                // @ts-ignore
                                pos.column = 100000;
                                editor.setPosition(pos);
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 23:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 24: return [4 /*yield*/, simulateHumanTyping(editor, " ")];
                            case 25:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 26:
                                // @ts-ignore - this also breaks SSR
                                typeof window !== "undefined" && editor.trigger(1, "deleteLeft");
                                return [4 /*yield*/, simulateKeyboardPause()];
                            case 27:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 28: return [4 /*yield*/, simulateHumanTyping(editor, action.value)];
                            case 29:
                                _e.sent();
                                return [3 /*break*/, 32];
                            case 30: 
                            // no op - but still do default delay
                            return [4 /*yield*/, sleep(STANDARD_PAUSE_MS)];
                            case 31:
                                // no op - but still do default delay
                                _e.sent();
                                console.warn("Unable to apply action", action);
                                return [3 /*break*/, 32];
                            case 32: return [2 /*return*/];
                        }
                    });
                };
                i = 0;
                _c.label = 4;
            case 4:
                if (!(i < times)) return [3 /*break*/, 7];
                return [5 /*yield**/, _loop_1(i)];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                i++;
                return [3 /*break*/, 4];
            case 7: return [2 /*return*/, startTime];
        }
    });
}); };

export { CodeVideoIDE };
