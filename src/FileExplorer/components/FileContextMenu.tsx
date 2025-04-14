import React, { useRef, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { IPoint } from '@fullstackcraftllc/codevideo-types';
import { DEFAULT_MOUSE_POSITION } from 'src/constants/CodeVideoIDEConstants';

export interface IFileContextMenu {
  isVisible: boolean;
  currentMousePosition: IPoint;
}

export const FileContextMenu = (props: IFileContextMenu) => {
  const {
    isVisible,
    currentMousePosition
  } = props;

  const renameRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  
  const [hoveredItem, setHoveredItem] = useState<'rename' | 'delete' | null>(null);
  const [menuPosition, setMenuPosition] = useState<IPoint>(DEFAULT_MOUSE_POSITION);

  // Set the menu position when it becomes visible
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
      if (renameRef.current) {
        const fileRect = renameRef.current.getBoundingClientRect();
        const isFileHovered = 
          currentMousePosition.x >= fileRect.left &&
          currentMousePosition.x <= fileRect.right &&
          currentMousePosition.y >= fileRect.top &&
          currentMousePosition.y <= fileRect.bottom;
        
        if (isFileHovered) {
          setHoveredItem('rename');
          return;
        }
      }
      
      if (deleteRef.current) {
        const folderRect = deleteRef.current.getBoundingClientRect();
        const isFolderHovered = 
          currentMousePosition.x >= folderRect.left &&
          currentMousePosition.x <= folderRect.right &&
          currentMousePosition.y >= folderRect.top &&
          currentMousePosition.y <= folderRect.bottom;
        
        if (isFolderHovered) {
          setHoveredItem('delete');
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
          data-codevideo-id="file-explorer-file-context-menu-rename"
          ref={renameRef}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: hoveredItem === 'rename' ? 'var(--mint-3)' : 'transparent',
            userSelect: 'none',
          }}
        >
          <Text size="2">Rename...</Text>
        </Box>
        <Box
          data-codevideo-id="file-explorer-file-context-menu-delete"
          ref={deleteRef}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: hoveredItem === 'delete' ? 'var(--mint-3)' : 'transparent',
            userSelect: 'none',
          }}
        >
          <Text size="2">Delete</Text>
        </Box>
      </Flex>
    </Box>
  );
};