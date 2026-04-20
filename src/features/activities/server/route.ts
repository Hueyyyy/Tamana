import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { Query } from 'node-appwrite';
import { z } from 'zod';

import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';
import { DATABASE_ID, ACTIVITIES_ID } from '@/config';

import { Activity } from '../types';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', z.object({
    taskId: z.string(),
  })), async (c) => {
    const { users } = await createAdminClient();
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
        return {
          ...activity,
          userName: user.name,
          userAvatar: user.prefs?.imageId,
        };
      })
    );

    return c.json({ data: { documents: populatedActivities, total: activities.total } });
  });

export default app;
