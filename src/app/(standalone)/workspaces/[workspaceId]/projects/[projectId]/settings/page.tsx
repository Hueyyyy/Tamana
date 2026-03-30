//Components
import { ProjectIdSettingClient } from './client';

//Next
import { redirect } from 'next/navigation';

//Queries
import { getCurrent } from '@/features/auth/queries';

const ProjectIdSettingPage = async () => {
  const user = await getCurrent();
  if (!user) redirect('/sign-in');

  return <ProjectIdSettingClient />;
};

export default ProjectIdSettingPage;
