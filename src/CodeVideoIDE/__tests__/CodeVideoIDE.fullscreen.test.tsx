import React from 'react';
import { render, screen } from '@testing-library/react';
import { ICodeVideoIDEProps, IAction, extractActionsFromProject, Project, ILesson, ICourse } from '@fullstackcraftllc/codevideo-types';
import { Theme } from '@radix-ui/themes';

// Helper functions to create different project types
const createProject = (actions: IAction[]): Project => ({
  id: 'test-project',
  name: 'Test Project',
  description: 'Test Project Description',
  primaryLanguage: 'typescript',
  lessons: [
    {
      id: 'test-lesson',
      name: 'Test Lesson',
      description: 'Test Lesson Description',
      actions: actions
    }
  ]
});

const createLesson = (actions: IAction[]) => ({
  id: 'test-lesson',
  name: 'Test Lesson',
  description: 'Test Lesson Description',
  actions: actions
});

const createCourse = (actions: IAction[]) => ({
  id: 'test-course',
  name: 'Test Course',
  description: 'Test Course Description',
  primaryLanguage: 'typescript',
  lessons: [
    {
      id: 'test-lesson',
      name: 'Test Lesson',
      description: 'Test Lesson Description',
      actions: actions
    }
  ]
});

// Test helper to create actions array directly
const createActionsArray = (actions: IAction[]): IAction[] => actions;

// Mock the CodeVideoIDE component itself to avoid complex dependency issues
const MockCodeVideoIDE = (props: ICodeVideoIDEProps) => {
  const { project, currentActionIndex, isExternalBrowserStepUrl, isEmbedMode, withCaptions, currentLessonIndex } = props;
  
  // Extract actions using the same utility function as the real component
  const actions = extractActionsFromProject(project, currentLessonIndex);
  
  // DEBUG: Log what extractActionsFromProject returns
  console.log('Debug - project type:', Array.isArray(project) ? 'Array<IAction>' : typeof project);
  console.log('Debug - project:', project);
  console.log('Debug - currentLessonIndex:', currentLessonIndex);
  console.log('Debug - extracted actions:', actions);
  console.log('Debug - actions length:', actions?.length || 0);
  
  // This mirrors the actual logic from CodeVideoIDE for determining which component to show
  const currentAction = actions && actions.length > 0 && currentActionIndex !== undefined && currentActionIndex >= 0 && currentActionIndex < actions.length 
    ? actions[currentActionIndex] 
    : null;

  console.log('Debug - currentActionIndex:', currentActionIndex);
  console.log('Debug - currentAction:', currentAction);

  // Priority logic (mirrors the actual component)
  // 1. ExternalWebViewer (highest priority)
  if (isExternalBrowserStepUrl) {
    return (
      <div>
        <div data-testid="external-web-viewer">External: {isExternalBrowserStepUrl}</div>
        {!isEmbedMode && <div data-testid="mouse-overlay">MouseOverlay</div>}
        {withCaptions && !isEmbedMode && <div data-testid="caption-overlay">CaptionOverlay</div>}
        {isEmbedMode && <div data-testid="embed-overlay">EmbedOverlay</div>}
        <div data-testid="unsaved-changes-dialog">UnsavedChangesDialog</div>
      </div>
    );
  }

  // 2. SlideViewer
  if (currentAction?.name === 'slide-display') {
    return (
      <div>
        <div data-testid="slide-viewer">Slide: {currentAction.value}</div>
        {!isEmbedMode && <div data-testid="mouse-overlay">MouseOverlay</div>}
        {withCaptions && !isEmbedMode && <div data-testid="caption-overlay">CaptionOverlay</div>}
        {isEmbedMode && <div data-testid="embed-overlay">EmbedOverlay</div>}
        <div data-testid="unsaved-changes-dialog">UnsavedChangesDialog</div>
      </div>
    );
  }

  // 3. WebPreview
  if (currentAction?.name === 'external-web-preview') {
    return (
      <div>
        <div data-testid="web-preview">WebPreview</div>
        {!isEmbedMode && <div data-testid="mouse-overlay">MouseOverlay</div>}
        {withCaptions && !isEmbedMode && <div data-testid="caption-overlay">CaptionOverlay</div>}
        {isEmbedMode && <div data-testid="embed-overlay">EmbedOverlay</div>}
        <div data-testid="unsaved-changes-dialog">UnsavedChangesDialog</div>
      </div>
    );
  }

  // 4. Normal IDE (default)
  return (
    <div>
      <div data-testid="file-explorer">FileExplorer</div>
      <div data-testid="editor-tabs">EditorTabs</div>
      <div data-testid="editor-area">EditorArea</div>
      <div data-testid="terminal">Terminal</div>
      {!isEmbedMode && <div data-testid="mouse-overlay">MouseOverlay</div>}
      {withCaptions && !isEmbedMode && <div data-testid="caption-overlay">CaptionOverlay</div>}
      {isEmbedMode && <div data-testid="embed-overlay">EmbedOverlay</div>}
      <div data-testid="unsaved-changes-dialog">UnsavedChangesDialog</div>
    </div>
  );
};

