'use client';

import { Bell } from 'lucide-react';
import { useGetNotifications } from '../api/use-get-notifications';
import { useMarkNotificationRead } from '../api/use-mark-notification-read';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { client } from '@/lib/appwrite-client';
import { DATABASE_ID, NOTIFICATIONS_ID } from '@/config';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '../types';
import { useCurrent } from '@/features/auth/api/use-current';

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrent();
  const { data: notifications, isLoading: isNotificationsLoading } =
    useGetNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();

  const unreadCount =
    notifications?.documents.filter((n) => !n.isRead).length || 0;

  useEffect(() => {
    if (!user?.$id) return;

    const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_ID}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as Notification;

      if (payload.userId === user.$id) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, user?.$id]);

  const handleMarkAsRead = (id: string) => {
    markAsRead({ param: { notificationId: id }, json: { isRead: true } });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-600 hover:bg-red-600 border-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <ScrollArea className="h-80">
          {isNotificationsLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : !notifications || notifications.documents.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.documents.map((notification: Notification) => (
                <div
                  key={notification.$id}
                  className={cn(
                    'p-3 border-b last:border-0 hover:bg-muted-foreground/20 transition-colors cursor-pointer ',
                    notification.isRead && 'opacity-50',
                  )}
                  onClick={() =>
                    !notification.isRead && handleMarkAsRead(notification.$id)
                  }
                >
                  <Link
                    href={`/workspaces/${notification.workspaceId}/tasks/${notification.targetId}`}
                    className="block"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.$createdAt),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
