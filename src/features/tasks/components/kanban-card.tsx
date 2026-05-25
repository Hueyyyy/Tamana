import { Button } from '@/components/ui/button';
import { Task } from '../types';
import { TaskActions } from './task-actions';
import { MoreHorizontal } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { TaskDate } from './task-date';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useTaskDetailModal } from '../hooks/use-task-detail-modal';

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  const { open } = useTaskDetailModal();

  return (
    <div className="bg-white p-2.5 rounded shadown-none space-y-3">
      <div className="flex items-start justify-between gap-x-2">
        <p 
          onClick={() => open(task.$id)}
          className="text-sm line-clamp-2 font-medium hover:underline text-primary cursor-pointer transition"
        >
          {task.name}
        </p>
        <TaskActions id={task.$id} projectId={task.projectId}>
          <Button variant="ghost" size="icon" className="size-5">
            <MoreHorizontal className="size-[18px] stroke-1 shrink-0 text-neutral-700 hover:opacity-75 transition" />
          </Button>
        </TaskActions>
      </div>
      <DottedSeparator />
      <div className="flex items-center gap-x-1.5">
        <MemberAvatar
          name={task.assignee.name}
          fallbackClassName="text-[10px]"
        />
        <div className="size-1 rounded-full bg-neutral-300" />
        <TaskDate value={task.dueDate} className="text-xs" />
      </div>
      <div className="flex items-center gap-x-1.5">
        <ProjectAvatar
          name={task.project.name}
          image={task.project.imageUrl}
          fallbackClassName="text-[10px] size-5"
        />
        <p className="text-xs line-clamp-1 font-medium">{task.project.name}</p>
      </div>
    </div>
  );
};
