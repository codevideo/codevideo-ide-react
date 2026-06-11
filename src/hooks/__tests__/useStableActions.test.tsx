import React from 'react';
import { renderHook } from '@testing-library/react';
import { IAction, ILesson } from '@fullstackcraftllc/codevideo-types';
import { useStableActions } from '../useStableActions';

const a = (name: string, value: string): IAction => ({ name, value } as IAction);

const base: IAction[] = [
  a('author-speak-before', 'one'),
  a('editor-type', 'console.log(1);'),
];

type Props = {
  project: any;
  lessonIndex: number | null;
  actionIndex: number;
};

const setup = (initial: Props, wrapper?: React.JSXElementConstructor<{ children: React.ReactNode }>) =>
  renderHook(
    ({ project, lessonIndex, actionIndex }: Props) =>
      useStableActions(project, lessonIndex, actionIndex),
    { initialProps: initial, wrapper }
  );

describe('useStableActions', () => {
  it('keeps the epoch stable across rerenders with the same reference', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    rerender({ project: base, lessonIndex: null, actionIndex: 0 });
    rerender({ project: base, lessonIndex: null, actionIndex: 1 });

    expect(result.current.actionsEpoch).toBe(epoch);
    expect(result.current.actions).toBe(base);
  });

  it('keeps the epoch stable on a pure append (same element references)', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    const appended = [...base, a('author-speak-before', 'two')];
    rerender({ project: appended, lessonIndex: null, actionIndex: 0 });

    expect(result.current.actionsEpoch).toBe(epoch);
    expect(result.current.actions).toBe(appended);
  });

  it('keeps the epoch stable on wholesale replacement with identical prefix content (streaming/Redux case)', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    // all-new object references, same name+value content, one new action appended
    const rebuilt = [
      a('author-speak-before', 'one'),
      a('editor-type', 'console.log(1);'),
      a('terminal-type', 'npm test'),
    ];
    rerender({ project: rebuilt, lessonIndex: null, actionIndex: 0 });

    expect(result.current.actionsEpoch).toBe(epoch);
    expect(result.current.actions).toBe(rebuilt);
  });

  it('bumps the epoch on truncation', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    rerender({ project: base.slice(0, 1), lessonIndex: null, actionIndex: 0 });

    expect(result.current.actionsEpoch).toBe(epoch + 1);
  });

  it('bumps the epoch when an earlier action is edited', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    const edited = [a('author-speak-before', 'CHANGED'), base[1]];
    rerender({ project: edited, lessonIndex: null, actionIndex: 0 });

    expect(result.current.actionsEpoch).toBe(epoch + 1);
  });

  it('bumps the epoch when the lesson index changes', () => {
    const lessonA: ILesson = { id: 'a', name: 'A', description: '', actions: base };
    const course = {
      id: 'c', name: 'C', description: '', primaryLanguage: 'ts',
      lessons: [lessonA, { ...lessonA, id: 'b' }],
    };
    const { result, rerender } = setup({ project: course, lessonIndex: 0, actionIndex: 0 });
    const epoch = result.current.actionsEpoch;

    rerender({ project: course, lessonIndex: 1, actionIndex: 0 });

    // identical content in both lessons, but the lesson switch must still reset
    expect(result.current.actionsEpoch).toBe(epoch + 1);
  });

  it('is idempotent under StrictMode double-rendering', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <React.StrictMode>{children}</React.StrictMode>
    );
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 0 }, wrapper);
    const epoch = result.current.actionsEpoch;

    const appended = [...base, a('author-speak-before', 'two')];
    rerender({ project: appended, lessonIndex: null, actionIndex: 0 });

    expect(result.current.actionsEpoch).toBe(epoch);
  });

  it('exposes currentAction and starvation state', () => {
    const { result, rerender } = setup({ project: base, lessonIndex: null, actionIndex: 1 });
    expect(result.current.currentAction).toBe(base[1]);
    expect(result.current.hasActionAtCurrentIndex).toBe(true);

    // starved: index points one past the available actions
    rerender({ project: base, lessonIndex: null, actionIndex: 2 });
    expect(result.current.currentAction).toBeNull();
    expect(result.current.hasActionAtCurrentIndex).toBe(false);

    // an append makes the action available
    const appended = [...base, a('author-speak-before', 'two')];
    rerender({ project: appended, lessonIndex: null, actionIndex: 2 });
    expect(result.current.currentAction).toBe(appended[2]);
    expect(result.current.hasActionAtCurrentIndex).toBe(true);
  });

  it('extracts from lesson- and course-shaped projects', () => {
    const lesson: ILesson = { id: 'l', name: 'L', description: '', actions: base };
    const { result, rerender } = setup({ project: lesson, lessonIndex: null, actionIndex: 0 });
    expect(result.current.actions).toBe(base);

    const course = {
      id: 'c', name: 'C', description: '', primaryLanguage: 'ts', lessons: [lesson],
    };
    rerender({ project: course, lessonIndex: 0, actionIndex: 0 });
    expect(result.current.actions).toBe(base);
  });
});
