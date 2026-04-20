import { ID, type Databases } from 'node-appwrite';
import { DATABASE_ID, ACTIVITIES_ID } from '@/config';
import { ActivityType } from './types';

interface CreateActivityProps {
  databases: Databases;
  taskId: string;
  workspaceId: string;
  userId: string;
  type: ActivityType;
  description: string;
}

export const createActivity = async ({
  databases,
  taskId,
  workspaceId,
  userId,
  type,
  description,
}: CreateActivityProps) => {
  try {
    await databases.createDocument(
      DATABASE_ID,
      ACTIVITIES_ID,
      ID.unique(),
      {
        taskId,
        workspaceId,
        userId,
        type,
        description,
      }
    );
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};