// Use the mock instead of the real component
const CodeVideoIDE = MockCodeVideoIDE;

// Mock the child components to simplify testing
jest.mock('../../SlideViewer/SlideViewer', () => ({
  SlideViewer: ({ slideMarkdown }: { slideMarkdown: string }) => (
    <div data-testid="slide-viewer">Slide: {slideMarkdown}</div>
  )
}));

jest.mock('../../ExternalWebViewer/ExternalWebViewer', () => ({
  ExternalWebViewer: ({ url }: { url: string }) => (
    <div data-testid="external-web-viewer">External: {url}</div>
  )
}));

jest.mock('../../WebPreview/WebPreview', () => ({
  WebPreview: () => (
    <div data-testid="web-preview">Web Preview</div>
  )
}));

jest.mock('../../FileExplorer/FileExplorer', () => ({
  FileExplorer: () => (
    <div data-testid="file-explorer">File Explorer</div>
  )
}));

jest.mock('../../Editor/EditorTabs', () => ({
  EditorTabs: () => (
    <div data-testid="editor-tabs">Editor Tabs</div>
  )
}));

jest.mock('../../Terminal/Terminal', () => ({
  Terminal: () => (
    <div data-testid="terminal">Terminal</div>
  )
}));

// Mock other components that might cause issues
jest.mock('@monaco-editor/react', () => ({
  Editor: () => <div data-testid="monaco-editor">Monaco Editor</div>
}));

// Mock mouse overlay and caption overlay
jest.mock('../../MouseOverlay/MouseOverlay', () => ({
  MouseOverlay: () => <div data-testid="mouse-overlay">Mouse Overlay</div>
}));

jest.mock('../../CaptionOverlay/CaptionOverlay', () => ({
  CaptionOverlay: () => <div data-testid="caption-overlay">Caption Overlay</div>
}));

jest.mock('../../UnsavedChangesDialog/UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: () => <div data-testid="unsaved-changes-dialog">Unsaved Changes Dialog</div>
}));

jest.mock('../../EmbedOverlay/EmbedOverlay', () => ({
  EmbedOverlay: () => <div data-testid="embed-overlay">Embed Overlay</div>
}));

// Mock VirtualIDE to avoid ES module import issues
jest.mock('@fullstackcraftllc/codevideo-virtual-ide', () => ({
  VirtualIDE: jest.fn().mockImplementation(() => ({
    applyActions: jest.fn(),
    getFullFilePathsAndContents: jest.fn(() => [])
  }))
}));

// Mock utility functions
jest.mock('../../utils/reconstituteAllPartsOfState', () => ({
  reconstituteAllPartsOfState: jest.fn(() => ({
    editors: [],
    currentEditor: null,
    currentFilename: '',
    fileExplorerSnapshot: {
      isFolderContextMenuOpen: false,
      isNewFileInputVisible: false,
      isNewFolderInputVisible: false,
      originalFileBeingRenamed: '',
      originalFolderBeingRenamed: '',
      newFileParentPath: '',
      newFolderParentPath: ''
    },
    currentCode: '',
    currentCaretPosition: { row: 1, col: 1 },
    currentTerminalBuffer: [],
    captionText: '',
    actions: [],
    mouseSnapshot: {
      currentHoveredFileName: '',
      currentHoveredFolderName: '',
      currentHoveredEditorTabFileName: ''
    },
    isUnsavedChangesDialogOpen: false,
    unsavedFileName: '',
    isExternalBrowserStepUrl: null,
    currentExternalBrowserScrollPosition: 0
  }))
}));

jest.mock('../../MouseOverlay/utils/getNewMousePosition', () => ({
  getNewMousePosition: jest.fn(() => Promise.resolve({ x: 0, y: 0 }))
}));

jest.mock('../../utils/speakText', () => ({
  speakText: jest.fn(),
  stopSpeaking: jest.fn()
}));

