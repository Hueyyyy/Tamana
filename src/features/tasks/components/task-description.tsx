//React
import { useState } from 'react';

//Types
import { Task } from '../types';

//Components
import { Button } from '@/components/ui/button';
import { DottedSeparator } from '@/components/dotted-separator';
import { Textarea } from '@/components/ui/textarea';


//Icons
import { PencilIcon, XIcon } from 'lucide-react';



//Api
import { useUpdateTask } from '../api/use-update-task';

interface TaskDescriptionProps {
  task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description);

  const { mutate: updateTask, isPending: isPendingUpdateTask } =
    useUpdateTask();

  const onToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const onSave = () => {
    updateTask(
      {
        param: { taskId: task.$id },
        json: { description: value },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <p className="text-lg font-semibold">Description</p>
        <Button variant={'secondary'} size={'sm'} onClick={onToggleEdit}>
          {isEditing ? (
            <>
              <XIcon className="size-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <PencilIcon className="size-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      {isEditing ? (
        <div className="flex flex-col gap-y-4">
          <Textarea
            placeholder="Add a description..."
            value={value}
            rows={4}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPendingUpdateTask}
          />
          <div className="flex items-center gap-x-2">
            <Button
              size={'sm'}
              onClick={onSave}
              disabled={isPendingUpdateTask}
              className="w-fit ml-auto"
            >
              {isPendingUpdateTask ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant={'secondary'}
              size={'sm'}
              onClick={onToggleEdit}
              disabled={isPendingUpdateTask}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {task.description || (
            <span className="text-muted-foreground">No description set</span>
          )}
        </div>
      )}
    </div>
  );
};
