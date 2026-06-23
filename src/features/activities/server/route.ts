import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { Query } from 'node-appwrite';
import { z } from 'zod';

import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';
import { DATABASE_ID, ACTIVITIES_ID, IMAGES_BUCKET_ID } from '@/config';

import { Activity } from '../types';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', z.object({
    taskId: z.string(),
  })), async (c) => {
    const { users, storage: adminStorage } = await createAdminClient();
    const databases = c.get('databases');
    const { taskId } = c.req.valid('query');

    const activities = await databases.listDocuments<Activity>(
      DATABASE_ID,
      ACTIVITIES_ID,
      [
        Query.equal('taskId', taskId),
        Query.orderDesc('$createdAt'),
      ]
    );

    const populatedActivities = await Promise.all(
      activities.documents.map(async (activity) => {
        const user = await users.get(activity.userId);
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
          ...activity,
          userName: user.name,
          userAvatar,
        };
      })
    );

    return c.json({ data: { documents: populatedActivities, total: activities.total } });
  });

export default app;
