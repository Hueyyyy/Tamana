//Next
import { redirect } from 'next/navigation';

//Queries
import { getCurrent } from '@/features/auth/queries';

//Components
import TaskIdClient from './client';

const TaskIdPage = async () => {
  const user = await getCurrent();

  if (!user) {
    redirect('/sign-in');
  }

  return <TaskIdClient />;
};

export default TaskIdPage;
