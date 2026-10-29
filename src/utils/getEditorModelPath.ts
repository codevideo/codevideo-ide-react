/** A stable file URI shared by the React wrapper and our mounted Monaco API.
 * Building the string is SSR-safe; parsing it happens only in the browser.
 */
export function getEditorModelPath(filename: string): string {
  return 'file:///' + filename.replace(/\\/g, '/').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
}
