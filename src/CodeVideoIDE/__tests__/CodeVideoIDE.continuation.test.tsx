import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { CodeVideoIDE } from '../../CodeVideoIDE.jsx';
import { IAction, Project, IFileEntry, ICodeVideoIDEProps } from '@fullstackcraftllc/codevideo-types';

// Mock the child components to avoid complex rendering and focus on state logic
jest.mock('../../SlideViewer/SlideViewer', () => ({
  SlideViewer: ({ slideMarkdown }: { slideMarkdown: string }) => (
    <div data-testid="slide-viewer">Slide Content: {slideMarkdown}</div>
  )
}));

jest.mock('../../ExternalWebViewer/ExternalWebViewer', () => ({
  ExternalWebViewer: ({ url }: { url: string }) => (
    <div data-testid="external-web-viewer">External Browser: {url}</div>
  )
}));

jest.mock('../../WebPreview/WebPreview', () => ({
  WebPreview: ({ files }: { files: IFileEntry[] }) => (
    <div data-testid="web-preview">Web Preview: {files.length} files</div>
  )
}));

jest.mock('../../FileExplorer/FileExplorer', () => ({
  FileExplorer: () => <div data-testid="file-explorer">File Explorer</div>
}));

jest.mock('../../Editor/EditorTabs', () => ({
  EditorTabs: () => <div data-testid="editor-tabs">Editor Tabs</div>
}));

jest.mock('../../Terminal/Terminal', () => ({
  Terminal: () => <div data-testid="terminal">Terminal</div>
}));

jest.mock('../../MouseOverlay/MouseOverlay', () => ({
  MouseOverlay: () => <div data-testid="mouse-overlay">Mouse Overlay</div>
}));

jest.mock('../../CaptionOverlay/CaptionOverlay', () => ({
  CaptionOverlay: () => <div data-testid="caption-overlay">Caption Overlay</div>
}));

jest.mock('../../EmbedOverlay/EmbedOverlay', () => ({
  EmbedOverlay: () => <div data-testid="embed-overlay">Embed Overlay</div>
}));

jest.mock('../../UnsavedChangesDialog/UnsavedChangesDialog', () => ({
  UnsavedChangesDialog: () => <div data-testid="unsaved-changes-dialog">Unsaved Changes Dialog</div>
}));

// Helper function to create a test project
const createTestProject = (actions: IAction[]): Project => ({
  id: 'test-project',
  name: 'Test Project',
  description: 'Test project for continuation behavior',
  primaryLanguage: 'javascript',
  lessons: [{
    id: 'test-lesson',
    name: 'Test Lesson',
    description: 'Test lesson for continuation behavior',
    actions: actions
  }]
});

// Helper component to wrap CodeVideoIDE with Theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Theme>{children}</Theme>
);

// Base props for CodeVideoIDE component
const baseProps: ICodeVideoIDEProps = {
  mode: 'step',
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
  mouseColor: 'black',
  project: createTestProject([]), // Will be overridden in tests
  currentActionIndex: 0 // Will be overridden in tests
};

