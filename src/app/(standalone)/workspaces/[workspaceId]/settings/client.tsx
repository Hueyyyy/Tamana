'use client';

import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { useParams } from 'next/navigation';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { EditWorkspaceForm } from '@/features/workspaces/components/edit-workspace-form';

export const WorkspaceSettingsClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    workspaceId,
  });

  if (isLoadingWorkspace) return <PageLoader />;
  if (!workspace) return <PageError message="Workspace not found" />;

  return (
    <div className="w-full lg:max-w-xl">
      <EditWorkspaceForm initialValues={workspace} />
    </div>
  );
};
