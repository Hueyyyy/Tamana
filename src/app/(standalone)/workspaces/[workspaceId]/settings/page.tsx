//Queries
import { getCurrent } from '@/features/auth/queries';

//Next
import { redirect } from 'next/navigation';

//Components
import { WorkspaceSettingsClient } from './client';

const WorkspaceIdSettingPage = async () => {
  const user = await getCurrent();
  if (!user) redirect('/sign-in');

  return <WorkspaceSettingsClient />;
};

export default WorkspaceIdSettingPage;
