'use client';

import { useGetComments } from '../api/use-get-comments';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import { DottedSeparator } from '@/components/dotted-separator';
import { Loader } from 'lucide-react';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

interface CommentSectionProps {
  taskId: string;
}

export const CommentSection = ({ taskId }: CommentSectionProps) => {
  const workspaceId = useWorkspaceId();
  const { data: comments, isLoading: isLoadingComments } = useGetComments({ taskId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

  const isLoading = isLoadingComments || isLoadingMembers;

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <h3 className="text-lg font-semibold">Comments</h3>
        <DottedSeparator />
      </div>

      <CommentForm taskId={taskId} />

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CommentList 
          comments={comments?.documents || []} 
          members={members?.documents || []}
        />
      )}
    </div>
  );
};
