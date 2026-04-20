'use client';

//Hooks
import { useTaskId } from '@/features/tasks/hooks/use-task-id';

//Api
import { useGetTask } from '@/features/tasks/api/use-get-task';

//Components
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { TaskBreadcrumbs } from '@/features/tasks/components/task-breadcrumbs';
import { DottedSeparator } from '@/components/dotted-separator';
import { TaskOverview } from '@/features/tasks/components/task-overview';
import { TaskDescription } from '@/features/tasks/components/task-description';
import { CommentSection } from '@/features/comments/components/comment-section';

const TaskIdClient = () => {
  const taskId = useTaskId();
  const { data: task, isLoading: isLoadingTask } = useGetTask({ taskId });

  if (isLoadingTask) return <PageLoader />;

  if (!task) return <PageError message="Task not found" />;

  return (
    <div className="flex flex-col">
      <TaskBreadcrumbs project={task.project} task={task} />
      <DottedSeparator className="my-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskOverview task={task} />
        <TaskDescription task={task} />
      </div>
      <DottedSeparator className="my-6" />
      <CommentSection taskId={taskId} />
    </div>
  );
};

export default TaskIdClient;
