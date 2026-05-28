import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { TaskStatus, TaskPriority } from '../types';

export const useTaskFilters = () => {

  return useQueryStates({
    projectId: parseAsString,
    assigneeId: parseAsString,
    status: parseAsStringEnum(Object.values(TaskStatus)),
    priority: parseAsStringEnum(Object.values(TaskPriority)),
    dueDate: parseAsString,
    search: parseAsString
  });
};