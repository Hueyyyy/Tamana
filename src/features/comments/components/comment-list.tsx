'use client';

import { Member } from '@/features/members/type';
import { PopulatedComment } from '../types';
import { CommentItem } from './comment-item';

interface CommentListProps {
  comments: PopulatedComment[];
  members: Member[];
}

export const CommentList = ({ comments, members }: CommentListProps) => {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.$id} comment={comment} members={members} />
      ))}
    </div>
  );
};
