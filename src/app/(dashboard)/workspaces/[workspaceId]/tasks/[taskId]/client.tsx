'use client';

//Hooks
import { useTaskId } from '@/features/tasks/hooks/use-task-id';

//Components
import { TaskDetailView } from '@/features/tasks/components/task-detail-view';

const TaskIdClient = () => {
  const taskId = useTaskId();

  return (
    <div className="flex flex-col">
      <TaskDetailView taskId={taskId} />
    </div>
  );
};

export default TaskIdClient;
