'use client';

//Hooks
import { useProjectId } from '@/features/projects/hooks/use-project-id';

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

  if (isLoadingProject) return <PageLoader />;

  if (!project) return <PageError message="Project not found" />;

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={project} />
    </div>
  );
};
