//Types
import { Task } from '../types';

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
import { useUpdateTask } from '../api/use-update-task';
import { TaskStatus } from '../types';

const orderedStatuses = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

//Icons
import { PencilIcon } from 'lucide-react';

//Utils
import { snakeCaseToTitleCase } from '@/lib/utils';

//Hooks
import { useEditTaskModal } from '../hooks/use-edit-task-modal';

interface TaskOverviewProps {
  task: Task;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const handleStatusChange = (status: TaskStatus) => {
    updateTask({
      param: { taskId: task.$id },
      json: { status },
    });
  };

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
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
            <MemberAvatar name={task.assignee.name} className="size-6" />
            <p>{task.assignee?.name}</p>
          </OverviewProperty>
          <OverviewProperty label="Due date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
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
        </div>
      </div>
    </div>
  );
};
