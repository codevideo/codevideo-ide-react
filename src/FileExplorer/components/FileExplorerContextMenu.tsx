import React, { useRef, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { IPoint } from '@fullstackcraftllc/codevideo-types';
import { DEFAULT_MOUSE_POSITION } from 'src/constants/CodeVideoIDEConstants';

export interface IFileExplorerContextMenu {
  isVisible: boolean;
  currentMousePosition: IPoint;
}

export const FileExplorerContextMenu = (props: IFileExplorerContextMenu) => {
  const {
    isVisible,
    currentMousePosition
  } = props;

  const newFileRef = useRef<HTMLDivElement>(null);
  const newFolderRef = useRef<HTMLDivElement>(null);
  
  const [hoveredItem, setHoveredItem] = useState<'file' | 'folder' | null>(null);
  const [menuPosition, setMenuPosition] = useState<IPoint>(DEFAULT_MOUSE_POSITION);

  // when is visible is true, set the menu position to the current mouse position
  useEffect(() => {
    if (isVisible) {
      setMenuPosition({
        x: currentMousePosition.x,
        y: currentMousePosition.y
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    // Check if mouse coordinates intersect with menu items
    const checkIntersection = () => {
      if (newFileRef.current) {
        const fileRect = newFileRef.current.getBoundingClientRect();
        const isFileHovered = 
          currentMousePosition.x >= fileRect.left &&
          currentMousePosition.x <= fileRect.right &&
          currentMousePosition.y >= fileRect.top &&
          currentMousePosition.y <= fileRect.bottom;
        
        if (isFileHovered) {
          setHoveredItem('file');
          return;
        }
      }
      
      if (newFolderRef.current) {
        const folderRect = newFolderRef.current.getBoundingClientRect();
        const isFolderHovered = 
          currentMousePosition.x >= folderRect.left &&
          currentMousePosition.x <= folderRect.right &&
          currentMousePosition.y >= folderRect.top &&
          currentMousePosition.y <= folderRect.bottom;
        
        if (isFolderHovered) {
          setHoveredItem('folder');
          return;
        }
      }
      
      setHoveredItem(null);
    };
    
    checkIntersection();
  }, [isVisible, currentMousePosition]);

  if (!isVisible) return null;

  return (
    <Box
      style={{
        position: 'fixed',
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        backgroundColor: 'var(--gray-4)',
        border: '1px solid var(--mint-7)',
        borderRadius: 'var(--radius-2)',
        width: '180px',
        boxShadow: 'var(--shadow-3)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <Flex direction="column">
        <Box
          data-codevideo-id="file-explorer-context-menu-new-file"
          ref={newFileRef}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: hoveredItem === 'file' ? 'var(--mint-3)' : 'transparent',
            userSelect: 'none',
          }}
        >
          <Text size="2">New File...</Text>
        </Box>
        <Box
          data-codevideo-id="file-explorer-context-menu-new-folder"
          ref={newFolderRef}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: hoveredItem === 'folder' ? 'var(--mint-3)' : 'transparent',
            userSelect: 'none',
          }}
        >
          <Text size="2">New Folder...</Text>
        </Box>
      </Flex>
    </Box>
  );
};