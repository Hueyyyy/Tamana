'use client';

//Next
import { usePathname } from 'next/navigation';

//Components
import UserButton from '@/features/auth/components/user-button';
import { MobileSidebar } from './mobile-sidebar';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

const pathnameMap = {
  tasks: {
    title: 'My tasks',
    description: 'Monitor all your tasks here',
  },
  projects: {
    title: 'My projects',
    description: 'Monitor all your projects here',
  },
};

const defaultMap = {
  title: 'Home',
  description: 'Monitor all works here',
};

export const Navbar = () => {
  const pathname = usePathname();
  const pathnameParts = pathname.split('/');
  const map =
    pathnameMap[pathnameParts[3] as keyof typeof pathnameMap] || defaultMap;

  return (
    <nav className="pt-4 px-6 mb-4 flex items-center justify-between">
      <div className="flex-col hidden lg:flex">
        <h1 className="text-2xl font-semibold">{map.title}</h1>
        <p className="text-muted-foreground">{map.description}</p>
      </div>
      <MobileSidebar />
      <div className="flex items-center gap-x-2">
        <NotificationBell />
        <UserButton />
      </div>
    </nav>
  );
};
