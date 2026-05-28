import { Button } from '@/components/ui/button';
import { Task, TaskPriority } from '../types';
import { TaskActions } from './task-actions';
import { ListTodo, MoreHorizontal } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { TaskDate } from './task-date';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useTaskDetailModal } from '../hooks/use-task-detail-modal';
import { Badge } from '@/components/ui/badge';

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  const { open } = useTaskDetailModal();
  const priority = task.priority || TaskPriority.MEDIUM;

  return (
    <div className="bg-white dark:bg-neutral-900 p-2.5 rounded shadow-sm border border-neutral-200/50 dark:border-neutral-800 space-y-3">
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
          name={task.assignee?.name || "Unassigned"}
          fallbackClassName="text-[10px]"
        />
        <div className="size-1 rounded-full bg-neutral-300" />
        <TaskDate value={task.dueDate} className="text-xs" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-1.5 min-w-0">
          <ProjectAvatar
            name={task.project.name}
            image={task.project.imageUrl}
            fallbackClassName="text-[10px] size-5"
          />
          <p className="text-xs line-clamp-1 font-medium">{task.project.name}</p>
        </div>
        <Badge variant={priority} className="text-[10px] px-2 py-0.5 uppercase font-bold tracking-wider">
          {priority.toLowerCase()}
        </Badge>
      </div>
      {task.totalSubTasks !== undefined && task.totalSubTasks > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-x-1">
              <ListTodo className="size-3 text-neutral-400" />
              <span>Sub-tasks</span>
            </div>
            <span className="font-semibold text-neutral-700">
              {task.completedSubTasks || 0}/{task.totalSubTasks}
            </span>
          </div>
          <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  Math.max(
                    ((task.completedSubTasks || 0) / task.totalSubTasks) * 100,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
