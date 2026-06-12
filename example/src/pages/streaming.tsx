import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { GUIMode, IAction } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes"

/**
 * Streaming demo: simulates an LLM (or any producer) streaming actions into a
 * growing array while the IDE plays them back - the codevideo-genie scenario.
 *
 * The wiring below is exactly what a real streaming consumer writes:
 *  - the producer appends to an immutably-rebuilt actions array
 *  - the parent owns currentActionIndex, advancing it from actionFinishedCallback
 *  - isStreaming stays true while more actions may arrive; when playback runs
 *    out of actions it idles ("buffering") and resumes automatically on the
 *    next append; setting isStreaming false at stream end restores normal
 *    completion semantics (playBackCompleteCallback fires)
 */

// the full script the "LLM" will stream, one action at a time (speak-free so
// the demo needs no audio permissions or TTS)
const SCRIPT: Array<IAction> = [
  { name: "file-explorer-create-file", value: "stream.ts" },
  { name: "file-explorer-open-file", value: "stream.ts" },
  { name: "mouse-move-editor", value: "1" },
  { name: "mouse-left-click", value: "1" },
  { name: "editor-type", value: "// these actions are arriving over a simulated stream\n" },
  { name: "editor-type", value: "interface Chunk {\n  index: number;\n  payload: string;\n}\n\n" },
  { name: "editor-type", value: "const consume = (c: Chunk): string =>\n  `chunk ${c.index}: ${c.payload}`;\n\n" },
  { name: "editor-type", value: "console.log(consume({ index: 1, payload: 'hello stream' }));\n" },
  { name: "mouse-move-terminal", value: "1" },
  { name: "mouse-left-click", value: "1" },
  { name: "terminal-type", value: "npx ts-node stream.ts" },
  { name: "author-wait", value: "1500" },
  { name: "slide-display", value: "# Stream complete\n\nEvery action on this page arrived *after* playback had already started." },
  { name: "author-wait", value: "1500" },
]

// index before which the producer stalls, letting playback catch up and
// visibly hit the buffering state (starvation -> idle -> auto-resume)
const STALL_BEFORE_INDEX = 5
const STALL_MS = 8000

const randomJitterMs = () => 600 + Math.random() * 800

/**
 * Page-local simulation of a streaming producer. Appends one scripted action
 * at a time on a jittered interval, rebuilding the array with all-new object
 * references each chunk - the same shape a Redux store gives you - to
 * exercise the component's content-based append detection.
 */
const useSimulatedActionStream = () => {
  const [streamedActions, setStreamedActions] = useState<Array<IAction>>([])
  const [isStreaming, setIsStreaming] = useState<boolean>(true)
  const [started, setStarted] = useState<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    setStarted(true)
  }, [])

  useEffect(() => {
    if (!started) {
      return
    }
    let delivered = 0
    const deliverNext = () => {
      if (delivered >= SCRIPT.length) {
        // stream finished: flip isStreaming off so a starved playback
        // completes normally instead of waiting forever
        setIsStreaming(false)
        return
      }
      const next = SCRIPT[delivered]
      delivered += 1
      // immutably rebuild with all-new element references (Redux-style)
      setStreamedActions(prev => [...prev.map(a => ({ ...a })), { ...next }])
      const delay = delivered === STALL_BEFORE_INDEX ? STALL_MS : randomJitterMs()
      timerRef.current = setTimeout(deliverNext, delay)
    }
    timerRef.current = setTimeout(deliverNext, randomJitterMs())
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [started])

  return { streamedActions, isStreaming, started, start, total: SCRIPT.length }
}

const badgeStyle = (active: boolean, color: string): React.CSSProperties => ({
  padding: "2px 10px",
  borderRadius: 12,
  fontSize: 13,
  fontFamily: "monospace",
  backgroundColor: active ? color : "#333",
  color: active ? "#111" : "#777",
  transition: "background-color 200ms",
})

export default function Streaming() {
  const { streamedActions, isStreaming, started, start, total } = useSimulatedActionStream()
  const [mode, setMode] = useState<GUIMode>("step")
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // playback starts on first interaction, mirroring the replay page
  useEffect(() => {
    if (started) {
      return
    }
    const begin = () => {
      setMode("replay")
      setCurrentActionIndex(0)
      start()
    }
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "touchstart"]
    events.forEach(e => window.addEventListener(e, begin, { once: true }))
    return () => events.forEach(e => window.removeEventListener(e, begin))
  }, [started, start])

  const isBuffering = started && !isComplete && currentActionIndex >= streamedActions.length

  return (
    <Theme
      accentColor="mint"
      appearance="dark"
      panelBackground="translucent"
      radius="large"
    >
      <Flex direction="column" justify="center" align="center">
        {/* status strip */}
        <Flex gap="3" align="center" style={{ padding: 8, fontFamily: "monospace", fontSize: 13 }}>
          {!started && <span>click anywhere to start the simulated stream…</span>}
          {started && (
            <>
              <span>
                streamed {streamedActions.length}/{total} · playing #{Math.min(currentActionIndex + 1, total)}
              </span>
              <span style={badgeStyle(isStreaming, "#7ee787")}>streaming</span>
              <span style={badgeStyle(isBuffering && isStreaming, "#f0b72f")}>buffering</span>
              <span style={badgeStyle(isComplete, "#79c0ff")}>complete</span>
            </>
          )}
        </Flex>
        <Box
          style={{
            height: "calc(100vh - 40px)",
            width: "100vw",
          }}
        >
          <CodeVideoIDE
            theme="dark"
            project={streamedActions}
            mode={mode}
            allowFocusInEditor={false}
            defaultLanguage={"typescript"}
            isExternalBrowserStepUrl={null}
            currentActionIndex={currentActionIndex}
            currentLessonIndex={null}
            isSoundOn={false}
            withCaptions={true}
            isStreaming={isStreaming}
            actionFinishedCallback={() => setCurrentActionIndex(i => i + 1)}
            playBackCompleteCallback={() => setIsComplete(true)}
            speakActionAudios={[]}
            fileExplorerWidth={400}
            terminalHeight={250}
            mouseColor="green"
            fontSizePx={16}
            keyboardTypingPauseMs={30}
            standardPauseMs={400}
            longPauseMs={1000}
            resolution="1080p"
            showDevBox={false}
          />
        </Box>
      </Flex>
    </Theme>
  )
}
