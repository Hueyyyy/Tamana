//Queries
import { getCurrent } from '@/features/auth/queries';

//Next
import { redirect } from 'next/navigation';

//Components
import { ProfileClient } from './client';

const ProfilePage = async () => {
  const user = await getCurrent();
  if (!user) redirect('/sign-in');

  return (
    <div className="w-full lg:max-w-xl">
      <ProfileClient />
    </div>
  );
};

export default ProfilePage;
