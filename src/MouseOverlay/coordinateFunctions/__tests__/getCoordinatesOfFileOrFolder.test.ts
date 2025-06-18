import { DEFAULT_MOUSE_POSITION } from "../../../constants/CodeVideoIDEConstants.js";
import { getCoordinatesOfFileOrFolder } from "../getCoordinatesOfFileOrFolder";

// Mock the convertToContainerCoordinates function to isolate the issue
jest.mock('../convertToContainerCoordinates', () => ({
  convertToContainerCoordinates: jest.fn((point) => point)
}));

describe('getCoordinatesOfFileOrFolder', () => {
  let mockContainer: HTMLDivElement;
  let mockContainerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
    
    // Create a mock container
    mockContainer = document.createElement('div');
    mockContainer.style.position = 'relative';
    mockContainer.style.width = '1000px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);
    
    mockContainerRef = { current: mockContainer };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('🔴 RED: Failing tests that expose the bug', () => {
    it('should find a file element with the correct data-codevideo-id attribute', () => {
      // Arrange: Create a file element like the FileExplorer would
      const fileElement = document.createElement('div');
      fileElement.setAttribute('data-codevideo-id', 'file-explorer-test.txt');
      fileElement.style.position = 'absolute';
      fileElement.style.left = '50px';
      fileElement.style.top = '100px';
      fileElement.style.width = '200px';
      fileElement.style.height = '24px';
      mockContainer.appendChild(fileElement);

      // Mock getBoundingClientRect to return predictable values
      const mockRect = {
        left: 50,
        top: 100,
        width: 200,
        height: 24,
        right: 250,
        bottom: 124
      };
      jest.spyOn(fileElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);

      // Act: Try to get coordinates for the file
      const result = getCoordinatesOfFileOrFolder('test.txt', mockContainerRef);

      // Assert: Should find the element and calculate center coordinates
      expect(result).not.toEqual(DEFAULT_MOUSE_POSITION);
      expect(result.x).toBe(150); // 50 + 200/2 = center x
      expect(result.y).toBe(112); // 100 + 24/2 = center y
    });

    it('should return the center point of a file element', () => {
      // Arrange: Create multiple file elements to test specificity
      const files = ['index.js', 'package.json', 'README.md'];
      
      files.forEach((filename, index) => {
        const fileElement = document.createElement('div');
        fileElement.setAttribute('data-codevideo-id', `file-explorer-${filename}`);
        fileElement.style.position = 'absolute';
        fileElement.style.left = `${index * 100}px`;
        fileElement.style.top = `${index * 30}px`;
        fileElement.style.width = '150px';
        fileElement.style.height = '20px';
        
        // Mock getBoundingClientRect
        const mockRect = {
          left: index * 100,
          top: index * 30,
          width: 150,
          height: 20,
          right: index * 100 + 150,
          bottom: index * 30 + 20
        };
        jest.spyOn(fileElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
        
        mockContainer.appendChild(fileElement);
      });

      // Act: Get coordinates for the middle file
      const result = getCoordinatesOfFileOrFolder('package.json', mockContainerRef);

      // Assert: Should target the correct file (index 1)
      expect(result.x).toBe(175); // 100 + 150/2 = center x of second file
      expect(result.y).toBe(40);  // 30 + 20/2 = center y of second file
    });

    it('should handle nested folder paths correctly', () => {
      // Arrange: Create a nested file structure
      const nestedFilePath = 'src/components/Button.tsx';
      const fileElement = document.createElement('div');
      fileElement.setAttribute('data-codevideo-id', `file-explorer-${nestedFilePath}`);
      fileElement.style.position = 'absolute';
      fileElement.style.left = '75px';
      fileElement.style.top = '150px';
      fileElement.style.width = '250px';
      fileElement.style.height = '22px';
      
      const mockRect = {
        left: 75,
        top: 150,
        width: 250,
        height: 22,
        right: 325,
        bottom: 172
      };
      jest.spyOn(fileElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
      
      mockContainer.appendChild(fileElement);

      // Act
      const result = getCoordinatesOfFileOrFolder(nestedFilePath, mockContainerRef);

      // Assert
      expect(result.x).toBe(200); // 75 + 250/2
      expect(result.y).toBe(161); // 150 + 22/2
    });

    it('should return DEFAULT_MOUSE_POSITION when file element is not found', () => {
      // Act: Try to find a non-existent file
      const result = getCoordinatesOfFileOrFolder('nonexistent.txt', mockContainerRef);

      // Assert
      expect(result).toEqual(DEFAULT_MOUSE_POSITION);
    });

    it('should return DEFAULT_MOUSE_POSITION when containerRef is null', () => {
      // Act
      const result = getCoordinatesOfFileOrFolder('test.txt', { current: null });

      // Assert
      expect(result).toEqual(DEFAULT_MOUSE_POSITION);
    });
  });

  describe('🟡 YELLOW: Debugging - Understanding the current behavior', () => {
    it('should log the correct selector being used', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      getCoordinatesOfFileOrFolder('test.txt', mockContainerRef);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🎯 [getCoordinatesOfFileOrFolder] Looking for:', 'test.txt');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 [getCoordinatesOfFileOrFolder] Selector:', '[data-codevideo-id="file-explorer-test.txt"]');
      
      consoleSpy.mockRestore();
    });

    it('should log available elements when target is not found', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Add some dummy file explorer elements
      ['file1.js', 'file2.js'].forEach(filename => {
        const el = document.createElement('div');
        el.setAttribute('data-codevideo-id', `file-explorer-${filename}`);
        mockContainer.appendChild(el);
      });

      // Act
      getCoordinatesOfFileOrFolder('missing.txt', mockContainerRef);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('❌ [getCoordinatesOfFileOrFolder] Element not found');
      expect(consoleSpy).toHaveBeenCalledWith('📋 [getCoordinatesOfFileOrFolder] Available file explorer elements:');
      
      consoleSpy.mockRestore();
    });
  });

  describe('🟢 GREEN: Tests that should pass after the fix', () => {
    it('should accurately calculate coordinates for elements at different screen positions', () => {
      // This test will help us verify that our coordinate calculation is working correctly
      // across different positions on the screen
      
      const testCases = [
        { file: 'top-left.txt', left: 0, top: 0, width: 100, height: 20, expectedX: 50, expectedY: 10 },
        { file: 'middle.txt', left: 400, top: 300, width: 200, height: 24, expectedX: 500, expectedY: 312 },
        { file: 'bottom-right.txt', left: 800, top: 500, width: 150, height: 18, expectedX: 875, expectedY: 509 },
      ];

      testCases.forEach(testCase => {
        // Arrange
        const fileElement = document.createElement('div');
        fileElement.setAttribute('data-codevideo-id', `file-explorer-${testCase.file}`);
        
        const mockRect = {
          left: testCase.left,
          top: testCase.top,
          width: testCase.width,
          height: testCase.height,
          right: testCase.left + testCase.width,
          bottom: testCase.top + testCase.height
        };
        jest.spyOn(fileElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
        
        mockContainer.appendChild(fileElement);

        // Act
        const result = getCoordinatesOfFileOrFolder(testCase.file, mockContainerRef);

        // Assert
        expect(result.x).toBe(testCase.expectedX);
        expect(result.y).toBe(testCase.expectedY);
        
        // Clean up for next iteration
        mockContainer.removeChild(fileElement);
      });
    });
  });
});
