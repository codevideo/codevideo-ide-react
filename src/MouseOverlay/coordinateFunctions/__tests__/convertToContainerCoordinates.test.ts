import { convertToContainerCoordinates } from '../convertToContainerCoordinates.js';
import { DEFAULT_MOUSE_POSITION } from '../../../constants/CodeVideoIDEConstants.js';

describe('convertToContainerCoordinates', () => {
  let mockContainer: HTMLDivElement;
  let mockContainerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    document.body.innerHTML = '';
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
    mockContainerRef = { current: mockContainer };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('🔴 RED: Tests that expose coordinate conversion issues', () => {
    it('should convert absolute coordinates to container-relative coordinates correctly', () => {
      // Arrange: Mock container position on screen
      const containerRect = {
        left: 100,
        top: 50,
        width: 800,
        height: 600,
        right: 900,
        bottom: 650
      };
      jest.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue(containerRect as DOMRect);

      // Test case: Element at absolute position (300, 200) should be (200, 150) relative to container
      const absolutePoint = { x: 300, y: 200 };

      // Act
      const result = convertToContainerCoordinates(absolutePoint, mockContainerRef);

      // Assert
      expect(result.x).toBe(200); // 300 - 100 = 200
      expect(result.y).toBe(150); // 200 - 50 = 150
    });

    it('should handle edge case where point is at container origin', () => {
      // Arrange
      const containerRect = {
        left: 150,
        top: 100,
        width: 500,
        height: 400,
        right: 650,
        bottom: 500
      };
      jest.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue(containerRect as DOMRect);

      const absolutePoint = { x: 150, y: 100 }; // Same as container origin

      // Act
      const result = convertToContainerCoordinates(absolutePoint, mockContainerRef);

      // Assert
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle negative relative coordinates (point before container)', () => {
      // Arrange
      const containerRect = {
        left: 200,
        top: 150,
        width: 600,
        height: 400,
        right: 800,
        bottom: 550
      };
      jest.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue(containerRect as DOMRect);

      const absolutePoint = { x: 100, y: 50 }; // Before container

      // Act
      const result = convertToContainerCoordinates(absolutePoint, mockContainerRef);

      // Assert
      expect(result.x).toBe(-100); // 100 - 200 = -100
      expect(result.y).toBe(-100); // 50 - 150 = -100
    });

    it('should return DEFAULT_MOUSE_POSITION when containerRef is null', () => {
      // Act
      const result = convertToContainerCoordinates({ x: 100, y: 100 }, null as any);

      // Assert
      expect(result).toEqual(DEFAULT_MOUSE_POSITION);
    });

    it('should return original point when containerRef.current is null', () => {
      // Arrange
      const point = { x: 250, y: 300 };

      // Act
      const result = convertToContainerCoordinates(point, { current: null });

      // Assert
      expect(result).toEqual(point);
    });
  });

  describe('🟡 YELLOW: Understanding coordinate conversion behavior', () => {
    it('should log container rect and conversion details', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const containerRect = {
        left: 50,
        top: 75,
        width: 900,
        height: 700,
        right: 950,
        bottom: 775
      };
      jest.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue(containerRect as DOMRect);

      const inputPoint = { x: 300, y: 400 };

      // Act
      convertToContainerCoordinates(inputPoint, mockContainerRef);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🔧 [convertToContainerCoordinates] Container rect:', {
        left: 50,
        top: 75,
        width: 900,
        height: 700
      });
      expect(consoleSpy).toHaveBeenCalledWith('🔧 [convertToContainerCoordinates] Input point:', inputPoint);
      expect(consoleSpy).toHaveBeenCalledWith('🔧 [convertToContainerCoordinates] Converted coordinates:', { x: 250, y: 325 });

      consoleSpy.mockRestore();
    });
  });

  describe('🟢 GREEN: Tests for correct coordinate conversion', () => {
    it('should handle multiple conversions consistently', () => {
      // Arrange
      const containerRect = {
        left: 75,
        top: 125,
        width: 750,
        height: 500,
        right: 825,
        bottom: 625
      };
      jest.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue(containerRect as DOMRect);

      const testPoints = [
        { absolute: { x: 75, y: 125 }, expected: { x: 0, y: 0 } },
        { absolute: { x: 200, y: 250 }, expected: { x: 125, y: 125 } },
        { absolute: { x: 450, y: 375 }, expected: { x: 375, y: 250 } },
        { absolute: { x: 825, y: 625 }, expected: { x: 750, y: 500 } },
      ];

      testPoints.forEach(({ absolute, expected }, index) => {
        // Act
        const result = convertToContainerCoordinates(absolute, mockContainerRef);

        // Assert
        expect(result.x).toBe(expected.x);
        expect(result.y).toBe(expected.y);
      });
    });
  });
});
