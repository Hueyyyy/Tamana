'use client';

import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCommentSchema } from '../schemas';
import { useCreateComment } from '../api/use-create-comment';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useCurrent } from '@/features/auth/api/use-current';
import { Send, AtSign } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Member } from '@/features/members/type';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  taskId: string;
}

export const CommentForm = ({ taskId }: CommentFormProps) => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });
  const { mutate, isPending } = useCreateComment();

  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<z.infer<typeof createCommentSchema>>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: '',
      taskId,
      workspaceId,
      tags: [],
    },
  });

  const content = form.watch('content');

  const filteredMembers =
    members?.documents
      .filter(
        (member) =>
          member.userId !== user?.$id &&
          member.name.toLowerCase().includes(mentionFilter.toLowerCase()),
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
    const lastAtPos = content.lastIndexOf('@', cursorPosition - 1);
    if (
      lastAtPos !== -1 &&
      !content.slice(lastAtPos, cursorPosition).includes(' ')
    ) {
      setMentionFilter(content.slice(lastAtPos + 1, cursorPosition));
      setShowMentions(true);
      setActiveIndex(0); // Reset index when dropdown opens or filter changes
    } else {
      setShowMentions(false);
    }
  }, [content, cursorPosition]);

  const insertMention = (member: Member) => {
    const lastAtPos = content.lastIndexOf('@', cursorPosition - 1);
    const before = content.slice(0, lastAtPos);
    const after = content.slice(cursorPosition);
    const mentionText = `@${member.name} `;

    const newContent = before + mentionText + after;
    form.setValue('content', newContent);

    const newPos = lastAtPos + mentionText.length;
    setCursorPosition(newPos);

    // Add to tags if not already present
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(member.userId)) {
      form.setValue('tags', [...currentTags, member.userId]);
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
        insertMention(filteredMembers[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const onSubmit = (values: z.infer<typeof createCommentSchema>) => {
    // Final check for tags in content (in case user deleted some text)
    const finalTags = (values.tags || []).filter((tagId) => {
      const member = members?.documents.find((m) => m.userId === tagId);
      return member && values.content.includes(`@${member.name}`);
    });

    mutate(
      { json: { ...values, tags: finalTags } },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-y-4 relative">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    {showMentions && filteredMembers.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 w-64 bg-white border rounded-md shadow-2xl z-[100] mt-1 overflow-hidden border-neutral-300"
                      >
                        <div className="p-2 text-xs font-semibold bg-neutral-50 border-b text-neutral-500">
                          Mention someone...
                        </div>
                        {filteredMembers.map((member, index) => (
                          <button
                            key={member.$id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent textarea from losing focus
                              insertMention(member);
                            }}
                            className={cn(
                              'w-full flex items-center gap-x-2 p-2 hover:bg-neutral-100 transition text-left',
                              index === activeIndex && 'bg-neutral-100',
                            )}
                          >
                            <Avatar className="size-6">
                              <AvatarFallback className="text-[10px]">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{member.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <Textarea
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        textareaRef.current = e;
                      }}
                      onKeyDown={handleKeyDown}
                      onKeyUp={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onClick={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      placeholder="Write a comment... use @ to tag members"
                      disabled={isPending}
                      className="min-h-[100px] resize-none pr-10"
                    />
                    <div className="absolute top-3 right-3 text-neutral-400">
                      <AtSign className="size-4" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button disabled={isPending} size="sm">
              <Send className="size-4 mr-2" />
              Comment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
