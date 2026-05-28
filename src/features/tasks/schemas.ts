import { z } from 'zod';
import { TaskStatus, TaskPriority } from './types';

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus, {required_error:'Required'}),
  workspaceId:z.string().trim().min(1,'Required'),
  assigneeId: z.string().trim().optional().nullable(),
  dueDate: z.coerce.date(),
  projectId: z.string().trim().min(1,'Required'),
  parentId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
});