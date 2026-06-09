import { useState } from 'react';

//Types
import { Task, TaskStatus, TaskPriority } from '../types';

//Components
import { Button } from '@/components/ui/button';
import { DottedSeparator } from '@/components/dotted-separator';
import { OverviewProperty } from './overview-property';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { TaskDate } from './task-date';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useUpdateTask } from '../api/use-update-task';

const orderedStatuses = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

const orderedPriorities = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

//Icons
import { PencilIcon } from 'lucide-react';

//Utils
import { snakeCaseToTitleCase } from '@/lib/utils';

//Hooks
import { useEditTaskModal } from '../hooks/use-edit-task-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetMembers } from '@/features/members/api/use-get-members';

interface TaskOverviewProps {
  task: Task;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const workspaceId = useWorkspaceId();
  const { data: members } = useGetMembers({ workspaceId });
  const { open } = useEditTaskModal();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const handleStatusChange = (status: TaskStatus) => {
    updateTask({
      param: { taskId: task.$id },
      json: { status },
    });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask({
      param: { taskId: task.$id },
      json: { priority },
    });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateTask({
      param: { taskId: task.$id },
      json: { assigneeId },
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    updateTask({
      param: { taskId: task.$id },
      json: { dueDate: date },
    });
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-y-4 col-span-1 h-full">
      <div className="bg-muted rounded-lg p-4 h-full">
        <div className="flex flex-row items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>
          <Button
            variant={'secondary'}
            size={'sm'}
            onClick={() => open(task.$id)}
          >
            <PencilIcon className="size-4 mr-2" />
            Edit
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <div className="flex flex-col gap-y-4">
          <OverviewProperty label="Assignee">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none disabled:opacity-50 flex items-center gap-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded transition text-left" disabled={isUpdating}>
                  {task.assignee ? (
                    <>
                      <MemberAvatar name={task.assignee.name} imageUrl={task.assignee.avatarUrl} className="size-6" />
                      <p className="text-sm font-medium">{task.assignee.name}</p>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground font-medium">Unassigned</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => handleAssigneeChange(null)}
                  className="cursor-pointer flex items-center gap-x-2 p-2"
                  disabled={!task.assigneeId}
                >
                  <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-[10px] font-medium">
                    U
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Unassigned</span>
                </DropdownMenuItem>
                {members?.documents.map((member) => (
                  <DropdownMenuItem
                    key={member.$id}
                    onClick={() => handleAssigneeChange(member.$id)}
                    className="cursor-pointer flex items-center gap-x-2 p-2"
                    disabled={task.assigneeId === member.$id}
                  >
                    <MemberAvatar
                      name={member.name}
                      imageUrl={member.avatarUrl}
                      className="size-6"
                    />
                    <span className="text-sm font-medium">{member.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </OverviewProperty>
          <OverviewProperty label="Due date">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen} modal={false}>
              <PopoverTrigger asChild>
                <button className="focus:outline-none disabled:opacity-50 flex items-center gap-x-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded transition text-left" disabled={isUpdating}>
                  <TaskDate value={task.dueDate} className="text-sm font-medium" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </OverviewProperty>
          <OverviewProperty label="Status">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none disabled:opacity-50" disabled={isUpdating}>
                  <Badge variant={task.status} className="hover:opacity-85 cursor-pointer transition select-none">
                    {snakeCaseToTitleCase(task.status)}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {orderedStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="cursor-pointer p-1"
                    disabled={task.status === status}
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
          </OverviewProperty>
          <OverviewProperty label="Priority">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none disabled:opacity-50" disabled={isUpdating}>
                  <Badge variant={task.priority || TaskPriority.MEDIUM} className="hover:opacity-85 cursor-pointer transition select-none uppercase font-bold tracking-wider text-[10px] px-2.5 py-0.5">
                    {(task.priority || TaskPriority.MEDIUM).toLowerCase()}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {orderedPriorities.map((priority) => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className="cursor-pointer p-1"
                    disabled={task.priority === priority}
                  >
                    <Badge
                      variant={priority}
                      className="w-full text-center justify-center text-[10px] uppercase font-bold tracking-wider py-1 pointer-events-none"
                    >
                      {priority.toLowerCase()}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </OverviewProperty>
        </div>
      </div>
    </div>
  );
};
