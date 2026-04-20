'use client';

import { useGetActivities } from '../api/use-get-activities';
import { ActivityItem } from './activity-item';
import { DottedSeparator } from '@/components/dotted-separator';
import { Loader } from 'lucide-react';

interface ActivityLogProps {
  taskId: string;
}

export const ActivityLog = ({ taskId }: ActivityLogProps) => {
  const { data: activities, isLoading } = useGetActivities({ taskId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const documents = activities?.documents || [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-y-2 mb-4">
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <DottedSeparator />
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200">
          {documents.map((activity) => (
            <ActivityItem key={activity.$id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};
