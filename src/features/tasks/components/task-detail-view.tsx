'use client';

// Hooks
import { useGetTask } from '../api/use-get-task';

// Components
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { TaskBreadcrumbs } from './task-breadcrumbs';
import { DottedSeparator } from '@/components/dotted-separator';
import { TaskOverview } from './task-overview';
import { TaskDescription } from './task-description';
import { SubTasks } from './sub-tasks';
import { CommentSection } from '@/features/comments/components/comment-section';
import { ActivityLog } from '@/features/activities/components/activity-log';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { MessageSquare, History } from 'lucide-react';

interface TaskDetailViewProps {
  taskId: string;
}

export const TaskDetailView = ({ taskId }: TaskDetailViewProps) => {
  const { data: task, isLoading: isLoadingTask } = useGetTask({ taskId });

  if (isLoadingTask) return <PageLoader />;

  if (!task) return <PageError message="Task not found" />;

  return (
    <div className="flex flex-col gap-y-4 max-h-[85vh] overflow-y-auto pr-2 hide-scrollbar">
      <TaskBreadcrumbs project={task.project} task={task} />
      <DottedSeparator className="my-2" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TaskOverview task={task} />
        <TaskDescription task={task} />
      </div>
      <DottedSeparator className="my-2" />
      {!task.parentId && (
        <>
          <SubTasks task={task} />
          <DottedSeparator className="my-2" />
        </>
      )}
      
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="comments" className="gap-x-2">
            <MessageSquare className="size-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-x-2">
            <History className="size-4" />
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comments">
          <CommentSection taskId={taskId} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityLog taskId={taskId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default TaskDetailView;
