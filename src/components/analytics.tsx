//Types
import { ProjectAnalyticsResponseType } from '@/features/projects/api/use-get-project-analytics';

//Components
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { AnalyticsCard } from './analytics-card';
import { DottedSeparator } from './dotted-separator';

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {
  return (
    <ScrollArea className="border rounded-lg w-full whitespace-nowrap shrink-0">
      <div className="w-full flex flex-row">
        <div className="flex items-center flex-1">
          <AnalyticsCard
            title="Total Tasks"
            value={data.taskCount}
            variant={data.taskCountDifference > 0 ? 'up' : 'down'}
            increaseValue={data.taskCountDifference}
          />
          <DottedSeparator direction="vertical" />
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard
            title="Assigned Tasks"
            value={data.assignedTasksCount}
            variant={data.assignedTasksCountDifference > 0 ? 'up' : 'down'}
            increaseValue={data.assignedTasksCountDifference}
          />
          <DottedSeparator direction="vertical" />
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard
            title="Completed Tasks"
            value={data.completedTasksCount}
            variant={data.completedTasksCountDifference > 0 ? 'up' : 'down'}
            increaseValue={data.completedTasksCountDifference}
          />
          <DottedSeparator direction="vertical" />
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard
            title="Overdue Tasks"
            value={data.overdueTasksCount}
            variant={data.overdueTasksCountDifference > 0 ? 'up' : 'down'}
            increaseValue={data.overdueTasksCountDifference}
          />
          <DottedSeparator direction="vertical" />
        </div>
        <div className="flex items-center flex-1">
          <AnalyticsCard
            title="Incomplete Tasks"
            value={data.incompleteTasksCount}
            variant={data.incompleteTasksCountDifference > 0 ? 'up' : 'down'}
            increaseValue={data.incompleteTasksCountDifference}
          />
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
