import React, { JSX, useEffect, useRef, useState } from 'react';
import { IFileStructure, IPoint } from '@fullstackcraftllc/codevideo-types';
import { Box, Flex, Text, TextField } from '@radix-ui/themes';
import { FileIcon } from './components/FileIcons/FileIcon.jsx';
import { Text as TextIcon, Folder } from '@react-symbols/icons';
import { FileExplorerContextMenu } from './components/FileExplorerContextMenu.jsx';
import { FileContextMenu } from './components/FileContextMenu.jsx';
import { FolderContextMenu } from './components/FolderContextMenu.jsx';
import { FILE_EXPLORER_ID } from 'src/constants/CodeVideoDataIds.js';

export interface IFileExplorerProps {
    theme: 'light' | 'dark'
    isFileExplorerContextMenuVisible: boolean
    isFileContextMenuVisible: boolean
    isFolderContextMenuVisible: boolean
    isNewFileInputVisible: boolean
    isNewFolderInputVisible: boolean
    currentMousePosition: IPoint
    newFileInputValue: string
    newFolderInputValue: string
    originalFileBeingRenamed: string
    originalFolderBeingRenamed: string
    renameFileInputValue: string
    renameFolderInputValue: string
    newFileParentPath: string
    newFolderParentPath: string
    currentHoveredFileName?: string
    currentHoveredFolderName?: string
    currentFileName?: string
    fileStructure?: IFileStructure
    fileExplorerWidth?: number
}

