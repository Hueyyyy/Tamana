'use client';

import { useState, useRef, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: PopulatedComment;
  members: Member[];
}

export const CommentItem = ({ comment, members }: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editTags, setEditTags] = useState<string[]>(comment.tags || []);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: user } = useCurrent();
  const { data: member } = useGetMemberInfo({
    workspaceId: comment.workspaceId,
    userId: user?.$id,
  });
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();

  const filteredMembers =
    members
      .filter(
        (m) =>
          m.userId !== user?.$id &&
          m.name.toLowerCase().includes(mentionFilter.toLowerCase()),
      )
      .slice(0, 5) || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const lastAtPos = editContent.lastIndexOf('@', cursorPosition - 1);
    if (
      lastAtPos !== -1 &&
      !editContent.slice(lastAtPos, cursorPosition).includes(' ')
    ) {
      setMentionFilter(editContent.slice(lastAtPos + 1, cursorPosition));
      setShowMentions(true);
      setActiveIndex(0);
    } else {
      setShowMentions(false);
    }
  }, [editContent, cursorPosition, isEditing]);

  const [DeleteDialog, confirmDelete] = useConfirm({
    title: 'Delete Comment',
    message:
      'Are you sure you want to delete this comment? This action cannot be undone.',
    variant: 'destructive',
  });

  const isAuthor = user?.$id === comment.userId;
  const isAdmin = member?.role === 'ADMIN';

  const insertEditMention = (member: Member) => {
    const lastAtPos = editContent.lastIndexOf('@', cursorPosition - 1);
    const before = editContent.slice(0, lastAtPos);
    const after = editContent.slice(cursorPosition);
    const mentionText = `@${member.name} `;

    const newContent = before + mentionText + after;
    setEditContent(newContent);

    const newPos = lastAtPos + mentionText.length;
    setCursorPosition(newPos);

    if (!editTags.includes(member.userId)) {
      setEditTags([...editTags, member.userId]);
    }

    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(
          (prev) =>
            (prev - 1 + filteredMembers.length) % filteredMembers.length,
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertEditMention(filteredMembers[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;
    deleteComment({ param: { commentId: comment.$id } });
  };

  const handleUpdate = () => {
    if (
      editContent.trim() === '' ||
      (editContent === comment.content &&
        JSON.stringify(editTags) === JSON.stringify(comment.tags))
    ) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    // Filter tags to only those present in text
    const finalTags = editTags.filter((tagId) => {
      const m = members.find((m) => m.userId === tagId);
      return m && editContent.includes(`@${m.name}`);
    });

    updateComment(
      {
        param: { commentId: comment.$id },
        json: {
          content: editContent,
          tags: finalTags,
        },
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
    setEditTags(comment.tags || []);
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
    <div className="flex gap-x-4 p-4 border rounded-lg bg-white shadow-sm relative">
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
            <div className="relative">
              {showMentions && filteredMembers.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full left-0 w-64 bg-white border rounded-md shadow-2xl z-[100] mt-1 overflow-hidden border-neutral-300"
                >

                  <div className="p-2 text-xs font-semibold bg-neutral-50 border-b text-neutral-500">
                    Mention someone...
                  </div>
                  {filteredMembers.map((m, index) => (
                    <button
                      key={m.$id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertEditMention(m);
                      }}
                      className={cn(
                        'w-full flex items-center gap-x-2 p-2 hover:bg-neutral-100 transition text-left',
                        index === activeIndex && 'bg-neutral-100',
                      )}
                    >
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {m.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                ref={textareaRef}
                value={editContent}
                onKeyDown={handleKeyDown}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyUp={(e) =>
                  setCursorPosition(e.currentTarget.selectionStart)
                }
                onClick={(e) =>
                  setCursorPosition(e.currentTarget.selectionStart)
                }
                disabled={isUpdating}
                className="min-h-[80px] resize-none"
              />
            </div>
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
