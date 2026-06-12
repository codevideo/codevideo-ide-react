import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates.js";
import { DEFAULT_MOUSE_POSITION } from "../../constants/CodeVideoIDEConstants.js";
import { debugLog } from '../../utils/debugLog.js';


const debugDOMState = () => {
    debugLog('🔍 DOM Debug Info:');
    debugLog('- Document ready state:', document.readyState);
    debugLog('- Body children count:', document.body?.children?.length || 0);
    debugLog('- FileExplorer elements:', document.querySelectorAll('[data-codevideo-id="file-explorer"]').length);
    debugLog('- All data-codevideo-id elements:', document.querySelectorAll('[data-codevideo-id]').length);

    // Debug what file explorer elements actually exist
    const allFileExplorerElements = document.querySelectorAll('[data-codevideo-id^="file-explorer-"]');
    debugLog('📋 Available file explorer elements:');
    allFileExplorerElements.forEach(el => {
        debugLog(`  - ${el.getAttribute('data-codevideo-id')}`);
    });
};

export const getCoordinatesOfFileOrFolder = (fileOrFolderPath: string, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    try {
        if (!containerRef) return DEFAULT_MOUSE_POSITION;
        debugLog('🎯 [getCoordinatesOfFileOrFolder] Looking for:', fileOrFolderPath);

        const selector = `[data-codevideo-id="file-explorer-${fileOrFolderPath}"]`;
        debugLog('🔍 [getCoordinatesOfFileOrFolder] Selector:', selector);

        // Debugging DOM state
        debugDOMState();

        debugLog('🔍 [getCoordinatesOfFileOrFolder] About to call document.querySelector...');
        const fileElement = document.querySelector(selector);
        debugLog('🔍 [getCoordinatesOfFileOrFolder] document.querySelector completed successfully');
        debugLog('🔍 [getCoordinatesOfFileOrFolder] Element found:', !!fileElement);

        // TODO: happens quite a lot, need to rearrange when the file tree is ready to be found.
        if (!fileElement) {
            debugLog('❌ [getCoordinatesOfFileOrFolder] Element not found');
            // Let's see what elements we do have
            const allFileExplorerElements = document.querySelectorAll('[data-codevideo-id^="file-explorer-"]');
            debugLog('📋 [getCoordinatesOfFileOrFolder] Available file explorer elements:');
            allFileExplorerElements.forEach(el => {
                debugLog(`  - ${el.getAttribute('data-codevideo-id')}`);
            });
            return DEFAULT_MOUSE_POSITION;
        }

        debugLog('✅ [getCoordinatesOfFileOrFolder] Found element, about to get bounding rect...');
        const rect = fileElement.getBoundingClientRect();
        debugLog('✅ [getCoordinatesOfFileOrFolder] Got bounding rect successfully');
        
        debugLog('📐 [getCoordinatesOfFileOrFolder] Element rect:', JSON.stringify({
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
        debugLog('📍 [getCoordinatesOfFileOrFolder] Absolute center coords:', JSON.stringify(absoluteCoords));

        debugLog('🔍 [getCoordinatesOfFileOrFolder] About to call convertToContainerCoordinates...');
        const result = convertToContainerCoordinates(absoluteCoords, containerRef);
        debugLog('🔍 [getCoordinatesOfFileOrFolder] convertToContainerCoordinates completed successfully');
        debugLog('🎯 [getCoordinatesOfFileOrFolder] Final container-relative coords:', JSON.stringify(result));

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