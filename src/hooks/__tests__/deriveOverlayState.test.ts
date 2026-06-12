import { IAction } from '@fullstackcraftllc/codevideo-types';
import { deriveOverlayState } from '../deriveOverlayState';

const a = (name: string, value = ''): IAction => ({ name, value } as IAction);

describe('deriveOverlayState', () => {
  it.each([
    ['null action', null, true, { type: 'hide' }],
    ['null action backward', null, false, { type: 'hide' }],
    ['slide-display', a('slide-display', '# Hi'), true, { type: 'slide', slideMarkdown: '# Hi' }],
    ['slide-display backward', a('slide-display', '# Hi'), false, { type: 'slide', slideMarkdown: '# Hi' }],
    ['external-web-preview', a('external-web-preview', '1'), true, { type: 'web-preview' }],
    ['external-browser', a('external-browser', 'https://x.dev'), true, { type: 'external-browser', url: 'https://x.dev' }],
    ['external-browser-scroll', a('external-browser-scroll', '300'), true, { type: 'external-browser', url: '300' }],
    ['author forward keeps overlays', a('author-speak-before', 'hi'), true, { type: 'keep' }],
    ['author backward hides', a('author-speak-before', 'hi'), false, { type: 'hide' }],
    ['author-wait forward keeps', a('author-wait', '500'), true, { type: 'keep' }],
    ['editor action hides', a('editor-type', 'x'), true, { type: 'hide' }],
    ['terminal action hides', a('terminal-type', 'ls'), false, { type: 'hide' }],
    ['file-explorer action hides', a('file-explorer-create-file', 'a.ts'), true, { type: 'hide' }],
  ] as const)('%s', (_label, action, forward, expected) => {
    expect(deriveOverlayState(action as IAction | null, forward)).toEqual(expected);
  });
});
