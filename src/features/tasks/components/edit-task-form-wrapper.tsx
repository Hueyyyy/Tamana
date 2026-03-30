//Hooks
import { Card, CardContent } from '@/components/ui/card';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetTask } from '../api/use-get-task';

//Components
import { EditTaskForm } from './edit-task-form';

//Libs
import { Loader } from 'lucide-react';

interface EditTaskFormWrapperProps {
  onCancel: () => void;
  id: string;
}

const EditTaskFormWrapper = ({ id, onCancel }: EditTaskFormWrapperProps) => {
  const workspaceId = useWorkspaceId();

  const { data: initialValues, isLoading: isLoadingTask } = useGetTask({
    taskId: id,
  });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const projectOptions = projects?.documents.map((project) => ({
    id: project.$id,
    name: project.name,
    imageUrl: project.imageUrl,
  }));

  const memberOptions = members?.documents.map((member) => ({
    id: member.$id,
    name: member.name,
  }));

  const isLoading = isLoadingProjects || isLoadingMembers || isLoadingTask;

  if (isLoading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex h-full items-center justify-center">
          <Loader className="size-5 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!initialValues) return null;

  return (
    <div className="p-4 w-full">
      <EditTaskForm
        onCancel={onCancel}
        projectOptions={projectOptions!}
        memberOptions={memberOptions!}
        initialValues={initialValues}
      />
    </div>
  );
};

export default EditTaskFormWrapper;