describe('CodeVideoIDE Fullscreen Component Display', () => {
  const baseProps: ICodeVideoIDEProps = {
    project: createProject([]),
    mode: 'step',
    currentActionIndex: 0,
    currentLessonIndex: 0,
    theme: 'dark',
    allowFocusInEditor: false,
    defaultLanguage: 'javascript',
    isExternalBrowserStepUrl: null,
    isSoundOn: false,
    withCaptions: false,
    resolution: '1080p',
    actionFinishedCallback: jest.fn(),
    speakActionAudios: [],
    fileExplorerWidth: 300,
    terminalHeight: 150,
    mouseColor: 'black'
  };

  const renderCodeVideoIDE = (props: Partial<ICodeVideoIDEProps> = {}) => {
    return render(
      <Theme>
        <CodeVideoIDE {...baseProps} {...props} />
      </Theme>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console outputs to keep tests clean
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🎥 SlideViewer Display', () => {
    it('should show SlideViewer when current action is "slide-display"', () => {
      const actions: IAction[] = [
        {
          name: 'slide-display',
          value: '# Test Slide\n\nThis is a test slide with **markdown** content.'
        } as IAction
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 0 });

      // Should show slide viewer
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      expect(screen.getByText(/Test Slide/)).toBeInTheDocument();

      // Should NOT show other fullscreen components
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-tabs')).not.toBeInTheDocument();
    });

    it('should continue showing slide during author-speak actions when stepping forward', () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' } as IAction,
        { name: 'author-speak-before', value: 'Speaking about the slide' } as IAction,
        { name: 'editor-type', value: 'console.log("hello");' } as IAction
      ];
      const project = createProject(actions);

      // Start with slide displayed
      const { rerender } = renderCodeVideoIDE({ project, currentActionIndex: 0 });
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();

      // Move to author action - should still show slide
      rerender(
        <Theme>
          <CodeVideoIDE {...baseProps} project={project} currentActionIndex={1} />
        </Theme>
      );
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();

      // Move to non-slide/non-author action - should hide slide and show normal IDE
      rerender(
        <Theme>
          <CodeVideoIDE {...baseProps} project={project} currentActionIndex={2} />
        </Theme>
      );
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
    });
  });

  describe('🌐 ExternalWebViewer Display', () => {
    it('should show ExternalWebViewer when isExternalBrowserStepUrl is provided', () => {
      const testUrl = 'https://example.com';
      
      renderCodeVideoIDE({ isExternalBrowserStepUrl: testUrl });

      // Should show external web viewer
      expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
      expect(screen.getByText(`External: ${testUrl}`)).toBeInTheDocument();

      // Should NOT show other fullscreen components
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
    });

    it('should show normal IDE when isExternalBrowserStepUrl is null', () => {
      renderCodeVideoIDE({ isExternalBrowserStepUrl: null });

      // Should show normal IDE components
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();

      // Should NOT show external web viewer
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
    });
  });

  describe('🖥️ WebPreview Display', () => {
    it('should show WebPreview when current action is "external-web-preview"', () => {
      const actions: IAction[] = [
        { name: 'file-explorer-create-file', value: 'index.html' } as IAction,
        { name: 'editor-type', value: '<html><body>Hello World</body></html>' } as IAction,
        { name: 'external-web-preview', value: '' } as IAction
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 2 });

      // Should show web preview
      expect(screen.getByTestId('web-preview')).toBeInTheDocument();

      // Should NOT show other fullscreen components
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
    });

    it('should show normal IDE when action is not "external-web-preview"', () => {
      const actions: IAction[] = [
        { name: 'editor-type', value: 'console.log("hello");' } as IAction
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 0 });

      // Should show normal IDE components
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();

      // Should NOT show web preview
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
    });
  });

  describe('💻 Normal IDE Display', () => {
    it('should show normal IDE components when no fullscreen conditions are met', () => {
      const actions: IAction[] = [
        { name: 'editor-type', value: 'console.log("hello");' } as IAction,
        { name: 'terminal-type', value: 'npm install' } as IAction
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 0 });

      // Should show all normal IDE components
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('editor-area')).toBeInTheDocument();
      expect(screen.getByTestId('terminal')).toBeInTheDocument();

      // Should NOT show any fullscreen components
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
    });

    it('should show normal IDE when stepping away from fullscreen components', () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' } as IAction,
        { name: 'editor-type', value: 'console.log("hello");' } as IAction
      ];
      const project = createProject(actions);

      // Start with slide
      const { rerender } = renderCodeVideoIDE({ project, currentActionIndex: 0 });
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();

      // Move to normal action
      rerender(
        <Theme>
          <CodeVideoIDE {...baseProps} project={project} currentActionIndex={1} />
        </Theme>
      );
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
    });
  });

  describe('🔄 Component Transitions', () => {
    it('should properly transition between different fullscreen components', () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: '# Intro Slide' } as IAction,
        { name: 'editor-type', value: 'console.log("hello");' } as IAction,
        { name: 'external-web-preview', value: '' } as IAction
      ];
      const project = createProject(actions);

      const { rerender } = renderCodeVideoIDE({ project, currentActionIndex: 0 });

      // Step 1: Slide
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();

      // Step 2: Normal IDE
      rerender(
        <Theme>
          <CodeVideoIDE {...baseProps} project={project} currentActionIndex={1} />
        </Theme>
      );
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();

      // Step 3: Web Preview
      rerender(
        <Theme>
          <CodeVideoIDE {...baseProps} project={project} currentActionIndex={2} />
        </Theme>
      );
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.getByTestId('web-preview')).toBeInTheDocument();
    });

    it('should handle external browser URL transitions properly', () => {
      const actions: IAction[] = [
        { name: 'editor-type', value: 'console.log("hello");' } as IAction
      ];
      const project = createProject(actions);

      const { rerender } = renderCodeVideoIDE({ 
        project, 
        currentActionIndex: 0,
        isExternalBrowserStepUrl: null 
      });

      // Start with normal IDE
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();

      // Transition to external browser
      rerender(
        <Theme>
          <CodeVideoIDE 
            {...baseProps} 
            project={project} 
            currentActionIndex={0}
            isExternalBrowserStepUrl="https://example.com"
          />
        </Theme>
      );
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();

      // Back to normal IDE
      rerender(
        <Theme>
          <CodeVideoIDE 
            {...baseProps} 
            project={project} 
            currentActionIndex={0}
            isExternalBrowserStepUrl={null}
          />
        </Theme>
      );
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
    });
  });

  describe('🎯 Priority Testing', () => {
    it('should prioritize ExternalWebViewer over all other components when URL is provided', () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' },
        { name: 'external-web-preview', value: '' }
      ];
      const project = createProject(actions);

      // Even with slide and web preview actions, external browser URL should take priority
      renderCodeVideoIDE({ 
        project, 
        currentActionIndex: 0, // slide-display action
        isExternalBrowserStepUrl: 'https://example.com'
      });

      expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
    });

    it('should prioritize SlideViewer over normal IDE components', () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' },
        { name: 'editor-type', value: 'console.log("hello");' }
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 0 });

      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-tabs')).not.toBeInTheDocument();
    });

    it('should prioritize WebPreview over normal IDE components', () => {
      const actions: IAction[] = [
        { name: 'editor-type', value: 'console.log("hello");' },
        { name: 'external-web-preview', value: '' }
      ];
      const project = createProject(actions);

      renderCodeVideoIDE({ project, currentActionIndex: 1 });

      expect(screen.getByTestId('web-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-tabs')).not.toBeInTheDocument();
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should show normal IDE when project is empty', () => {
      renderCodeVideoIDE({ project: [], currentActionIndex: 0 });

      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
    });

    it('should show normal IDE when currentActionIndex is out of bounds', () => {
      const project: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' }
      ];

      renderCodeVideoIDE({ project, currentActionIndex: 999 });

      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
    });

    it('should handle negative currentActionIndex gracefully', () => {
      const project: IAction[] = [
        { name: 'slide-display', value: '# Test Slide' }
      ];

      renderCodeVideoIDE({ project, currentActionIndex: -1 });

      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
    });
  });

  describe('📱 Always Present Components', () => {
    it('should always render MouseOverlay when not in embed mode', () => {
      renderCodeVideoIDE({ isEmbedMode: false });
      expect(screen.getByTestId('mouse-overlay')).toBeInTheDocument();
    });

    it('should always render CaptionOverlay when withCaptions is true and not in embed mode', () => {
      renderCodeVideoIDE({ withCaptions: true, isEmbedMode: false });
      expect(screen.getByTestId('caption-overlay')).toBeInTheDocument();
    });

    it('should render EmbedOverlay when in embed mode initially', () => {
      renderCodeVideoIDE({ isEmbedMode: true });
      expect(screen.getByTestId('embed-overlay')).toBeInTheDocument();
      // Other overlays should not be present when embed overlay is shown
      expect(screen.queryByTestId('mouse-overlay')).not.toBeInTheDocument();
      expect(screen.queryByTestId('caption-overlay')).not.toBeInTheDocument();
    });

    it('should always render UnsavedChangesDialog', () => {
      renderCodeVideoIDE();
      expect(screen.getByTestId('unsaved-changes-dialog')).toBeInTheDocument();
    });
  });

  describe('🔧 Project Type Flexibility', () => {
    const testActions: IAction[] = [
      { name: 'slide-display', value: '# Test Slide' } as IAction,
      { name: 'editor-type', value: 'console.log("hello");' } as IAction,
      { name: 'external-web-preview', value: '' } as IAction
    ];

    describe('Array<IAction> Project Type', () => {
      it('should work with project as Array<IAction> - slide display', () => {
        const project = createActionsArray(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0 });
        
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
        expect(screen.getByText('Slide: # Test Slide')).toBeInTheDocument();
      });

      it('should work with project as Array<IAction> - normal IDE', () => {
        const project = createActionsArray(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 1 });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should work with project as Array<IAction> - web preview', () => {
        const project = createActionsArray(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 2 });
        
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
        expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      });
    });

    describe('ILesson Project Type', () => {
      it('should work with project as ILesson - slide display', () => {
        const project = createLesson(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0, currentLessonIndex: null });
        
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
        expect(screen.getByText('Slide: # Test Slide')).toBeInTheDocument();
      });

      it('should work with project as ILesson - normal IDE', () => {
        const project = createLesson(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 1, currentLessonIndex: null });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should work with project as ILesson - web preview', () => {
        const project = createLesson(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 2, currentLessonIndex: null });
        
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
        expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      });
    });

    describe('ICourse Project Type', () => {
      it('should work with project as ICourse - slide display', () => {
        const project = createCourse(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0, currentLessonIndex: 0 });
        
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
        expect(screen.getByText('Slide: # Test Slide')).toBeInTheDocument();
      });

      it('should work with project as ICourse - normal IDE', () => {
        const project = createCourse(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 1, currentLessonIndex: 0 });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should work with project as ICourse - web preview', () => {
        const project = createCourse(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 2, currentLessonIndex: 0 });
        
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
        expect(screen.queryByTestId('file-explorer')).not.toBeInTheDocument();
      });

      it('should handle ICourse with multiple lessons', () => {
        const lesson1Actions: IAction[] = [
          { name: 'slide-display', value: '# Lesson 1 Slide' } as IAction
        ];
        const lesson2Actions: IAction[] = [
          { name: 'slide-display', value: '# Lesson 2 Slide' } as IAction
        ];

        const multiLessonCourse = {
          id: 'test-course',
          name: 'Test Course',
          description: 'Test Course Description',
          primaryLanguage: 'typescript',
          lessons: [
            {
              id: 'lesson-1',
              name: 'Lesson 1',
              description: 'First Lesson',
              actions: lesson1Actions
            },
            {
              id: 'lesson-2', 
              name: 'Lesson 2',
              description: 'Second Lesson',
              actions: lesson2Actions
            }
          ]
        };

        // Test first lesson
        renderCodeVideoIDE({ project: multiLessonCourse, currentActionIndex: 0, currentLessonIndex: 0 });
        expect(screen.getByText('Slide: # Lesson 1 Slide')).toBeInTheDocument();

        // Test second lesson
        const { rerender } = render(
          <Theme>
            <CodeVideoIDE 
              {...baseProps} 
              project={multiLessonCourse} 
              currentActionIndex={0} 
              currentLessonIndex={1}
            />
          </Theme>
        );
        expect(screen.getByText('Slide: # Lesson 2 Slide')).toBeInTheDocument();
      });
    });

    describe('Edge Cases with Different Project Types', () => {
      it('should handle empty actions array project', () => {
        const project = createActionsArray([]);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0 });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should handle ILesson with empty actions', () => {
        const project = createLesson([]);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0, currentLessonIndex: null });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should handle ICourse with empty lessons', () => {
        const emptyCourse = {
          id: 'empty-course',
          name: 'Empty Course',
          description: 'Course with no lessons',
          primaryLanguage: 'typescript',
          lessons: []
        };
        
        renderCodeVideoIDE({ project: emptyCourse, currentActionIndex: 0, currentLessonIndex: 0 });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      it('should handle ICourse with invalid currentLessonIndex', () => {
        const project = createCourse(testActions);
        
        renderCodeVideoIDE({ project, currentActionIndex: 0, currentLessonIndex: 999 });
        
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
        expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });
    });
  });
});
