'use client';

//Components
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Columns } from './columns';
import { DataTable } from './data-table';
import { DataKanban } from './data-kanban';
import { DataCalendar } from './task-calendar';

//Icons
import { Loader, Plus } from 'lucide-react';

//Hooks
import { useCreateTaskModal } from '../hooks/use-create-task-modal';
import { useGetTasks } from '../api/use-get-tasks';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useQueryState } from 'nuqs';
import DataFilters from './data-filters';
import { useTaskFilters } from '../hooks/use-task-filters';
import { useCallback } from 'react';
import { useProjectId } from '@/features/projects/hooks/use-project-id';

//Api
import { useBulkUpdateTask } from '../api/use-bulk-update-task';
import { useGetMemberInfo } from '@/features/members/api/use-get-member-info';

//Types
import { TaskStatus } from '../types';

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
  hideMemberFilter?: boolean;
  userId?: string;
}

export const TaskViewSwitcher = ({
  hideProjectFilter,
  hideMemberFilter,
  userId,
}: TaskViewSwitcherProps) => {
  const [view, setView] = useQueryState('task-view', {
    defaultValue: 'table',
  });
  const { open } = useCreateTaskModal();
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const [{ status, projectId, assigneeId, dueDate, search }] = useTaskFilters();
  const { data: memberInfo } = useGetMemberInfo({
    workspaceId,
    userId: userId as string,
  });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    status,
    projectId: paramProjectId || projectId,
    assigneeId: userId ? memberInfo?.$id : assigneeId,
    dueDate,
    search,
  });

  const { mutate: bulkUpdateTasks } = useBulkUpdateTask();

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdateTasks({
        json: { tasks },
      });
    },
    [bulkUpdateTasks],
  );

  return (
    <Tabs
      value={view}
      onValueChange={(value) => setView(value)}
      className="flex-1 w-full border rounded-lg"
    >
      <div className="h-full flex flex-col overflow-auto p-4">
        <div className="flex flex-col gap-y-2 lg:flex-row items-center justify-between">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger value="table" className="h-8 w-full lg:w-auto">
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="h-8 w-full lg:w-auto">
              Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="h-8 w-full lg:w-auto">
              Calendar
            </TabsTrigger>
          </TabsList>
          <Button
            size={'sm'}
            className="w-full lg:w-auto"
            onClick={() => open(undefined, paramProjectId)}
          >
            <Plus className="size-4" />
            New
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <DataFilters
          hideProjectFilter={hideProjectFilter}
          hideMemberFilter={hideMemberFilter}
        />
        <DottedSeparator className="my-4" />
        {isLoadingTasks ? (
          <div className="flex flex-col w-full h-[200px] items-center justify-center rounded-lg border">
            <Loader className="size-5 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <p>
                <DataTable columns={Columns} data={tasks?.documents ?? []} />
              </p>
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <p>
                <DataKanban
                  data={tasks?.documents ?? []}
                  onChange={onKanbanChange}
                  projectId={paramProjectId}
                />
              </p>
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <p>
                <DataCalendar data={tasks?.documents ?? []} />
              </p>
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};

export default TaskViewSwitcher;
