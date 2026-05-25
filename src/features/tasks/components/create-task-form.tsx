'use client';

// Helpers
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Hooks
import { useForm } from 'react-hook-form';
import { useCreateTask } from '../api/use-create-task';

import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

// Schemas
import { createTaskSchema } from '../schemas';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DottedSeparator } from '@/components/dotted-separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';

// Utils
import { cn } from '@/lib/utils';

// Types
import { TaskStatus } from '../types';

interface CreateTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name: string }[];
  initialStatus?: TaskStatus;
  projectId?: string;
  parentId?: string;
}

export const CreateTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
  initialStatus,
  projectId,
  parentId,
}: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateTask();

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      workspaceId,
      projectId,
      status: initialStatus,
      parentId,
    },
  });

  const onSubmit = (data: z.infer<typeof createTaskSchema>) => {
    mutate(
      {
        json: {
          ...data,
          workspaceId,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      },
    );
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create a new task</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Task Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter task name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Due Date</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Assignee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {memberOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-x-2 min-w-0">
                              <MemberAvatar
                                name={member.name}
                                className="size-6 shrink-0"
                              />
                              <span className="truncate">{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={initialStatus}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>
                          Backlog
                        </SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>
                          In Review
                        </SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black">Project</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={projectId}
                      disabled={!!parentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2 min-w-0">
                              <ProjectAvatar
                                name={project.name}
                                image={project.imageUrl}
                                className="size-6 shrink-0"
                              />
                              <span className="truncate">{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <DottedSeparator className="py-7" />
            <div className="flex flex-row justify-between items-center">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
                className={cn(!onCancel && 'invisible')}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
