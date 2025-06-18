import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates.js";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";


const debugDOMState = () => {
    console.log('🔍 DOM Debug Info:');
    console.log('- Document ready state:', document.readyState);
    console.log('- Body children count:', document.body?.children?.length || 0);
    console.log('- FileExplorer elements:', document.querySelectorAll('[data-codevideo-id="file-explorer"]').length);
    console.log('- All data-codevideo-id elements:', document.querySelectorAll('[data-codevideo-id]').length);

    // Debug what file explorer elements actually exist
    const allFileExplorerElements = document.querySelectorAll('[data-codevideo-id^="file-explorer-"]');
    console.log('📋 Available file explorer elements:');
    allFileExplorerElements.forEach(el => {
        console.log(`  - ${el.getAttribute('data-codevideo-id')}`);
    });
};

export const getCoordinatesOfFileOrFolder = (fileOrFolderPath: string, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    try {
        if (!containerRef) return DEFAULT_MOUSE_POSITION;
        console.log('🎯 [getCoordinatesOfFileOrFolder] Looking for:', fileOrFolderPath);

        const selector = `[data-codevideo-id="file-explorer-${fileOrFolderPath}"]`;
        console.log('🔍 [getCoordinatesOfFileOrFolder] Selector:', selector);

        // Debugging DOM state
        debugDOMState();

        console.log('🔍 [getCoordinatesOfFileOrFolder] About to call document.querySelector...');
        const fileElement = document.querySelector(selector);
        console.log('🔍 [getCoordinatesOfFileOrFolder] document.querySelector completed successfully');
        console.log('🔍 [getCoordinatesOfFileOrFolder] Element found:', !!fileElement);

        // TODO: happens quite a lot, need to rearrange when the file tree is ready to be found.
        if (!fileElement) {
            console.log('❌ [getCoordinatesOfFileOrFolder] Element not found');
            // Let's see what elements we do have
            const allFileExplorerElements = document.querySelectorAll('[data-codevideo-id^="file-explorer-"]');
            console.log('📋 [getCoordinatesOfFileOrFolder] Available file explorer elements:');
            allFileExplorerElements.forEach(el => {
                console.log(`  - ${el.getAttribute('data-codevideo-id')}`);
            });
            return DEFAULT_MOUSE_POSITION;
        }

        console.log('✅ [getCoordinatesOfFileOrFolder] Found element, about to get bounding rect...');
        const rect = fileElement.getBoundingClientRect();
        console.log('✅ [getCoordinatesOfFileOrFolder] Got bounding rect successfully');
        
        console.log('📐 [getCoordinatesOfFileOrFolder] Element rect:', JSON.stringify({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        }));

        const absoluteCoords = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        console.log('📍 [getCoordinatesOfFileOrFolder] Absolute center coords:', JSON.stringify(absoluteCoords));

        console.log('🔍 [getCoordinatesOfFileOrFolder] About to call convertToContainerCoordinates...');
        const result = convertToContainerCoordinates(absoluteCoords, containerRef);
        console.log('🔍 [getCoordinatesOfFileOrFolder] convertToContainerCoordinates completed successfully');
        console.log('🎯 [getCoordinatesOfFileOrFolder] Final container-relative coords:', JSON.stringify(result));

        return result;
    }
    catch (error: any) {
        console.error('❗ [getCoordinatesOfFileOrFolder] Error name:', error?.name);
        console.error('❗ [getCoordinatesOfFileOrFolder] Error message:', error?.message);
        console.error('❗ [getCoordinatesOfFileOrFolder] Error stack:', error?.stack);
        console.error('❗ [getCoordinatesOfFileOrFolder] Full error object:', error);
        return DEFAULT_MOUSE_POSITION;
    }
};