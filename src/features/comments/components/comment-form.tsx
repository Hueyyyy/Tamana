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
import { Send, AtSign, ImageIcon, Paperclip, Upload as UploadIcon, X } from 'lucide-react';
import Image from 'next/image';
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

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newImages: File[] = [];
      const newAttachments: File[] = [];
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          newImages.push(file);
        } else {
          newAttachments.push(file);
        }
      });
      if (newImages.length > 0) setSelectedImages((prev) => [...prev, ...newImages]);
      if (newAttachments.length > 0) setSelectedAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let hasImages = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setSelectedImages((prev) => [...prev, file]);
          hasImages = true;
        }
      }
    }
    if (hasImages) {
      e.preventDefault();
    }
  };

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
  const hasContent = !!(content && content.trim().length > 0);
  const hasFiles = selectedImages.length > 0 || selectedAttachments.length > 0;
  const isSubmitDisabled = isPending || (!hasContent && !hasFiles);

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
    const hasContent = values.content && values.content.trim().length > 0;
    const hasFiles = selectedImages.length > 0 || selectedAttachments.length > 0;

    if (!hasContent && !hasFiles) {
      return;
    }
    // Final check for tags in content (in case user deleted some text)
    const finalTags = (values.tags || []).filter((tagId) => {
      const member = members?.documents.find((m) => m.userId === tagId);
      return member && values.content.includes(`@${member.name}`);
    });

    const finalData = {
      content: values.content,
      taskId: values.taskId,
      workspaceId: values.workspaceId,
      tags: JSON.stringify(finalTags),
      image: selectedImages.length > 0 ? selectedImages : undefined,
      attachment: selectedAttachments.length > 0 ? selectedAttachments : undefined,
    };

    mutate(
      { 
        form: finalData as {
          content: string;
          taskId: string;
          workspaceId: string;
          tags?: string;
          image?: File | File[] | string;
          attachment?: File | File[] | string;
        }
      },
      {
        onSuccess: () => {
          form.reset();
          setSelectedImages([]);
          setSelectedAttachments([]);
          if (imageInputRef.current) imageInputRef.current.value = '';
          if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        },
      },
    );
  };

  return (
    <div 
      className="flex flex-col gap-y-4 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm border-2 border-dashed border-primary rounded-md pointer-events-none transition duration-200"
        >
          <UploadIcon className="size-8 text-muted-foreground animate-bounce mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">
            Drop your image or file here
          </p>
        </div>
      )}
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
                      onPaste={handlePaste}
                      placeholder="Write a comment... use @ to tag members, paste images, or drag files here"
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

          {/* Previews */}
          {(selectedImages.length > 0 || selectedAttachments.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((image, idx) => (
                <div key={idx} className="relative size-20 rounded-md border overflow-hidden group">
                  <Image
                    src={URL.createObjectURL(image)}
                    alt="Uploaded preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {selectedAttachments.map((attachment, idx) => (
                <div key={idx} className="flex items-center gap-x-2 bg-neutral-50 border rounded-md p-2 max-w-xs relative pr-8 group">
                  <Paperclip className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">
                      {attachment.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAttachments((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-x-2">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={imageInputRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setSelectedImages((prev) => [...prev, ...files]);
                  }
                  e.target.value = '';
                }}
              />
              <input
                type="file"
                multiple
                className="hidden"
                ref={attachmentInputRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setSelectedAttachments((prev) => [...prev, ...files]);
                  }
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-neutral-100"
                onClick={() => imageInputRef.current?.click()}
                disabled={isPending}
              >
                <ImageIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-neutral-100"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={isPending}
              >
                <Paperclip className="size-4" />
              </Button>
            </div>
            <Button disabled={isSubmitDisabled} size="sm">
              <Send className="size-4 mr-2" />
              Comment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
