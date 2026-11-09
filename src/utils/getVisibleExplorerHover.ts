import { IFileExplorerSnapshot, IMouseSnapshot } from '@fullstackcraftllc/codevideo-types';

// Which file explorer rows should look hovered. The virtual mouse keeps the last
// hovered file and folder names until the next mouse move, so after a context
// menu item is clicked (New File, Rename, ...) the names outlive the pointer
// being there: the folder that was right-clicked stayed highlighted instead of
// the file it created. A row counts as hovered only while the pointer is on it
// or its context menu is open.
export const getVisibleExplorerHover = (
  mouse: Pick<IMouseSnapshot, 'location' | 'currentHoveredFileName' | 'currentHoveredFolderName'>,
  explorer: Pick<IFileExplorerSnapshot, 'isFileContextMenuOpen' | 'isFolderContextMenuOpen'>,
) => ({
  file: mouse.location === 'file-explorer-file' || explorer.isFileContextMenuOpen ? mouse.currentHoveredFileName : '',
  folder: mouse.location === 'file-explorer-folder' || explorer.isFolderContextMenuOpen ? mouse.currentHoveredFolderName : '',
});
