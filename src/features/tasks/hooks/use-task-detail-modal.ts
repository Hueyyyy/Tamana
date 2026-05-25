import { useQueryState, parseAsString } from 'nuqs';

export const useTaskDetailModal = () => {
  const [taskId, setTaskId] = useQueryState(
    'task-detail',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
  );

  const open = (id: string) => setTaskId(id);
  const close = () => setTaskId('');

  return {
    taskId,
    open,
    close,
    setTaskId,
    isOpen: !!taskId,
  };
};
