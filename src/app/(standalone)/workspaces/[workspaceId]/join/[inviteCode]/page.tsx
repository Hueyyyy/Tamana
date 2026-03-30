//Queries
import { getCurrent } from '@/features/auth/queries';

//Next
import { redirect } from 'next/navigation';

//Components
import { WorkspaceIdJoinClient } from './client';

const WorkspaceIdJoinPage = async () => {
  const user = getCurrent();

  if (!user) redirect('/sign-in');

  return <WorkspaceIdJoinClient />;
};

export default WorkspaceIdJoinPage;
