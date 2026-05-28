//Hooks
import { Card, CardContent } from '@/components/ui/card';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetTask } from '../api/use-get-task';

//Components
import { CreateTaskForm } from './create-task-form';

//Libs
import { Loader } from 'lucide-react';

//Types
import { TaskStatus } from '../types';

interface CreateTaskFormWrapperProps {
  onCancel: () => void;
  initialStatus?: TaskStatus;
  projectId?: string;
  parentId?: string;
}

const CreateTaskFormWrapper = ({
  onCancel,
  initialStatus,
  projectId,
  parentId,
}: CreateTaskFormWrapperProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });
  const { data: parentTask, isLoading: isLoadingParentTask } = useGetTask({
    taskId: parentId,
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

  const isLoading = isLoadingProjects || isLoadingMembers || (!!parentId && isLoadingParentTask);

  if (isLoading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex h-full items-center justify-center">
          <Loader className="size-5 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 w-full">
      <CreateTaskForm
        onCancel={onCancel}
        projectOptions={projectOptions!}
        memberOptions={memberOptions!}
        initialStatus={initialStatus}
        projectId={projectId}
        parentId={parentId}
        defaultAssigneeId={parentTask?.assigneeId ?? undefined}
      />
    </div>
  );
};

export default CreateTaskFormWrapper;
