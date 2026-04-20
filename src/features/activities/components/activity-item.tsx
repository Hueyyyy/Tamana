'use client';

import { PopulatedActivity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ActivityItemProps {
  activity: PopulatedActivity;
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  return (
    <div className="flex gap-x-3 py-3">
      <Avatar className="size-8">
        <AvatarFallback className="bg-neutral-200 text-neutral-500 font-medium text-xs flex items-center justify-center">
          {activity.userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 gap-y-0.5">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">
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
