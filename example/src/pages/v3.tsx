import * as React from "react"
import { ICodeVideoIDEProps, GUIMode, IAction, IAudioItem, ICodeVideoManifest, Project, extractActionsFromProject } from "@fullstackcraftllc/codevideo-types"
import { CodeVideoIDE } from "@fullstackcraftllc/codevideo-ide-react"
import { Box, Flex, Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

// this example is nearly the same as the record example, but with some puppeteer window injections
// it also loads the manifest from the CodeVideo API running at localhost:7000
// this is the static page used by the codevideo-cli
export default function Puppeteer() {
  const [mode, setMode] = useState<GUIMode>('step')
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [project, setProject] = useState<Project>([])
  const [actions, setActions] = useState<IAction[]>([])
  // const [currentLessonIndex, setCurrentLessonIndex] = useState<number | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number | null>(null)
  const [audioItems, setAudioItems] = useState<Array<IAudioItem>>([])
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false)
  const [monacoLoaded, setMonacoLoaded] = useState<boolean>(false)

  // CodeVideoIDE props state with defaults
  const [ideProps, setIdeProps] = useState<ICodeVideoIDEProps>({
    project: [],
    mode: 'step',
    currentLessonIndex: 0,
    currentActionIndex: 0,
    isSoundOn: false,
    actionFinishedCallback: () => {},
    speakActionAudios: [],
    theme: 'dark',
    allowFocusInEditor: true,
    defaultLanguage: 'python',
    isExternalBrowserStepUrl: null,
    withCaptions: true,
    fileExplorerWidth: 400,
    terminalHeight: 350,
    mouseColor: "black",
    fontSizePx: 26,
    keyboardTypingPauseMs: 40,
    standardPauseMs: 200,
    longPauseMs: 200,
    resolution: '1080p',
    showDevBox: false,
  })

  // on user interaction, set mode to 'replay' and reset the current action index
  const [readyToReplay, setReadyToReplay] = useState(false)

  // Expose the __startRecording function globally.
  // also log any error or unhandled rejection to the console
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.error("This code is intended to run in a browser environment.");
      return;
    }
    
    (window as any).__startRecording = () => {
      console.log("[__startRecording] Recording triggered programmatically!");
      console.log("[__startRecording] Current state:", {
        project: Array.isArray(project) ? `actions array (${project.length})` : typeof project,
        actions: actions.length,
        currentLessonIndex,
        monacoLoaded,
        readyToReplay
      });
      setReadyToReplay(true);
    };

    (window as any).addEventListener('error', (event) => {
        console.error('Global error caught:', JSON.stringify({
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error?.stack
        }));
    });

    (window as any).addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', JSON.stringify(event));
    });
  }, []);

  useEffect(() => {
    console.log("[V3 useEffect] readyToReplay:", readyToReplay, "monacoLoaded:", monacoLoaded);
    console.log("[V3 useEffect] project:", project);
    console.log("[V3 useEffect] actions length:", actions.length);
    console.log("[V3 useEffect] currentLessonIndex:", currentLessonIndex);
    
    if (readyToReplay && monacoLoaded) {
      // Extra validation before starting replay
      if (!project || (Array.isArray(project) && project.length === 0)) {
        console.error("[V3 useEffect] Project is not loaded yet, cannot start replay!");
        console.error("[V3 useEffect] Project value:", project);
        return;
      }
      
      if (actions.length === 0) {
        console.error("[V3 useEffect] No actions available, cannot start replay!");
        console.error("[V3 useEffect] Actions:", actions);
        return;
      }
      
      console.log('[V3 useEffect] Starting replay...')
      console.log('[V3 useEffect] Project type:', Array.isArray(project) ? 'actions array' : typeof project);
      console.log('[V3 useEffect] First few actions:', actions.slice(0, 3).map(a => ({ name: a.name, value: a.value?.substring(0, 50) + '...' })));
      
      setCurrentActionIndex(0)
      setMode('replay')
      setIsSoundOn(true)
      if (typeof (window as any).__onActionProgress === 'function') {
        (window as any).__onActionProgress({
          currentAction: currentActionIndex,
          totalActions: actions.length,
          progress: 0,
          actionName: actions[currentActionIndex]?.name || `Action ${currentActionIndex}`,
          actionValue: actions[currentActionIndex]?.value || '',
          timestamp: Date.now().toLocaleString()
        });
      }
    }
  }, [readyToReplay, monacoLoaded, project, actions])

  // gets manifest from the CodeVideo API running at localhost:7000
  const getManifest = async (uuid: string) => {
    try {
      console.log("[getManifest] Fetching manifest for UUID:", uuid);
      const response = await fetch(`http://localhost:7000/get-manifest-v3?uuid=${uuid}`)
      const data: ICodeVideoManifest = await response.json()
      console.log("\n-------------------\n\n\nMANIFEST DATA:\n", JSON.stringify(data, null, 2), "\n\n-------------------\n")

      // if data.actions is defined, set the actions
      let project: Project | undefined
      let lessonIndex: number | null = null
      if (data && data.actions) {
        project = data.actions
        lessonIndex = null // When project is actions array, use null
        console.log(`[getManifest] FOUND ${data.actions.length} actions in manifest`)
        console.log(`[getManifest] First action:`, JSON.stringify(data.actions[0]));
        console.log(`[getManifest] Last action:`, JSON.stringify(data.actions[data.actions.length - 1]));
        setActions(data.actions)
        console.log('[getManifest] Setting project to actions array, currentLessonIndex should be null')
      } else if (data.lesson) {
        project = data.lesson
        lessonIndex = null // When project is a single lesson, use null (not 0)
        console.log(`[getManifest] FOUND ${data.lesson.actions.length} actions in lesson`)
        console.log(`[getManifest] Lesson structure:`, JSON.stringify(Object.keys(data.lesson)));
        console.log(`[getManifest] First lesson action:`, JSON.stringify(data.lesson.actions[0]));
        setActions(data.lesson.actions)
        console.log('[getManifest] Setting project to lesson object, currentLessonIndex should be null')
      } else {
        console.error("[getManifest] No actions or lesson found in manifest data!");
        console.error("[getManifest] Data keys:", Object.keys(data || {}));
      }
      
      console.log("[getManifest] About to set project and actions");
      console.log("[getManifest] Project type:", Array.isArray(project) ? 'array' : typeof project);
      console.log("[getManifest] Lesson index:", lessonIndex);
      
      setProject(project || [])
      setCurrentLessonIndex(lessonIndex)
      setAudioItems(data.audioItems)

      // Apply codeVideoIDEProps from manifest if they exist
      if (data.codeVideoIDEProps) {
        console.log("[getManifest] Applying IDE props from manifest:", data.codeVideoIDEProps);
        setIdeProps(prevProps => ({
          ...prevProps,
          ...data.codeVideoIDEProps
        }))
      }
      
      console.log("[getManifest] Manifest processing complete");
    } catch (error) {
      console.error("Error getting manifest: ", JSON.stringify(error));
    }
  }

  // on mount, load uuid from "uuid" property in the url
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const uuid = urlParams.get('uuid')
    console.log("[V3 Mount] URL params:", Object.fromEntries(urlParams.entries()));
    if (uuid) {
      console.log("[V3 Mount] Retrieving manifest for uuid: ", uuid)
      getManifest(uuid)
    } else {
      console.log("[V3 Mount] No UUID found in URL parameters");
    }
  }, [])

  // Track state changes
  useEffect(() => {
    console.log("[V3 State] project changed:", Array.isArray(project) ? `actions array (${project.length})` : typeof project);
  }, [project]);

  useEffect(() => {
    console.log("[V3 State] actions changed:", actions.length);
  }, [actions]);

  useEffect(() => {
    console.log("[V3 State] currentLessonIndex changed:", currentLessonIndex);
  }, [currentLessonIndex]);

  useEffect(() => {
    console.log("[V3 State] mode changed:", mode);
  }, [mode]);

  useEffect(() => {
    console.log("[V3 State] currentActionIndex changed:", currentActionIndex);
  }, [currentActionIndex]);

  // NOTE HERE: to continue to the next action in replay mode, you need to implementation a function for the actionFinishedCallback prop
  const goToNextAction = () => {
    console.log("[goToNextAction] Going to next action...")
    console.log("[goToNextAction] Current index:", currentActionIndex, "Total actions:", actions.length);
    const nextIndex = currentActionIndex + 1
    if (nextIndex < actions.length) {
      console.log("[goToNextAction] Moving to action", nextIndex, ":", actions[nextIndex]?.name);
      // Send progress update - see scripts/make-video-from-record-page.js
      if (typeof (window as any).__onActionProgress === 'function') {
        (window as any).__onActionProgress({
          currentAction: nextIndex,
          totalActions: actions.length,
          progress: (nextIndex / actions.length * 100).toFixed(1),
          actionName: actions[nextIndex]?.name || `Action ${nextIndex}`,
          actionValue: actions[nextIndex]?.value || '',
          timestamp: Date.now().toLocaleString()
        });
      }
    } else {
      console.log("[goToNextAction] Reached end of actions, next index would be:", nextIndex);
    }
    setCurrentActionIndex(nextIndex)
  }

  // when the video is complete, you need may want to implement a function for the playBackCompleteCallback prop
  const playBackCompleteCallback = () => {
    console.log("[playBackCompleteCallback] Playback complete!")
    console.log("[playBackCompleteCallback] Final action index:", currentActionIndex);
    console.log("[playBackCompleteCallback] Total actions:", actions.length);
    // Send final progress update (the one with 100%) only once when the final action is reached this is actually when nextIndex === actions.length
    if (typeof (window as any).__onActionProgress === 'function') {
      (window as any).__onActionProgress({
        currentAction: actions.length,
        totalActions: actions.length,
        progress: "100.0",
        actionName: actions[actions.length - 1]?.name || `Action ${actions.length}`,
        actionValue: actions[actions.length - 1]?.value || '',
        timestamp: Date.now().toLocaleString()
      });
    }
  }

  // Note the codevideoIDE must be rendered within a radix <Theme/> scope to render properly
  
  // Log project data just before rendering with proper serialization
  console.log("[V3 Render] About to render CodeVideoIDE with:");
  console.log("[V3 Render] - project type:", Array.isArray(project) ? `array[${project.length}]` : typeof project);
  console.log("[V3 Render] - actions length:", actions.length);
  console.log("[V3 Render] - mode:", mode);
  console.log("[V3 Render] - currentActionIndex:", currentActionIndex);
  console.log("[V3 Render] - currentLessonIndex:", currentLessonIndex);
  
  // Log actual project structure to debug
  if (project) {
    if (Array.isArray(project)) {
      console.log("[V3 Render] - project is actions array with length:", project.length);
      console.log("[V3 Render] - first 3 actions:", JSON.stringify(project.slice(0, 3), null, 2));
    } else {
      console.log("[V3 Render] - project keys:", JSON.stringify(Object.keys(project)));
      if ('actions' in project) {
        console.log("[V3 Render] - project.actions length:", project.actions?.length || 0);
      }
    }
  }
  
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
            {...ideProps}
            // should be project, but something seems broken - just use the actions for now
            project={project}
            // should be currentLessonIndex, but something seems broken
            currentLessonIndex={0}
            mode={mode}
            currentActionIndex={currentActionIndex}
            isSoundOn={isSoundOn}
            actionFinishedCallback={goToNextAction}
            playBackCompleteCallback={playBackCompleteCallback}
            // this example has audios! see codevideo-backend-engine, command: `npm run generate-audio-manifest <your actions json or ts file here> elevenlabs`
            speakActionAudios={audioItems}
            monacoLoadedCallback={() => setMonacoLoaded(true)}
            showDevBox={false} // set to 'true' to show a small dev box in the bottom left corner of the video
          />
        </Box>
      </Flex>
    </Theme>
  )
}
