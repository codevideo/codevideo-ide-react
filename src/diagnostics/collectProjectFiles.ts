import { IEditor, IFileSource, IFileStructure, normalizeDiagnosticsPath } from '@fullstackcraftllc/codevideo-types';

/**
 * Every file in the project as the IDE shows it: saved contents from the file
 * explorer, replaced by the editor buffer for files that are open (diagnostics
 * describe unsaved text, as in VS Code). Sorted by path.
 */
export function collectProjectFiles(fileStructure: IFileStructure | undefined, editors: Array<IEditor> | undefined): Array<IFileSource> {
  const files = new Map<string, string>();
  const visit = (structure: IFileStructure, prefix: string) => {
    for (const [name, item] of Object.entries(structure)) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (item.type === 'file') files.set(normalizeDiagnosticsPath(path), item.content ?? '');
      else if (item.children) visit(item.children, path);
    }
  };
  if (fileStructure) visit(fileStructure, '');
  for (const editor of editors ?? []) {
    if (editor.filename) files.set(normalizeDiagnosticsPath(editor.filename), editor.content ?? '');
  }
  return Array.from(files.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([path, content]) => ({ path, content }));
}

/** A short, stable fingerprint of the files and the open editors (FNV-1a, two seeds). */
export function diagnosticsInputKey(files: Array<IFileSource>, targets: Array<string>): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  const add = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      a = Math.imul(a ^ code, 0x01000193);
      b = Math.imul(b ^ code, 0x5bd1e995) ^ (b >>> 15);
    }
    a = Math.imul(a ^ 0, 0x01000193);
    b = Math.imul(b ^ 0, 0x5bd1e995) ^ (b >>> 15);
  };
  for (const file of files) { add(file.path); add(file.content); }
  add('\u0001');
  for (const target of targets) add(target);
  return `${files.length}:${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
}
