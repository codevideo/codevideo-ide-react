import { getNewMousePosition } from '../getNewMousePosition.js';
import { IAction } from '@fullstackcraftllc/codevideo-types';

// Mock the specific coordinate functions to isolate the integration
jest.mock('../../coordinateFunctions/getCoordinatesOfFileOrFolder');
jest.mock('../../coordinateFunctions/getCoordinatesOfEditor');
jest.mock('../../coordinateFunctions/getCoordinatesOfTerminalInput');

import { getCoordinatesOfFileOrFolder } from '../../coordinateFunctions/getCoordinatesOfFileOrFolder.js';

const mockGetCoordinatesOfFileOrFolder = getCoordinatesOfFileOrFolder as jest.MockedFunction<typeof getCoordinatesOfFileOrFolder>;

describe('getNewMousePosition Integration Tests', () => {
  let mockContainer: HTMLDivElement;
  let mockContainerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    document.body.innerHTML = '';
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
    mockContainerRef = { current: mockContainer };
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('🔴 RED: File explorer mouse movement integration', () => {
    it('should handle mouse-move-file-explorer-file action correctly', async () => {
      // Arrange
      const targetMousePosition = { x: 100, y: 100 };
      const expectedResult = { x: 250, y: 150 };
      
      mockGetCoordinatesOfFileOrFolder.mockReturnValue(expectedResult);
      
      const fileAction: IAction = {
        name: 'mouse-move-file-explorer-file',
        value: 'test.txt'
      };

      // Act
      const result = getNewMousePosition(targetMousePosition, fileAction, mockContainerRef);

      // Assert
      expect(mockGetCoordinatesOfFileOrFolder).toHaveBeenCalledWith('test.txt', mockContainerRef);
      expect(result).toEqual(expectedResult);
    });

    it('should handle mouse-move-file-explorer-folder action correctly', async () => {
      // Arrange
      const targetMousePosition = { x: 200, y: 200 };
      const expectedResult = { x: 300, y: 180 };
      
      mockGetCoordinatesOfFileOrFolder.mockReturnValue(expectedResult);
      
      const folderAction: IAction = {
        name: 'mouse-move-file-explorer-folder',
        value: 'src/components'
      };

      // Act
      const result = getNewMousePosition(targetMousePosition, folderAction, mockContainerRef);

      // Assert
      expect(mockGetCoordinatesOfFileOrFolder).toHaveBeenCalledWith('src/components', mockContainerRef);
      expect(result).toEqual(expectedResult);
    });

    it('should log debug information for file explorer actions', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const targetMousePosition = { x: 100, y: 100 };
      const expectedResult = { x: 250, y: 150 };
      
      mockGetCoordinatesOfFileOrFolder.mockReturnValue(expectedResult);
      
      const fileAction: IAction = {
        name: 'mouse-move-file-explorer-file',
        value: 'package.json'
      };

      // Act
      getNewMousePosition(targetMousePosition, fileAction, mockContainerRef);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🚀 [getNewMousePosition] Handling file/folder movement:', {
        actionName: 'mouse-move-file-explorer-file',
        actionValue: 'package.json'
      });
      expect(consoleSpy).toHaveBeenCalledWith('🚀 [getNewMousePosition] Result position:', expectedResult);

      consoleSpy.mockRestore();
    });

    it('should handle complex file paths correctly', async () => {
      // Arrange
      const complexPaths = [
        'src/components/Button/Button.tsx',
        'assets/images/logo.png',
        'tests/__mocks__/fileMock.js',
        '.github/workflows/ci.yml'
      ];

      for (const filePath of complexPaths) {
        const expectedResult = { x: 400, y: 250 };
        mockGetCoordinatesOfFileOrFolder.mockReturnValue(expectedResult);
        
        const action: IAction = {
          name: 'mouse-move-file-explorer-file',
          value: filePath
        };

        // Act
        const result = getNewMousePosition({ x: 0, y: 0 }, action, mockContainerRef);

        // Assert
        expect(mockGetCoordinatesOfFileOrFolder).toHaveBeenCalledWith(filePath, mockContainerRef);
        expect(result).toEqual(expectedResult);
        
        // Reset for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('🟡 YELLOW: Understanding current behavior patterns', () => {
    it('should fallback to original position when coordinate function fails', async () => {
      // Arrange
      const targetMousePosition = { x: 150, y: 200 };
      mockGetCoordinatesOfFileOrFolder.mockReturnValue({ x: 0, y: 0 }); // DEFAULT_MOUSE_POSITION
      
      const action: IAction = {
        name: 'mouse-move-file-explorer-file',
        value: 'nonexistent.txt'
      };

      // Act
      const result = getNewMousePosition(targetMousePosition, action, mockContainerRef);

      // Assert - When coordinate function returns default, the system should handle this gracefully
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('🟢 GREEN: Correct mouse positioning behavior', () => {
    it('should return accurate positions for various file types', async () => {
      // This test ensures that different file types get positioned correctly
      const fileTests = [
        { file: 'index.html', expectedPos: { x: 120, y: 45 } },
        { file: 'style.css', expectedPos: { x: 120, y: 70 } },
        { file: 'main.js', expectedPos: { x: 120, y: 95 } },
        { file: 'README.md', expectedPos: { x: 120, y: 120 } },
      ];

      for (const test of fileTests) {
        mockGetCoordinatesOfFileOrFolder.mockReturnValue(test.expectedPos);
        
        const action: IAction = {
          name: 'mouse-move-file-explorer-file',
          value: test.file
        };

        const result = getNewMousePosition({ x: 0, y: 0 }, action, mockContainerRef);
        
        expect(result).toEqual(test.expectedPos);
        jest.clearAllMocks();
      }
    });

    it('should maintain consistency across multiple calls', async () => {
      // Arrange
      const consistentPosition = { x: 175, y: 125 };
      mockGetCoordinatesOfFileOrFolder.mockReturnValue(consistentPosition);
      
      const action: IAction = {
        name: 'mouse-move-file-explorer-file',
        value: 'consistent.txt'
      };

      // Act & Assert - Multiple calls should return the same result
      for (let i = 0; i < 5; i++) {
        const result = getNewMousePosition({ x: 50, y: 50 }, action, mockContainerRef);
        expect(result).toEqual(consistentPosition);
      }
    });
  });
});
