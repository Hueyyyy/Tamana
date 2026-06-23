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
import { useEffect, useState } from 'react';
import { client } from '@/lib/appwrite-client';
import { DATABASE_ID, NOTIFICATIONS_ID } from '@/config';
import { useQueryClient } from '@tanstack/react-query';
import { Notification, NotificationType } from '../types';
import { useCurrent } from '@/features/auth/api/use-current';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const NotificationBell = () => {
  const [view, setView] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();
  const { data: user } = useCurrent();
  const { data: notifications, isLoading: isNotificationsLoading } =
    useGetNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();

  const unreadCount =
    notifications?.documents.filter((n) => !n.isRead).length || 0;

  const filteredNotifications = notifications?.documents.filter((notification) => {
    if (view === 'unread') {
      return !notification.isRead;
    }
    return true;
  }) || [];

  useEffect(() => {
    if (!user?.$id) return;

    const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_ID}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as Notification;

      if (payload.userId !== user.$id) return;

      const events = response.events as string[];

      if (events.some((e) => e.includes('.create'))) {
        // Try to insert directly into cache. If the cache is empty (bell
        // was never opened), fall back to a full invalidation so the event
        // is never silently dropped.
        const existing = queryClient.getQueryData(['notifications']);
        if (!existing) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else {
          queryClient.setQueryData(['notifications'], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              documents: [payload, ...old.documents],
              total: old.total + 1,
            };
          });
        }
      } else if (events.some((e) => e.includes('.update'))) {
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.map((n: Notification) =>
              n.$id === payload.$id ? payload : n
            ),
          };
        });
      } else if (events.some((e) => e.includes('.delete'))) {
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.filter(
              (n: Notification) => n.$id !== payload.$id
            ),
            total: Math.max(0, old.total - 1),
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, user?.$id]);

  const handleMarkAsRead = (id: string) => {
    markAsRead({ param: { notificationId: id }, json: { isRead: true } });
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.MEMBER_REMOVED:
        return '/';
      case NotificationType.MEMBER_ROLE_CHANGED:
        return `/workspaces/${notification.workspaceId}`;
      case NotificationType.COMMENT_TAG:
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.TASK_UNASSIGNED:
      case NotificationType.STATUS_UPDATED:
        return `/workspaces/${notification.workspaceId}/tasks/${notification.targetId}`;
      default:
        return `/workspaces/${notification.workspaceId}`;
    }
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
      <PopoverContent className="w-[340px] p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <Tabs value={view} onValueChange={(val) => setView(val as 'all' | 'unread')}>
            <TabsList className="h-7 p-0.5 bg-muted">
              <TabsTrigger value="all" className="text-xs px-2.5 py-0.5">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs px-2.5 py-0.5">
                Unread
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="h-80">
          {isNotificationsLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {view === 'unread' ? 'No unread notifications' : 'No notifications'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredNotifications.map((notification: Notification) => (
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
                    href={getNotificationLink(notification)}
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
