'use client';

import { useState } from 'react';
import { PopulatedComment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Pencil, X, Check } from 'lucide-react';
import { useDeleteComment } from '../api/use-delete-comment';
import { useUpdateComment } from '../api/use-update-comment';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMemberInfo } from '@/features/members/api/use-get-member-info';
import useConfirm from '@/hooks/use-confirm';
import { Member } from '@/features/members/type';

interface CommentItemProps {
  comment: PopulatedComment;
  members: Member[];
}

export const CommentItem = ({ comment, members }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const { data: user } = useCurrent();
  const { data: member } = useGetMemberInfo({
    workspaceId: comment.workspaceId,
    userId: user?.$id,
  });
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();

  const [DeleteDialog, confirmDelete] = useConfirm({
    title: 'Delete Comment',
    message:
      'Are you sure you want to delete this comment? This action cannot be undone.',
    variant: 'destructive',
  });

  const isAuthor = user?.$id === comment.userId;
  const isAdmin = member?.role === 'ADMIN';

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;
    deleteComment({ param: { commentId: comment.$id } });
  };

  const handleUpdate = () => {
    if (editContent.trim() === '' || editContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    updateComment(
      {
        param: { commentId: comment.$id },
        json: { content: editContent },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const formatContent = (text: string) => {
    if (
      !comment.tags ||
      comment.tags.length === 0 ||
      !members ||
      members.length === 0
    )
      return text;

    // Get the names of the users that were actually tagged
    const taggedNames = members
      .filter((m) => comment.tags?.includes(m.userId))
      .map((m) => m.name);

    if (taggedNames.length === 0) return text;

    // Create a regex to match any of the tagged names preceded by @
    // Sort names by length descending to match longest names first (e.g., "test 1" before "test")
    const namesRegexPart = taggedNames
      .sort((a, b) => b.length - a.length)
      .map((name) => `@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) // Escape regex special chars
      .join('|');

    const regex = new RegExp(`(${namesRegexPart})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        // Double check if this @part is actually one of our tagged names
        const isMention = taggedNames.some((name) => `@${name}` === part);
        if (isMention) {
          return (
            <span
              key={index}
              className="font-semibold text-neutral-950 bg-neutral-100 px-1 rounded-sm"
            >
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="flex gap-x-4 p-4 border rounded-lg bg-white shadow-sm">
      <DeleteDialog />
      <Avatar className="size-10">
        <AvatarFallback className="bg-neutral-200 text-neutral-500 font-medium flex items-center justify-center">
          {comment.userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 gap-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <p className="text-sm font-semibold text-neutral-900">
              {comment.userName}
            </p>
            <span className="text-xs text-neutral-500">
              {formatDistanceToNow(new Date(comment.$createdAt), {
                addSuffix: true,
              })}
              {comment.$updatedAt !== comment.$createdAt && (
                <span className="ml-1 text-[10px] italic">(edited)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-x-1">
            {isAuthor && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {(isAuthor || isAdmin) && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
              >
                <Trash className="size-4" />
              </Button>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="flex flex-col gap-y-2 mt-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isUpdating}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end gap-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="size-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                <Check className="size-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
            {formatContent(comment.content)}
          </p>
        )}
      </div>
    </div>
  );
};
