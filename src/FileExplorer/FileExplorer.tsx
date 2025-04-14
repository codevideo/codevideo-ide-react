import React, { JSX, useEffect, useRef, useState } from 'react';
import { IFileStructure, IPoint } from '@fullstackcraftllc/codevideo-types';
import { Box, Flex, Text, TextField } from '@radix-ui/themes';
import { FileIcon } from './components/FileIcons/FileIcon';
import { Text as TextIcon, Folder } from '@react-symbols/icons';
import { FileExplorerContextMenu } from './components/FileExplorerContextMenu';
import { FileContextMenu } from './components/FileContextMenu';
import { FolderContextMenu } from './components/FolderContextMenu';

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
    currentHoveredFileName?: string
    currentHoveredFolderName?: string
    currentFileName?: string
    fileStructure?: IFileStructure
    fileExplorerWidth?: number
    newFileParentPath?: string
    newFolderParentPath?: string
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

    console.log('isNewFileInputVisible', isNewFileInputVisible)
    console.log('isNewFolderInputVisible', isNewFolderInputVisible)
    console.log('newFileInputValue', newFileInputValue)
    console.log('newFolderInputValue', newFolderInputValue)

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
            const isHighlight = currentFileName === fullPath || currentHoveredFileName === fullPath || currentHoveredFolderName === fullPath;

            // Check if this directory is where we should show the new inputs
            const showNewFileInputHere = isNewFileInputVisible && newFileParentPath === fullPath;
            const showNewFolderInputHere = isDirectory && isNewFolderInputVisible && newFolderParentPath === fullPath;
            const showNewFileInputRoot = level === 0 && path === '' && isNewFileInputVisible && newFileParentPath === '';
            const showNewFolderInputRoot = level === 0 && path === '' && isNewFolderInputVisible && newFolderParentPath === '';

            console.log('showNewFileInputHere', showNewFileInputHere)
            console.log('showNewFolderInputHere', showNewFolderInputHere)
            console.log('showNewFileInputRoot', showNewFileInputRoot)
            console.log('showNewFolderInputRoot', showNewFolderInputRoot)

            return (
                <Box key={fullPath} ml={leftMargin}>
                    <Flex
                        data-codevideo-id={`file-explorer-${fullPath}`}
                        align="center"
                        gap="2"
                        style={{
                            backgroundColor: isHighlight ? 'var(--mint-2)' : 'transparent',
                            width: isHighlight ? '100%' : 'auto',
                        }}
                    >
                        {isDirectory ? <Folder height="20" /> : <FileIcon filename={name} />}
                        {resolveFileOrFolderText(name)}
                    </Flex>

                    {/* Directory contents */}
                    <Box ml="4">
                        {/* Show new file input inside this directory if it matches */}
                        {showNewFileInputHere && (
                            <Flex
                                data-codevideo-id={`new-file-input-${fullPath}`}
                                align="center"
                                gap="2"
                                mt="1"
                            >
                                <TextIcon height="20" />
                                <TextField.Root value={newFileInputValue} readOnly={true} autoFocus={true} />
                            </Flex>
                        )}

                        {/* Show new folder input inside this directory if it matches */}
                        {showNewFolderInputHere && (
                            <Flex
                                data-codevideo-id={`new-folder-input-${fullPath}`}
                                align="center"
                                gap="2"
                                mt="1"
                            >
                                <Folder height="20" />
                                <TextField.Root value={newFolderInputValue} readOnly={true} autoFocus={true} />
                            </Flex>
                        )}

                        {/* Render children directories/files */}
                        {isDirectory && item.children && renderFileTree(item.children, fullPath, nextLevel)}
                    </Box>

                    {/* Show new file input at root level if parent path is empty */}
                    {showNewFileInputRoot && (
                        <Flex
                            data-codevideo-id="new-file-input-root"
                            align="center"
                            gap="2"
                            mt="1"
                        >
                            <TextIcon height="20" />
                            <TextField.Root value={newFileInputValue} readOnly={true} autoFocus={true} />
                        </Flex>
                    )}

                    {/* Show new folder input at root level if parent path is empty */}
                    {showNewFolderInputRoot && (
                        <Flex
                            data-codevideo-id="new-folder-input-root"
                            align="center"
                            gap="2"
                            mt="1"
                        >
                            <Folder height="20" />
                            <TextField.Root value={newFolderInputValue} readOnly={true} autoFocus={true} />
                        </Flex>
                    )}
                </Box>
            );
        });
    };

    if (!fileStructure) {
        return <></>;
    }

    return (
        <Box
            p="1"
            style={{
                height: '100%',
                width: fileExplorerWidth ? `${fileExplorerWidth}px` : '250px',
                borderRight: '1px solid var(--gray-7)',
                backgroundColor: theme === 'light' ? 'var(--gray-5)' : 'var(--gray-4)',
                pointerEvents: 'none',
                userSelect: 'none',
            }}>
            <Box p="2">{renderFileTree(fileStructure, '', 0)}</Box>
            {/* Empty area specifically for targeting the file explorer background */}
            <Box
                data-codevideo-id="file-explorer"
                style={{
                    flexGrow: 1,
                    minHeight: '20px', // Ensure there's always some clickable area
                }}
            />
            {/* The context menu when right clicking anywhere empty in the file explorer */}
            <FileExplorerContextMenu
                isVisible={isFileExplorerContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
            {/* The context menu when right clicking a file in the file explorer */}
            <FileContextMenu
                isVisible={isFileContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
            {/* The context menu when right clicking a folder in the file explorer */}
            <FolderContextMenu
                isVisible={isFolderContextMenuVisible}
                currentMousePosition={currentMousePosition}
            />
        </Box>
    );
}