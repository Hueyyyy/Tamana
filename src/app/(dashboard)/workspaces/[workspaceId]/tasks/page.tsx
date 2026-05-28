//Next
import { redirect } from 'next/navigation';

//Queries
import { getCurrent } from '@/features/auth/queries';

//Components
import TaskViewSwitcher from '@/features/tasks/components/task-view-switcher';

const TasksPage = async () => {
  const user = await getCurrent();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="flex flex-col gap-y-4 h-full">
      <TaskViewSwitcher userId={user.$id} hideMemberFilter hideCreateButton />
    </div>
  );
};

export default TasksPage;
