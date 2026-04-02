'use client';

// Components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DottedSeparator } from '@/components/dotted-separator';
import { Loader, LogOut, Pencil } from 'lucide-react';

//Hooks
import { useCurrent } from '@/features/auth/api/use-current';
import { useLogout } from '@/features/auth/api/use-logout';

//Next
import { useRouter } from 'next/navigation';

//API
import { useGetProfileAvatar } from '@/features/auth/api/use-get-profile-avatar';

export const UserButton = () => {
  const { data: user, isLoading: isLoadingUser } = useCurrent();
  const { data: avatar, isLoading: isLoadingAvatar } = useGetProfileAvatar();
  const { mutate: logout } = useLogout();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/profile');
  };

  if (isLoadingUser || isLoadingAvatar) {
    return (
      <div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
        <Loader className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const { name, email } = user;

  const avatarFallback = name
    ? name.charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase();

  const imageUrl = avatar?.data?.imageUrl || '';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        <Avatar className="size-10 hover:opacity-75 transition border border-neutral-300 relative">
          <AvatarImage src={imageUrl} alt={name || email} />
          <AvatarFallback className="bg-neutral-200 text-neutral-500 font-medium flex items-center justify-center">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60"
        align="end"
        side="bottom"
        sideOffset={10}
      >
        <div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
          <Avatar className="size-[52px] border border-neutral-300 relative">
            <AvatarImage src={imageUrl} alt={name || email} />
            <AvatarFallback className="bg-neutral-200 text-xl text-neutral-500 font-medium flex items-center justify-center">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-neutral-900">
              {name || 'User'}
            </p>
            <p className="text-xs text-neutral-500">{email}</p>
          </div>
          <DottedSeparator className="my-2" />
          <DropdownMenuItem
            className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
            onClick={handleEditProfile}
          >
            <Pencil className="size-4 mr-2" />
            Edit profile
          </DropdownMenuItem>
          <DottedSeparator className="my-2" />
          <DropdownMenuItem
            className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
            onClick={() => logout()}
          >
            <LogOut className="size-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
