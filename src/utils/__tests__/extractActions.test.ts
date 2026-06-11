import { IAction, ICourse, ILesson } from '@fullstackcraftllc/codevideo-types';
import { extractActions, getActionAtIndex } from '../extractActions';

const actions: Array<IAction> = [
  { name: 'author-speak-before', value: 'Welcome!' },
  { name: 'file-explorer-create-file', value: 'index.ts' },
  { name: 'editor-type', value: 'console.log("hi");' },
];

const otherActions: Array<IAction> = [
  { name: 'author-speak-before', value: 'Lesson two' },
];

const lesson: ILesson = {
  id: 'lesson-1',
  name: 'Test Lesson',
  description: 'A lesson',
  actions,
};

const course: ICourse = {
  id: 'course-1',
  name: 'Test Course',
  description: 'A course',
  primaryLanguage: 'typescript',
  lessons: [lesson, { ...lesson, id: 'lesson-2', actions: otherActions }],
};

describe('extractActions', () => {
  it('returns a raw actions array as-is', () => {
    expect(extractActions(actions, null)).toBe(actions);
  });

  it('returns a lesson\'s actions regardless of lesson index', () => {
    expect(extractActions(lesson, null)).toBe(actions);
    expect(extractActions(lesson, 5)).toBe(actions);
  });

  it('returns the indexed lesson\'s actions for a course', () => {
    expect(extractActions(course, 0)).toBe(actions);
    expect(extractActions(course, 1)).toBe(otherActions);
  });

  it('returns [] for a course with null or -1 lesson index (matches reconstituteAllPartsOfState semantics)', () => {
    expect(extractActions(course, null)).toEqual([]);
    expect(extractActions(course, -1)).toEqual([]);
  });

  it('returns [] for a course with an out-of-range lesson index', () => {
    expect(extractActions(course, 99)).toEqual([]);
  });

  it('returns [] for empty/nullish projects', () => {
    expect(extractActions([], null)).toEqual([]);
    expect(extractActions(undefined as any, null)).toEqual([]);
    expect(extractActions(null as any, null)).toEqual([]);
    expect(extractActions({} as any, null)).toEqual([]);
  });

  it('is lenient: does NOT filter out actions with empty values (critical for streaming)', () => {
    // the strict extractActionsFromProject in codevideo-types returns [] for the
    // whole array if any single action is invalid; this util must not do that,
    // otherwise one malformed streamed action would blank the entire timeline
    const withEmpty: Array<IAction> = [
      { name: 'author-speak-before', value: 'hello' },
      { name: 'external-web-preview', value: '' as any },
    ];
    expect(extractActions(withEmpty, null)).toBe(withEmpty);

    const lessonWithEmpty = { ...lesson, actions: withEmpty };
    expect(extractActions(lessonWithEmpty, null)).toBe(withEmpty);
  });
});

describe('getActionAtIndex', () => {
  it('returns the action at a valid index', () => {
    expect(getActionAtIndex(actions, 0)).toBe(actions[0]);
    expect(getActionAtIndex(actions, 2)).toBe(actions[2]);
  });

  it('returns null for out-of-range indexes', () => {
    expect(getActionAtIndex(actions, -1)).toBeNull();
    expect(getActionAtIndex(actions, 3)).toBeNull();
    expect(getActionAtIndex([], 0)).toBeNull();
  });
});
