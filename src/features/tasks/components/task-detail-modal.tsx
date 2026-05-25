'use client';

// Components
import { ResponsiveModal } from '@/components/responsive-modal';
import { TaskDetailView } from './task-detail-view';

// Hooks
import { useTaskDetailModal } from '../hooks/use-task-detail-modal';

export const TaskDetailModal = () => {
  const { taskId, isOpen, close } = useTaskDetailModal();

  return (
    <ResponsiveModal isOpen={isOpen} onOpenChange={close} maxWidthClassName="sm:max-w-5xl">
      <div className="p-6 bg-background rounded-lg border w-full overflow-hidden">
        {taskId && <TaskDetailView taskId={taskId} />}
      </div>
    </ResponsiveModal>
  );
};

export default TaskDetailModal;
