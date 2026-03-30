//Types
import { Project } from '@/features/projects/type';
import { Task } from '../types';

//Components
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { Button } from '@/components/ui/button';

//Hooks
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import Link from 'next/link';
import useConfirm from '@/hooks/use-confirm';

//Icons
import { ChevronRight, TrashIcon } from 'lucide-react';

//Api
import { useDeleteTask } from '../api/use-delete-task';
import { useRouter } from 'next/navigation';

interface TaskBreadcrumbsProps {
  project: Project;
  task: Task;
}

export const TaskBreadcrumbs = ({ project, task }: TaskBreadcrumbsProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const { mutate: deleteTask, isPending: isPendingDeleteTask } =
    useDeleteTask();
  const [ConfirmDialog, confirm] = useConfirm({
    title: 'Delete task',
    message: `Are you sure you want to delete "${task.name}" task?`,
    variant: 'destructive',
  });

  const onDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteTask(
        {
          param: { taskId: task.$id },
        },
        {
          onSuccess: () => {
            router.push(`/workspaces/${workspaceId}/tasks`);
          },
        },
      );
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <ConfirmDialog />
      <ProjectAvatar
        name={project.name}
        image={project.imageUrl}
        className="size-6 lg:size-8"
      />
      <Link
        href={`/workspaces/${workspaceId}/projects/${project.$id}`}
        className="text-muted-foreground text-sm"
      >
        <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
          {project.name}
        </p>
      </Link>
      <ChevronRight className="size-4 lg:size-5 text-muted-foreground" />
      <p className="text-sm lg:text-lg font-semibold">{task.name}</p>
      <Button
        className="ml-auto"
        variant={'destructive'}
        size={'sm'}
        onClick={onDelete}
        disabled={isPendingDeleteTask}
      >
        <TrashIcon className="size-4 lg:mr-2" />
        <span className="hidden lg:block">Delete task</span>
      </Button>
    </div>
  );
};
