import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Required'),
  taskId: z.string().trim().min(1, 'Required'),
  workspaceId: z.string().trim().min(1, 'Required'),
  tags: z.array(z.string()).optional(),
});

export const getCommentsSchema = z.object({
  taskId: z.string().trim().min(1, 'Required'),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Required'),
  tags: z.array(z.string()).optional(),
});
