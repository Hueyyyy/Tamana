'use client';

// React / Next
import Link from 'next/link';

// Hooks
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetTasks } from '../api/use-get-tasks';
import { useCreateTaskModal } from '../hooks/use-create-task-modal';

// Types
import { Task } from '../types';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DottedSeparator } from '@/components/dotted-separator';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { TaskDate } from './task-date';
import { TaskActions } from './task-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateTask } from '../api/use-update-task';
import { TaskStatus } from '../types';

const orderedStatuses = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

// Utils
import { snakeCaseToTitleCase } from '@/lib/utils';

// Icons
import { PlusIcon, MoreVerticalIcon, ListTodoIcon, ArrowRightIcon, Loader } from 'lucide-react';

interface SubTasksProps {
  task: Task;
}

export const SubTasks = ({ task }: SubTasksProps) => {
  const workspaceId = useWorkspaceId();
  const { open } = useCreateTaskModal();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const { data: subTasks, isLoading } = useGetTasks({
    workspaceId,
    parentId: task.$id,
  });

  const handleAddSubTask = () => {
    open(TaskStatus.BACKLOG, task.projectId, task.$id);
  };

  const handleStatusChange = (subTaskId: string, status: TaskStatus) => {
    updateTask({
      param: { taskId: subTaskId },
      json: { status },
    });
  };

  return (
    <Card className="w-full border-none shadow-none bg-muted/30 border rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <ListTodoIcon className="size-5 text-neutral-500" />
            <p className="text-lg font-semibold">Sub-tasks</p>
            {subTasks && subTasks.documents.length > 0 && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {subTasks.documents.length}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleAddSubTask}>
            <PlusIcon className="size-4 mr-2" />
            Add Sub-task
          </Button>
        </div>

        <DottedSeparator className="my-4" />

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader className="size-6 text-muted-foreground animate-spin" />
          </div>
        ) : !subTasks || subTasks.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground border-2 border-dashed rounded-lg border-muted">
            <p className="text-sm font-medium">No sub-tasks yet</p>
            <p className="text-xs mt-1">Break this task down by adding your first sub-task.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2 max-h-[400px] overflow-y-auto pr-1">
            {subTasks.documents.map((subTask) => (
              <div
                key={subTask.$id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-x-3 min-w-0 flex-1">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none disabled:opacity-50" disabled={isUpdating}>
                        <Badge variant={subTask.status} className="shrink-0 text-[10px] uppercase font-semibold tracking-wider hover:opacity-85 cursor-pointer transition select-none">
                          {snakeCaseToTitleCase(subTask.status)}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      {orderedStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(subTask.$id, status)}
                          className="cursor-pointer p-1"
                          disabled={subTask.status === status}
                        >
                          <Badge
                            variant={status}
                            className="w-full text-center justify-center text-[10px] uppercase font-semibold tracking-wider py-1 pointer-events-none"
                          >
                            {snakeCaseToTitleCase(status)}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link
                    href={`/workspaces/${workspaceId}/tasks/${subTask.$id}`}
                    className="text-sm font-medium hover:underline text-foreground truncate flex items-center gap-x-1.5"
                  >
                    <span>{subTask.name}</span>
                    <ArrowRightIcon className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0" />
                  </Link>
                </div>

                <div className="flex items-center gap-x-4 shrink-0 pl-3">
                  {subTask.assignee && (
                    <div className="flex items-center gap-x-1.5 max-w-[140px]">
                      <MemberAvatar name={subTask.assignee.name} imageUrl={subTask.assignee.avatarUrl} className="size-5 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate hidden md:block">
                        {subTask.assignee.name}
                      </span>
                    </div>
                  )}
                  {subTask.dueDate && (
                    <TaskDate value={subTask.dueDate} className="text-xs" />
                  )}
                  <TaskActions id={subTask.$id} projectId={subTask.projectId}>
                    <Button variant="ghost" size="icon" className="size-8 h-8 w-8 hover:bg-muted">
                      <MoreVerticalIcon className="size-4" />
                    </Button>
                  </TaskActions>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
