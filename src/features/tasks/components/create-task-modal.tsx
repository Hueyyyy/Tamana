'use client';

//components
import { ResponsiveModal } from '@/components/responsive-modal';
import CreateTaskFormWrapper from './create-task-form-wrapper';

//hooks
import { useCreateTaskModal } from '../hooks/use-create-task-modal';

const CreateTaskModal = () => {
  const { isOpen, close, initialStatus, projectId, parentId } = useCreateTaskModal();

  return (
    <ResponsiveModal isOpen={isOpen} onOpenChange={close}>
      <div className="p-4">
        <CreateTaskFormWrapper
          onCancel={close}
          initialStatus={initialStatus ?? undefined}
          projectId={projectId ?? undefined}
          parentId={parentId ?? undefined}
        />
      </div>
    </ResponsiveModal>
  );
};

export default CreateTaskModal;
