'use client';

//Components
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { EditProfileForm } from '@/features/auth/components/edit-profile-form';

//API
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetProfileAvatar } from '@/features/auth/api/use-get-profile-avatar';

//Types
import { User } from '@/features/auth/type';

export const ProfileClient = () => {
  const { data, isLoading } = useCurrent();
  const { data: avatar, isLoading: isLoadingAvatar } = useGetProfileAvatar();

  const user: User = {
    name: data?.name ?? '',
    email: data?.email ?? '',
    imageUrl: avatar?.data?.imageUrl,
  };

  if (isLoading || isLoadingAvatar) return <PageLoader />;
  if (!user) return <PageError message="User not found" />;

  return (
    <div className="w-full lg:max-w-xl">
      <EditProfileForm initialValues={user} />
    </div>
  );
};