export function FileExplorer(props: IFileExplorerProps) {
    const {
        theme,
        isFileExplorerContextMenuVisible,
        isFileContextMenuVisible,
        isFolderContextMenuVisible,
        isNewFileInputVisible,
        isNewFolderInputVisible,
        currentMousePosition,
        newFolderInputValue,
        newFileInputValue,
        currentFileName,
        originalFileBeingRenamed,
        originalFolderBeingRenamed,
        renameFileInputValue,
        renameFolderInputValue,
        currentHoveredFileName,
        currentHoveredFolderName,
        fileStructure,
        fileExplorerWidth,
        newFileParentPath,
        newFolderParentPath
    } = props;

    // For debugging
    // console.log('[FileExplorer] Props state:');
    // console.log('- isNewFileInputVisible:', isNewFileInputVisible);
    // console.log('- isNewFolderInputVisible:', isNewFolderInputVisible);
    // console.log('- newFileInputValue:', newFileInputValue);
    // console.log('- newFolderInputValue:', newFolderInputValue);
    // console.log('- newFileParentPath:', newFileParentPath);
    // console.log('- newFolderParentPath:', newFolderParentPath);

    const getEffectiveParentPath = (inputType: 'file' | 'folder'): string => {
        if (inputType === 'file') {
            // If newFileParentPath is set, use it
            if (newFileParentPath) {
                return newFileParentPath;
            }
            // Otherwise, if only newFolderParentPath is set, use that instead
            // (happens when right-clicking a folder and selecting "New File...")
            else if (newFolderParentPath) {
                console.log('[FileExplorer] Using newFolderParentPath for file input:', newFolderParentPath);
                return newFolderParentPath;
            }
            // Fallback to empty string (root level)
            return '';
        } else {
            // For folders, similar logic but prioritize newFolderParentPath
            if (newFolderParentPath) {
                return newFolderParentPath;
            }
            else if (newFileParentPath) {
                console.log('[FileExplorer] Using newFileParentPath for folder input:', newFileParentPath);
                return newFileParentPath;
            }
            return '';
        }
    };

    const resolveFileOrFolderText = (name: string) => {
        // if we're currently renaming this file, show as input of the renamefileinputvalue
        if (name === originalFileBeingRenamed) {
            return (
                <TextField.Root value={renameFileInputValue} readOnly={true}>
                </TextField.Root>
            )
        }

        // if we're currently renaming this folder, show as input of the renamefolderinputvalue
        if (name === originalFolderBeingRenamed) {
            return (
                <TextField.Root value={renameFolderInputValue} readOnly={true}>
                </TextField.Root>
            )
        }

        // return non-input text of the folder or file
        return (
            <Text style={{ fontFamily: 'Fira Code, monospace', color: '#CCCECC', fontSize: '0.9em' }}>{name}</Text>
        )
    }

    // Single instance of file input to be used throughout the component
    const renderNewFileInput = () => {
        if (!isNewFileInputVisible) return null;

        // Use getEffectiveParentPath instead of directly using newFileParentPath
        const effectiveParentPath = getEffectiveParentPath('file');
        const inputId = `new-file-input-${effectiveParentPath || 'root'}`;
        console.log(`[FileExplorer] Rendering file input with ID: ${inputId}, value: ${newFileInputValue}, effectiveParentPath: ${effectiveParentPath}`);

        return (
            <Flex
                data-codevideo-id={inputId}
                align="center"
                gap="2"
                mt="1"
            >
                <TextIcon height="20" />
                <TextField.Root
                    value={newFileInputValue}
                    readOnly={true}
                    autoFocus={true}
                />
            </Flex>
        );
    };

    // Single instance of folder input to be used throughout the component
    const renderNewFolderInput = () => {
        if (!isNewFolderInputVisible) return null;

        // Use getEffectiveParentPath instead of directly using newFolderParentPath
        const effectiveParentPath = getEffectiveParentPath('folder');
        const inputId = `new-folder-input-${effectiveParentPath || 'root'}`;
        console.log(`[FileExplorer] Rendering folder input with ID: ${inputId}, value: ${newFolderInputValue}, effectiveParentPath: ${effectiveParentPath}`);

        return (
            <Flex
                data-codevideo-id={inputId}
                align="center"
                gap="2"
                mt="1"
            >
                <Folder height="20" />
                <TextField.Root
                    value={newFolderInputValue}
                    readOnly={true}
                    autoFocus={true}
                />
            </Flex>
        );
    };

    const renderFileTree = (structure: IFileStructure, path: string = '', level: number): JSX.Element[] => {
        // Sort entries alphabetically, with directories first, then files
        const sortedEntries = Object.entries(structure).sort((a, b) => {
            const aIsDir = a[1].type === 'directory';
            const bIsDir = b[1].type === 'directory';

            // If both are directories or both are files, sort alphabetically
            if (aIsDir === bIsDir) {
                return a[0].localeCompare(b[0]);
            }

            // Otherwise, directories come first
            return aIsDir ? -1 : 1;
        });

        return sortedEntries.map(([name, item]) => {
            const fullPath = path ? `${path}/${name}` : name;
            const isDirectory = item.type === 'directory';
            const leftMargin = level === 0 ? "0" : "4";
            const nextLevel = level + 1;
            
            // Fix highlighting logic to properly distinguish between files and folders
            // Prioritize hover states over selected/active states to prevent overlap during transitions
            const isHovered = (isDirectory && currentHoveredFolderName === fullPath) || 
                             (!isDirectory && currentHoveredFileName === fullPath);
            const isSelected = currentFileName === fullPath;
            const isHighlight = isHovered || (isSelected && !currentHoveredFileName && !currentHoveredFolderName);

            // Check if this directory should show the new file/folder inputs
            const effectiveFileParentPath = getEffectiveParentPath('file');
            const effectiveFolderParentPath = getEffectiveParentPath('folder');
            const shouldShowFileInput = isNewFileInputVisible && effectiveFileParentPath === fullPath && isDirectory;
            const shouldShowFolderInput = isNewFolderInputVisible && effectiveFolderParentPath === fullPath && isDirectory;

            if (shouldShowFileInput || shouldShowFolderInput) {
                console.log(`[FileExplorer] Directory ${fullPath} should show inputs:`, {
                    file: shouldShowFileInput,
                    folder: shouldShowFolderInput
                });
            }

            return (
                <Box key={fullPath} ml={leftMargin}>
                    <Flex
                        data-codevideo-id={`file-explorer-${fullPath}`}
                        align="center"
                        gap="2"
                        style={{
                            backgroundColor: isHighlight 
                                ? (theme === 'light' ? 'var(--gray-3)' : 'var(--gray-6)') 
                                : 'transparent',
                            width: '100%',
                            padding: '2px 4px',
                            borderRadius: '4px',
                        }}
                    >
                        {isDirectory ? <Folder height="20" /> : <FileIcon filename={name} />}
                        {resolveFileOrFolderText(name)}
                    </Flex>

                    {isDirectory && (
                        <Box ml="4">
                            {/* Only show inputs in the correct directory */}
                            {shouldShowFileInput && renderNewFileInput()}
                            {shouldShowFolderInput && renderNewFolderInput()}

                            {/* Render children */}
                            {item.children && renderFileTree(item.children, fullPath, nextLevel)}
                        </Box>
                    )}
                </Box>
            );
        });
    };

    // Handle the root level inputs separately
    const renderRootLevelInputs = () => {
        const effectiveFileParentPath = getEffectiveParentPath('file');
        const effectiveFolderParentPath = getEffectiveParentPath('folder');
        
        const isRoot = effectiveFileParentPath === '' || effectiveFileParentPath === null || effectiveFileParentPath === undefined;
        const isRootFolder = effectiveFolderParentPath === '' || effectiveFolderParentPath === null || effectiveFolderParentPath === undefined;
        
        const shouldShowRootFileInput = isNewFileInputVisible && isRoot;
        const shouldShowRootFolderInput = isNewFolderInputVisible && isRootFolder;
        
        if (shouldShowRootFileInput || shouldShowRootFolderInput) {
            console.log('[FileExplorer] Showing root level inputs:', {
                file: shouldShowRootFileInput,
                folder: shouldShowRootFolderInput,
                effectiveFileParentPath,
                effectiveFolderParentPath
            });
        }
        
        return (
            <>
                {shouldShowRootFileInput && renderNewFileInput()}
                {shouldShowRootFolderInput && renderNewFolderInput()}
            </>
        );
    };

    if (!fileStructure) {
        return <></>;
    }

    return (
        <Box
            p="1"
            data-testid="file-explorer"
            style={{
                height: '100%',
                width: fileExplorerWidth ? `${fileExplorerWidth}px` : '250px',
                borderRight: '1px solid var(--gray-7)',
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                pointerEvents: 'none',
                userSelect: 'none',
            }}>
            <Box p="2">
                {/* First render the file tree structure */}
                {renderFileTree(fileStructure, '', 0)}

                {/* Then render any root-level inputs if needed */}
                {renderRootLevelInputs()}
            </Box>

            {/* Empty area for file explorer background clicks */}
            <Box
                data-codevideo-id={FILE_EXPLORER_ID}
                style={{
                    flexGrow: 1,
                    minHeight: '20px',
                }}
            />

            {/* Context menus */}
            <FileExplorerContextMenu
                isVisible={isFileExplorerContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
            <FileContextMenu
                isVisible={isFileContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
            <FolderContextMenu
                isVisible={isFolderContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
        </Box>
    );
}