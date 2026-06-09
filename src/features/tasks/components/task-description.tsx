//React
import { useState, useRef } from 'react';
import { useClickAway } from 'react-use';

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
  const editContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { mutate: updateTask, isPending: isPendingUpdateTask } =
    useUpdateTask();

  useClickAway(editContainerRef, (event) => {
    if (buttonRef.current?.contains(event.target as Node)) {
      return;
    }

    if (isEditing) {
      setIsEditing(false);
      setValue(task.description);
    }
  });

  const handleDescriptionClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    setIsEditing(true);
  };

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
    <div className="border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <p className="text-lg font-semibold">Description</p>
        <Button
          ref={buttonRef}
          variant={'secondary'}
          size={'sm'}
          onClick={onToggleEdit}
        >
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
        <div ref={editContainerRef} className="flex flex-col gap-y-4 flex-grow">
          <Textarea
            placeholder="Add a description..."
            value={value}
            className="flex-grow min-h-[120px]"
            onChange={(e) => setValue(e.target.value)}
            disabled={isPendingUpdateTask}
          />
          <div className="flex items-center gap-x-2 mt-auto">
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
        <div
          onClick={handleDescriptionClick}
          className="cursor-pointer hover:bg-muted/30 p-2 rounded transition min-h-[100px] flex-grow whitespace-pre-wrap"
        >
          {task.description || (
            <span className="text-muted-foreground">No description set</span>
          )}
        </div>
      )}
    </div>
  );
};
