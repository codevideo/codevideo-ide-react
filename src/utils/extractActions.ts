import { IAction, ICourse, ILesson, Project } from '@fullstackcraftllc/codevideo-types';

/**
 * Lenient, shape-based action extraction — the single source of truth for
 * getting the actions array out of a Project (IAction[] | ILesson | ICourse).
 *
 * Deliberately NOT extractActionsFromProject from codevideo-types: that
 * version validates every action and returns [] for the whole array if any
 * single action is invalid (e.g. an empty value). With streamed/in-progress
 * actions arrays (codevideo-genie), one malformed action must not blank the
 * entire timeline.
 *
 * Course semantics match reconstituteAllPartsOfState: a course with a null or
 * out-of-range lesson index yields [].
 */
export const extractActions = (
  project: Project | null | undefined,
  currentLessonIndex: number | null
): Array<IAction> => {
  if (!project) {
    return [];
  }
  if (Array.isArray(project)) {
    return project;
  }
  if ('actions' in project) {
    return (project as ILesson).actions ?? [];
  }
  if ('lessons' in project) {
    if (currentLessonIndex === null || currentLessonIndex < 0) {
      return [];
    }
    return (project as ICourse).lessons?.[currentLessonIndex]?.actions ?? [];
  }
  return [];
};

/**
 * Bounds-checked action lookup; replaces the repeated
 * `index >= 0 && index < actions.length ? actions[index] : null` idiom.
 */
export const getActionAtIndex = (
  actions: Array<IAction>,
  index: number
): IAction | null =>
  index >= 0 && index < actions.length ? actions[index] : null;
