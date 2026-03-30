'use client';

//components
import { ResponsiveModal } from '@/components/responsive-modal';
import EditTaskFormWrapper from './edit-task-form-wrapper';

//hooks
import { useEditTaskModal } from '../hooks/use-edit-task-modal';

const EditTaskModal = () => {
  const { taskId, close } = useEditTaskModal();

  return (
    <ResponsiveModal isOpen={!!taskId} onOpenChange={close}>
      {taskId && (
        <div className="p-4">
          <EditTaskFormWrapper id={taskId} onCancel={close} />
        </div>
      )}
    </ResponsiveModal>
  );
};

export default EditTaskModal;