describe('CodeVideoIDE Continuation Behavior', () => {
  describe('Slide Display Continuation', () => {
    it('should continue displaying slide during subsequent author-speak action when stepping forward', async () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: 'Test Slide Content' },
        { name: 'author-speak-before', value: 'This is narration over the slide' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      // First action: slide-display should show the slide
      await waitFor(() => {
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
        expect(screen.getByText('Slide Content: Test Slide Content')).toBeInTheDocument();
      });

      // Step forward to author-speak action - slide should continue displaying
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={1}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
        expect(screen.getByText('Slide Content: Test Slide Content')).toBeInTheDocument();
      });
    });

    it('should hide slide when stepping backward from author-speak to non-display action', async () => {
      const actions: IAction[] = [
        { name: 'file-explorer-create-file', value: 'test.js' },
        { name: 'slide-display', value: 'Test Slide Content' },
        { name: 'author-speak-before', value: 'This is narration over the slide' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={2}
          />
        </TestWrapper>
      );

      // Start at author-speak action - slide should be visible
      await waitFor(() => {
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      });

      // Step backward to file-create action - slide should hide
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      });
    });
  });

  describe('External Web Preview Continuation', () => {
    it('should continue displaying web preview during subsequent author-speak action when stepping forward', async () => {
      const actions: IAction[] = [
        { name: 'external-web-preview', value: '' },
        { name: 'author-speak-before', value: 'This is narration over the web preview' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      // First action: external-web-preview should show the web preview
      await waitFor(() => {
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
      });

      // Step forward to author-speak action - web preview should continue displaying
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={1}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
      });
    });

    it('should hide web preview when stepping backward from author-speak to non-preview action', async () => {
      const actions: IAction[] = [
        { name: 'file-explorer-create-file', value: 'test.js' },
        { name: 'external-web-preview', value: '' },
        { name: 'author-speak-before', value: 'This is narration over the web preview' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={2}
          />
        </TestWrapper>
      );

      // Start at author-speak action - web preview should be visible
      await waitFor(() => {
        expect(screen.getByTestId('web-preview')).toBeInTheDocument();
      });

      // Step backward to file-create action - web preview should hide
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('web-preview')).not.toBeInTheDocument();
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      });
    });
  });

  describe('External Browser Continuation', () => {
    it('should continue displaying external browser during subsequent author-speak action when stepping forward', async () => {
      const actions: IAction[] = [
        { name: 'external-browser', value: 'https://example.com' },
        { name: 'author-speak-before', value: 'This is narration over the external browser' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      // First action: external-browser should show the external web viewer
      await waitFor(() => {
        expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
        expect(screen.getByText('External Browser: https://example.com')).toBeInTheDocument();
      });

      // Step forward to author-speak action - external browser should continue displaying
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={1}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
        expect(screen.getByText('External Browser: https://example.com')).toBeInTheDocument();
      });
    });

    it('should hide external browser when stepping backward from author-speak to non-browser action', async () => {
      const actions: IAction[] = [
        { name: 'file-explorer-create-file', value: 'test.js' },
        { name: 'external-browser', value: 'https://example.com' },
        { name: 'author-speak-before', value: 'This is narration over the external browser' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={2}
          />
        </TestWrapper>
      );

      // Start at author-speak action - external browser should be visible
      await waitFor(() => {
        expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
      });

      // Step backward to file-create action - external browser should hide
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('external-web-viewer')).not.toBeInTheDocument();
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      });
    });
  });

  describe('Priority and Complex Scenarios', () => {
    it('should prioritize external browser over slide when both are active', async () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: 'Test Slide' },
        { name: 'external-browser', value: 'https://example.com' },
        { name: 'author-speak-before', value: 'Narration' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={1}
          />
        </TestWrapper>
      );

      // Should show external browser, not slide
      await waitFor(() => {
        expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });

      // Step to author-speak - should continue showing external browser
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={2}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-web-viewer')).toBeInTheDocument();
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple consecutive author-speak actions correctly', async () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: 'Test Slide' },
        { name: 'author-speak-before', value: 'First narration' },
        { name: 'author-speak-before', value: 'Second narration' },
        { name: 'author-speak-before', value: 'Third narration' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={0}
          />
        </TestWrapper>
      );

      // Start with slide display
      await waitFor(() => {
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      });

      // Step through all author-speak actions - slide should remain visible
      for (let i = 1; i <= 3; i++) {
        rerender(
          <TestWrapper>
            <CodeVideoIDE 
              {...baseProps}
              project={project}
              currentActionIndex={i}
            />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
          expect(screen.getByText('Slide Content: Test Slide')).toBeInTheDocument();
        });
      }
    });

    it('should reset continuation state when moving to non-author action', async () => {
      const actions: IAction[] = [
        { name: 'slide-display', value: 'Test Slide' },
        { name: 'author-speak-before', value: 'Narration' },
        { name: 'file-explorer-create-file', value: 'newfile.js' }
      ];
      
      const project = createTestProject(actions);
      
      const { rerender } = render(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={1}
          />
        </TestWrapper>
      );

      // Start at author-speak with slide visible
      await waitFor(() => {
        expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      });

      // Move to file-create action - slide should hide and normal IDE should show
      rerender(
        <TestWrapper>
          <CodeVideoIDE 
            {...baseProps}
            project={project}
            currentActionIndex={2}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
      });
    });
  });
});
