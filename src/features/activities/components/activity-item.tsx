'use client';

import { PopulatedActivity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ActivityItemProps {
  activity: PopulatedActivity;
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  return (
    <div className="flex gap-x-3 py-3">
      <Avatar className="size-8 shrink-0">
        {activity.userAvatar && (
          <AvatarImage src={activity.userAvatar} alt={activity.userName} className="object-cover" />
        )}
        <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium text-xs flex items-center justify-center">
          {activity.userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 gap-y-0.5">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {activity.userName}
          </span>{' '}
          {activity.description}
        </p>
        <span className="text-xs text-neutral-500">
          {formatDistanceToNow(new Date(activity.$createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
};
