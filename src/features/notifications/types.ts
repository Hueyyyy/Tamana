import { Models } from "node-appwrite";

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UNASSIGNED = 'TASK_UNASSIGNED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  COMMENT_TAG = 'COMMENT_TAG',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED',
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
