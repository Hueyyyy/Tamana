import { Models } from "node-appwrite";

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BACKLOG = 'BACKLOG',
  IN_REVIEW = 'IN_REVIEW',
}

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus;
  assigneeId?: string | null;
  projectId: string;
  dueDate: string;
  position: number;
  workspaceId: string;
  description?: string;
  parentId?: string | null;
  parentTask?: Task | null;
  priority?: TaskPriority;
  totalSubTasks?: number;
  completedSubTasks?: number;
}