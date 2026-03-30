//Queries
import { getCurrent } from '@/features/auth/queries';

//Next
import { redirect } from 'next/navigation';

//Components
import { WorkspaceIdClient } from './client';

const WorkspaceIdPage = async () => {
  const user = await getCurrent();

  if (!user) {
    redirect('/sign-in');
  }
  return <WorkspaceIdClient />;
};

export default WorkspaceIdPage;
