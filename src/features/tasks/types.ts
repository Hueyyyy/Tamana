import { Models } from "node-appwrite";

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BACKLOG = 'BACKLOG',
  IN_REVIEW = 'IN_REVIEW',
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus;
  assigneeId: string;
  projectId: string;
  dueDate: string;
  position: number;
  workspaceId: string;
  description?: string;
}