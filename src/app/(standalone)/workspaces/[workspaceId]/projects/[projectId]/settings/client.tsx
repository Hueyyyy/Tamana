'use client';

//Hooks
import { useProjectId } from '@/features/projects/hooks/use-project-id';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { MemberRole } from '@/features/members/type';

//Api
import { useGetProject } from '@/features/projects/api/use-get-project';

//Components
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { EditProjectForm } from '@/features/projects/components/edit-project-form';

export const ProjectIdSettingClient = () => {
  const projectId = useProjectId();
  const { data: project, isLoading: isLoadingProject } = useGetProject({
    projectId,
  });
  const { data: user, isLoading: isLoadingUser } = useCurrent();
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId: project?.workspaceId ?? '',
  });

  const isLoading = isLoadingProject || isLoadingUser || isLoadingMembers;

  if (isLoading) return <PageLoader />;

  if (!project) return <PageError message="Project not found" />;

  const currentMember = members?.documents.find((m) => m.userId === user?.$id);
  const isAdmin = currentMember?.role === MemberRole.ADMIN;

  if (!isAdmin) {
    return <PageError message="Unauthorized. Only administrators can edit projects." />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={project} />
    </div>
  );
};
