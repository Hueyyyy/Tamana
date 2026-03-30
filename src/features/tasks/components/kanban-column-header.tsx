//Utils
import { snakeCaseToTitleCase } from '@/lib/utils';

//Types
import { TaskStatus } from '../types';

//Libs
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  PlusIcon,
} from 'lucide-react';

//Components
import { Button } from '@/components/ui/button';

//Hooks
import { useCreateTaskModal } from '../hooks/use-create-task-modal';

interface KanbanColumnHeaderProps {
  board: TaskStatus;
  taskCount: number;
}

const statusIconMap: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.BACKLOG]: (
    <CircleDashedIcon className="size-[18px] text-pink-400" />
  ),
  [TaskStatus.TODO]: <CircleIcon className="size-[18px] text-red-400" />,
  [TaskStatus.IN_PROGRESS]: (
    <CircleDotDashedIcon className="size-[18px] text-yellow-400" />
  ),
  [TaskStatus.IN_REVIEW]: (
    <CircleDotIcon className="size-[18px] text-blue-400" />
  ),
  [TaskStatus.DONE]: (
    <CircleCheckIcon className="size-[18px] text-emerald-400" />
  ),
};

export const KanbanColumnHeader = ({
  board,
  taskCount,
}: KanbanColumnHeaderProps) => {
  const icon = statusIconMap[board];
  const { open } = useCreateTaskModal();
  return (
    <div className="px-2 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-x-2">
        {icon}
        <h2 className="text-sm font-medium">{snakeCaseToTitleCase(board)}</h2>
        <div className="flex items-center justify-center size-5 rounded-md bg-neutral-200 text-neutral-700 font-medium text-xs">
          {taskCount}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-5"
        onClick={() => open(board)}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
};
