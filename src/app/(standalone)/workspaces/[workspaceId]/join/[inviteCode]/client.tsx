'use client';

// Components
import JoinWorkspaceForm from '@/features/workspaces/components/join-workspace-form';

// Hooks
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

// API
import { useGetWorkspaceInfo } from '@/features/workspaces/api/use-get-workspace-info';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';

export const WorkspaceIdJoinClient = () => {
  const workspaceId = useWorkspaceId();

  const { data: workspaceInfo, isLoading: isLoadingWorkspaceInfo } =
    useGetWorkspaceInfo({ workspaceId });

  if (isLoadingWorkspaceInfo) return <PageLoader />;
  if (!workspaceInfo) return <PageError message="Workspace not found" />;

  return (
    <div className="w-full lg:max-w-xl">
      <JoinWorkspaceForm initialValue={{ name: workspaceInfo.name }} />
    </div>
  );
};
