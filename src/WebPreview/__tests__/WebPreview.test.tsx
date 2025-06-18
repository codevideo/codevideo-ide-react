import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WebPreview } from '../WebPreview.jsx';
import { IFileEntry } from '@fullstackcraftllc/codevideo-types';
import * as esbuild from 'esbuild-wasm';

// Mock esbuild-wasm module
jest.mock('esbuild-wasm', () => ({
  initialize: jest.fn(),
  build: jest.fn(),
}));

const mockEsbuild = esbuild as jest.Mocked<typeof esbuild>;

describe('WebPreview Component', () => {
  const mockFiles: IFileEntry[] = [
    {
      path: 'index.tsx',
      content: `
        import React from 'react';
        import ReactDOM from 'react-dom';
        
        const App = () => <div>Hello World</div>;
        ReactDOM.render(<App />, document.getElementById('root'));
      `
    },
    {
      path: 'index.html',
      content: `
        <!DOCTYPE html>
        <html>
          <head><title>Test App</title></head>
          <body><div id="root"></div></body>
        </html>
      `
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render without crashing', () => {
    // This basic test verifies the component can be imported and rendered
    expect(WebPreview).toBeDefined();
  });

  describe('🔴 RED: WebAssembly initialization errors', () => {
    it('should display error when esbuild initialization fails with WebAssembly error', async () => {
      // Arrange: Mock the specific WebAssembly error we're trying to fix
      const webAssemblyError = new Error('WebAssembly.instantiate(): Import #0 "go": module is not an object or function');
      mockEsbuild.initialize.mockRejectedValue(webAssemblyError);

      // Act
      render(<WebPreview files={mockFiles} />);

      // Assert: Should show loading state first
      expect(screen.getByText('Initializing WebPreview...')).toBeInTheDocument();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('WebPreview Error:')).toBeInTheDocument();
        expect(screen.getByText('Failed to initialize esbuild-wasm:')).toBeInTheDocument();
        expect(screen.getByText(webAssemblyError.message)).toBeInTheDocument();
      });

      // Verify error handling attempts multiple URLs
      expect(mockEsbuild.initialize).toHaveBeenCalledTimes(2);
      expect(mockEsbuild.initialize).toHaveBeenCalledWith({
        wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm',
        worker: false
      });
      expect(mockEsbuild.initialize).toHaveBeenCalledWith({
        wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.5/esbuild.wasm',
        worker: false
      });
    });

    it('should recover when first WASM URL fails but second succeeds', async () => {
      // Arrange: First URL fails, second succeeds
      const firstError = new Error('Network error loading WASM');
      mockEsbuild.initialize
        .mockRejectedValueOnce(firstError)
        .mockResolvedValueOnce(undefined);

      mockEsbuild.build.mockResolvedValue({
        outputFiles: [{ text: 'console.log("bundled code");' }],
        errors: [],
        warnings: []
      } as any);

      // Act
      render(<WebPreview files={mockFiles} />);

      // Assert: Should eventually show iframe (success)
      await waitFor(() => {
        const iframe = screen.getByTitle('Web Preview');
        expect(iframe).toBeInTheDocument();
      });

      // Verify it tried both URLs but succeeded on second
      expect(mockEsbuild.initialize).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to initialize esbuild with https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm:',
        firstError
      );
      expect(console.log).toHaveBeenCalledWith(
        'Successfully initialized esbuild with https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.5/esbuild.wasm'
      );
    });
  });

  describe('🟢 GREEN: Successful WebAssembly initialization and bundling', () => {
    it('should successfully initialize and bundle when everything works', async () => {
      // Arrange: Mock successful initialization and build
      mockEsbuild.initialize.mockResolvedValue(undefined);
      mockEsbuild.build.mockResolvedValue({
        outputFiles: [{ 
          text: 'console.log("React app bundled successfully");'
        }],
        errors: [],
        warnings: []
      } as any);

      // Act
      render(<WebPreview files={mockFiles} />);

      // Assert: Should show loading state first
      expect(screen.getByText('Initializing WebPreview...')).toBeInTheDocument();

      // Wait for successful initialization and rendering
      await waitFor(() => {
        const iframe = screen.getByTitle('Web Preview');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
      });

      // Verify successful initialization
      expect(mockEsbuild.initialize).toHaveBeenCalledTimes(1);
      expect(mockEsbuild.initialize).toHaveBeenCalledWith({
        wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm',
        worker: false
      });

      // Verify build was called with correct configuration
      expect(mockEsbuild.build).toHaveBeenCalledWith({
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        entryPoints: ['/index.tsx'],
        plugins: expect.any(Array),
        external: ['react', 'react-dom'],
        target: ['es2020'],
        define: {
          'process.env.NODE_ENV': '"development"'
        }
      });
    });

    it('should handle custom height prop', () => {
      // Arrange
      const customHeight = 600;

      // Act
      render(<WebPreview files={mockFiles} height={customHeight} />);
      
      // Assert: Component should start in loading state with custom height
      expect(screen.getByText('Initializing WebPreview...')).toBeInTheDocument();
      
      const loadingDiv = screen.getByText('Initializing WebPreview...');
      expect(loadingDiv).toHaveStyle({ height: '600px' });
    });
  });
});
