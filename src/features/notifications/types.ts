import { Models } from "node-appwrite";

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UNASSIGNED = 'TASK_UNASSIGNED',
  STATUS_UPDATED = 'STATUS_UPDATED',
}

export type Notification = Models.Document & {
  userId: string;
  workspaceId: string;
  title: string;
  message: string;
  type: NotificationType;
  targetId: string;
  isRead: boolean;
}
