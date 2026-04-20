import { Models } from "node-appwrite";

export enum ActivityType {
  TASK_CREATED = 'TASK_CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNEE_CHANGED = 'ASSIGNEE_CHANGED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
  NAME_CHANGED = 'NAME_CHANGED',
  DESCRIPTION_CHANGED = 'DESCRIPTION_CHANGED',
  PROJECT_CHANGED = 'PROJECT_CHANGED',
}

export type Activity = Models.Document & {
  taskId: string;
  workspaceId: string;
  userId: string;
  type: ActivityType;
  description: string;
}

export type PopulatedActivity = Activity & {
  userName: string;
  userAvatar?: string;
}
