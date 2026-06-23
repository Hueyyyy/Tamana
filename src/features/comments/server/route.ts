import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ID, Query } from 'node-appwrite';

import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';
import { DATABASE_ID, COMMENTS_ID, NOTIFICATIONS_ID, IMAGES_BUCKET_ID } from '@/config';
import { getMember } from '@/features/members/utils';
import { NotificationType } from '@/features/notifications/types';
import { sendEmailNotification } from '@/features/notifications/utils';

import { createCommentFormSchema, getCommentsSchema, updateCommentSchema } from '../schemas';
import { Comment } from '../types';

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/api/comments/attachment/')) return url;
  
  const match = url.match(/\/files\/([^\/?]+)/);
  if (match && match[1]) {
    return `/api/comments/attachment/${match[1]}`;
  }
  return url;
}

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', getCommentsSchema), async (c) => {
    const { users, storage: adminStorage } = await createAdminClient();
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
        const imageId = user.prefs?.imageId;
        let userAvatar: string | undefined;
        if (imageId) {
          try {
            // Use admin storage to read any user's avatar regardless of ownership.
            const arrayBuffer = await adminStorage.getFilePreview(IMAGES_BUCKET_ID, imageId);
            userAvatar = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          } catch {
            // avatar not critical — fall back to initials
          }
        }
        return {
          ...comment,
          userName: user.name,
          userAvatar,
          imageUrl: normalizeUrl(comment.imageUrl),
          attachmentUrl: normalizeUrl(comment.attachmentUrl),
        };
      })
    );

    return c.json({ data: { documents: populatedComments, total: comments.total } });
  })
  .get('/attachment/:fileId', sessionMiddleware, async (c) => {
    const { fileId } = c.req.param();
    const { storage: adminStorage } = await createAdminClient();

    try {
      const fileInfo = await adminStorage.getFile(IMAGES_BUCKET_ID, fileId);
      const arrayBuffer = await adminStorage.getFileView(IMAGES_BUCKET_ID, fileId);

      c.header('Content-Type', fileInfo.mimeType);
      c.header('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.name)}"`);
      return c.body(arrayBuffer);
    } catch (error) {
      const err = error as Error & { code?: number; type?: string };
      console.error('Failed to proxy attachment:', err);
      return c.json({ 
        error: 'File not found or access denied',
        message: err.message,
        code: err.code,
        type: err.type
      }, 500);
    }
  })
  .post('/', sessionMiddleware, zValidator('form', createCommentFormSchema), async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const storage = c.get('storage');
    const { content, taskId, workspaceId, tags, image, attachment } = c.req.valid('form');

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const imagesList = Array.isArray(image) ? image : (image instanceof File ? [image] : []);
    const attachmentsList = Array.isArray(attachment) ? attachment : (attachment instanceof File ? [attachment] : []);

    const hasContent = content && content.trim().length > 0;
    const hasFiles = imagesList.length > 0 || attachmentsList.length > 0;

    if (!hasContent && !hasFiles) {
      return c.json({ error: 'Comment must contain a message or file attachment' }, 400);
    }

    const imageUrls: string[] = [];
    for (const img of imagesList) {
      if (img instanceof File) {
        const fileResponse = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          img,
        );
        imageUrls.push(`/api/comments/attachment/${fileResponse.$id}`);
      }
    }

    const attachmentUrls: string[] = [];
    const attachmentNames: string[] = [];
    for (const att of attachmentsList) {
      if (att instanceof File) {
        const fileResponse = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          att,
        );
        attachmentUrls.push(`/api/comments/attachment/${fileResponse.$id}`);
        attachmentNames.push(att.name);
      }
    }

    const imageUrl = imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined;
    const attachmentUrl = attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : undefined;
    const attachmentName = attachmentNames.length > 0 ? JSON.stringify(attachmentNames) : undefined;

    const parsedTags: string[] = tags ? JSON.parse(tags) : [];

    const comment = await databases.createDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      ID.unique(),
      {
        content,
        taskId,
        workspaceId,
        userId: user.$id,
        tags: parsedTags,
        imageUrl,
        attachmentUrl,
        attachmentName,
      }
    );

    const normalizedComment = {
      ...comment,
      imageUrl: normalizeUrl(comment.imageUrl),
      attachmentUrl: normalizeUrl(comment.attachmentUrl),
    };

    // Return immediately — @mention notifications fire in the background
    // so tagged users get their Realtime event without blocking the response.
    if (parsedTags && parsedTags.length > 0) {
      const uniqueTags = Array.from(new Set(parsedTags));
      Promise.all(
        uniqueTags.map(async (taggedUserId) => {
          if (taggedUserId === user.$id) return;
          await Promise.all([
            databases.createDocument(
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
            ),
            sendEmailNotification({
              userId: taggedUserId,
              title: 'Tagged in a comment',
              message: `${user.name} tagged you in a comment. Click here to view: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/tasks/${taskId}`,
            }),
          ]);
        })
      ).catch((err) => console.error('[comment:create] notification side-effect failed:', err));
    }

    return c.json({ data: normalizedComment });
  })
  .delete('/:commentId', sessionMiddleware, async (c) => {
    const user = c.get('user');
    const databases = c.get('databases');
    const { commentId } = c.req.param();

    const comment = await databases.getDocument<Comment>(
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
    const { content, tags, imageUrl, attachmentUrl, attachmentName } = c.req.valid('json');

    const comment = await databases.getDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      commentId
    );

    // Only the author can update a comment
    if (comment.userId !== user.$id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const hasContent = !!(content && content.trim().length > 0);
    let hasFiles = false;
    if (imageUrl) {
      if (imageUrl.startsWith('[')) {
        try {
          const parsed = JSON.parse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) hasFiles = true;
        } catch {}
      } else {
        hasFiles = true;
      }
    }
    if (attachmentUrl) {
      if (attachmentUrl.startsWith('[')) {
        try {
          const parsed = JSON.parse(attachmentUrl);
          if (Array.isArray(parsed) && parsed.length > 0) hasFiles = true;
        } catch {}
      } else {
        hasFiles = true;
      }
    }

    if (!hasContent && !hasFiles) {
      return c.json({ error: 'Comment must contain a message or file attachment' }, 400);
    }

    const updatedComment = await databases.updateDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      commentId,
      {
        content,
        tags: tags || [],
        imageUrl,
        attachmentUrl,
        attachmentName,
      }
    );

    const normalizedComment = {
      ...updatedComment,
      imageUrl: normalizeUrl(updatedComment.imageUrl),
      attachmentUrl: normalizeUrl(updatedComment.attachmentUrl),
    };

    // Return immediately — newly-tagged notifications fire in the background.
    if (tags && tags.length > 0) {
      const existingTags = comment.tags || [];
      const newTags = tags.filter((tagId: string) => !existingTags.includes(tagId));
      const uniqueNewTags = Array.from(new Set(newTags));

      Promise.all(
        uniqueNewTags.map(async (taggedUserId) => {
          if (taggedUserId === user.$id) return;
          await Promise.all([
            databases.createDocument(
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
            ),
            sendEmailNotification({
              userId: taggedUserId,
              title: 'Tagged in a comment',
              message: `${user.name} tagged you in a comment. Click here to view: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${comment.workspaceId}/tasks/${comment.taskId}`,
            }),
          ]);
        })
      ).catch((err) => console.error('[comment:update] notification side-effect failed:', err));
    }

    return c.json({ data: normalizedComment });
  });

export default app;
