import { getVisibleExplorerHover } from '../getVisibleExplorerHover';

const closedMenus = { isFileContextMenuOpen: false, isFolderContextMenuOpen: false };
const mouse = (location: string, folder = '', file = '') =>
  ({ location, currentHoveredFolderName: folder, currentHoveredFileName: file }) as any;

test('a folder under the pointer is hovered', () => {
  expect(getVisibleExplorerHover(mouse('file-explorer-folder', 'src/generics'), closedMenus)).toEqual({ file: '', folder: 'src/generics' });
});

test('the right-clicked folder stays hovered while its context menu is open', () => {
  const onMenuItem = mouse('file-explorer-folder-context-menu-new-file', 'src/generics');
  expect(getVisibleExplorerHover(onMenuItem, { ...closedMenus, isFolderContextMenuOpen: true }).folder).toBe('src/generics');
});

test('once the menu item is clicked, the folder no longer looks hovered, so the new file can', () => {
  // The virtual mouse still names the folder: only a later mouse move clears it.
  const afterClick = mouse('file-explorer-folder-context-menu-new-file', 'src/generics');
  expect(getVisibleExplorerHover(afterClick, closedMenus)).toEqual({ file: '', folder: '' });
});

test('a file keeps its hover through its own context menu, then drops it', () => {
  const onRename = mouse('file-explorer-file-context-menu-rename', '', 'src/App.tsx');
  expect(getVisibleExplorerHover(onRename, { ...closedMenus, isFileContextMenuOpen: true }).file).toBe('src/App.tsx');
  expect(getVisibleExplorerHover(onRename, closedMenus).file).toBe('');
  expect(getVisibleExplorerHover(mouse('file-explorer-file', '', 'src/App.tsx'), closedMenus).file).toBe('src/App.tsx');
});
