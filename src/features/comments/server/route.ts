import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ID, Query } from 'node-appwrite';

import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';
import { DATABASE_ID, COMMENTS_ID, NOTIFICATIONS_ID } from '@/config';
import { getMember } from '@/features/members/utils';
import { NotificationType } from '@/features/notifications/types';
import { sendEmailNotification } from '@/features/notifications/utils';

import { createCommentSchema, getCommentsSchema, updateCommentSchema } from '../schemas';
import { Comment } from '../types';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', getCommentsSchema), async (c) => {
    const { users } = await createAdminClient();
    const databases = c.get('databases');
    const { taskId } = c.req.valid('query');

    // For simplicity, we assume the user has access if they can call this (authenticated).
    // In a production app, we'd verify the user belongs to the workspace of the task.

    const comments = await databases.listDocuments<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      [
        Query.equal('taskId', taskId),
        Query.orderDesc('$createdAt'),
      ]
    );

    const populatedComments = await Promise.all(
      comments.documents.map(async (comment) => {
        const user = await users.get(comment.userId);
        return {
          ...comment,
          userName: user.name,
          userAvatar: user.prefs?.imageId,
        };
      })
    );

    return c.json({ data: { documents: populatedComments, total: comments.total } });
  })
  .post('/', sessionMiddleware, zValidator('json', createCommentSchema), async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const { content, taskId, workspaceId, tags } = c.req.valid('json');

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const comment = await databases.createDocument(
      DATABASE_ID,
      COMMENTS_ID,
      ID.unique(),
      {
        content,
        taskId,
        workspaceId,
        userId: user.$id,
        tags: tags || [],
      }
    );

    // Notifications for tagged users
    if (tags && tags.length > 0) {
      const uniqueTags = Array.from(new Set(tags));
      await Promise.all(
        uniqueTags.map(async (taggedUserId) => {
          if (taggedUserId === user.$id) return; // Don't notify yourself

          await databases.createDocument(
            DATABASE_ID,
            NOTIFICATIONS_ID,
            ID.unique(),
            {
              userId: taggedUserId,
              workspaceId,
              title: 'Tagged in a comment',
              message: `${user.name} tagged you in a comment.`,
              type: NotificationType.COMMENT_TAG,
              targetId: taskId,
              isRead: false,
            }
          );

          await sendEmailNotification({
            userId: taggedUserId,
            title: 'Tagged in a comment',
            message: `${user.name} tagged you in a comment. Click here to view: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/tasks/${taskId}`,
          });
        })
      );
    }

    return c.json({ data: comment });
  })
  .delete('/:commentId', sessionMiddleware, async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const { commentId } = c.req.param();

    const comment = await databases.getDocument(
      DATABASE_ID,
      COMMENTS_ID,
      commentId
    );

    const member = await getMember({
      databases,
      workspaceId: comment.workspaceId,
      userId: user.$id,
    });

    // Only the author or a workspace admin can delete a comment
    if (!member || (comment.userId !== user.$id && member.role !== 'ADMIN')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, commentId);

    return c.json({ data: { $id: commentId } });
  })
  .patch('/:commentId', sessionMiddleware, zValidator('json', updateCommentSchema), async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const { commentId } = c.req.param();
    const { content, tags } = c.req.valid('json');

    const comment = await databases.getDocument(
      DATABASE_ID,
      COMMENTS_ID,
      commentId
    );

    // Only the author can update a comment
    if (comment.userId !== user.$id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updatedComment = await databases.updateDocument(
      DATABASE_ID,
      COMMENTS_ID,
      commentId,
      {
        content,
        tags: tags || [],
      }
    );

    // Notifications for newly tagged users
    if (tags && tags.length > 0) {
      const existingTags = comment.tags || [];
      const newTags = tags.filter((tagId: string) => !existingTags.includes(tagId));
      const uniqueNewTags = Array.from(new Set(newTags));

      await Promise.all(
        uniqueNewTags.map(async (taggedUserId) => {
          if (taggedUserId === user.$id) return;

          await databases.createDocument(
            DATABASE_ID,
            NOTIFICATIONS_ID,
            ID.unique(),
            {
              userId: taggedUserId,
              workspaceId: comment.workspaceId,
              title: 'Tagged in a comment',
              message: `${user.name} tagged you in a comment.`,
              type: NotificationType.COMMENT_TAG,
              targetId: comment.taskId,
              isRead: false,
            }
          );

          await sendEmailNotification({
            userId: taggedUserId,
            title: 'Tagged in a comment',
            message: `${user.name} tagged you in a comment. Click here to view: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${comment.workspaceId}/tasks/${comment.taskId}`,
          });
        })
      );
    }

    return c.json({ data: updatedComment });
  });

export default app;
