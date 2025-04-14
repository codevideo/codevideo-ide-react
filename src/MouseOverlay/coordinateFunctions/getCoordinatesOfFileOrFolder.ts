import { IPoint } from "@fullstackcraftllc/codevideo-types";
import { convertToContainerCoordinates } from "./convertToContainerCoordinates";
import { DEFAULT_MOUSE_POSITION } from "src/constants/CodeVideoIDEConstants";

export const getCoordinatesOfFileOrFolder = (fileOrFolderPath: string, containerRef: React.RefObject<HTMLDivElement | null>): IPoint => {
    if (!containerRef) return DEFAULT_MOUSE_POSITION;
    console.log('fileOrFolderPath', fileOrFolderPath);
    const fileElement = document.querySelector(`[data-codevideo-id="file-explorer-${fileOrFolderPath}"]`);

    // TODO: happens quite a lot, need to rearrange when the file tree is ready to be found.
    if (!fileElement) {
        // console.log('fileElement not found');
        return DEFAULT_MOUSE_POSITION;
    }
    // console.log('fileElement', fileElement);
    const rect = fileElement.getBoundingClientRect();
    return convertToContainerCoordinates({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    }, containerRef);
};