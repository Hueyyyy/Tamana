import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim(),
  taskId: z.string().trim().min(1, 'Required'),
  workspaceId: z.string().trim().min(1, 'Required'),
  tags: z.array(z.string()).optional(),
});

export const createCommentFormSchema = z.object({
  content: z.string().trim(),
  taskId: z.string().trim().min(1, 'Required'),
  workspaceId: z.string().trim().min(1, 'Required'),
  tags: z.string().optional(),
  image: z
    .union([
      z.instanceof(File),
      z.array(z.instanceof(File)),
      z.string().transform((value) => (value === '' ? undefined : value)),
    ])
    .optional(),
  attachment: z
    .union([
      z.instanceof(File),
      z.array(z.instanceof(File)),
      z.string().transform((value) => (value === '' ? undefined : value)),
    ])
    .optional(),
});

export const getCommentsSchema = z.object({
  taskId: z.string().trim().min(1, 'Required'),
});

export const updateCommentSchema = z.object({
  content: z.string().trim(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
});
