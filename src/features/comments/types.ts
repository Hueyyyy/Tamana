import { Models } from "node-appwrite";

export type Comment = Models.Document & {
  content: string;
  taskId: string;
  workspaceId: string;
  userId: string;
  tags?: string[];
  imageUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export type PopulatedComment = Comment & {
  userName: string;
  userAvatar?: string;
}
