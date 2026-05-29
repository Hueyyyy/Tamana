import React from 'react';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { DatePicker } from '@/components/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, FolderIcon, ListCheckIcon, UserIcon } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';
import { useTaskFilters } from '../hooks/use-task-filters';

interface DataFiltersProps {
  hideProjectFilter?: boolean;
  hideMemberFilter?: boolean;
}

const DataFilters = ({
  hideProjectFilter,
  hideMemberFilter,
}: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers;

  const projectOptions = projects?.documents.map((project) => ({
    value: project.$id,
    label: project.name,
  }));

  const memberOptions = members?.documents.map((member) => ({
    value: member.$id,
    label: member.name,
    imageUrl: member.avatarUrl,
  }));

  const [{ status, priority, projectId, assigneeId, dueDate }, setFilters] =
    useTaskFilters();

  const onStatusChange = (status: string) => {
    setFilters({
      status: status === 'all' ? null : (status as TaskStatus),
    });
  };

  const onPriorityChange = (priority: string) => {
    setFilters({
      priority: priority === 'all' ? null : (priority as TaskPriority),
    });
  };

  const onAssigneeChange = (assigneeId: string) => {
    setFilters({
      assigneeId: assigneeId === 'all' ? null : assigneeId,
    });
  };

  const onProjectChange = (projectId: string) => {
    setFilters({
      projectId: projectId === 'all' ? null : projectId,
    });
  };

  const onDueDateChange = (dueDate: string) => {
    setFilters({
      dueDate: dueDate === '' ? null : dueDate,
    });
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <Select
        defaultValue={status ?? undefined}
        onValueChange={(value) => onStatusChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <ListCheckIcon className="size-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-neutral-400" />
              <span>All statuses</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.BACKLOG}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-pink-400" />
              <span>Backlog</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.TODO}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-red-400" />
              <span>To Do</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_PROGRESS}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-yellow-400" />
              <span>In Progress</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_REVIEW}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-blue-400" />
              <span>In Review</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.DONE}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-emerald-400" />
              <span>Done</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={priority ?? undefined}
        onValueChange={(value) => onPriorityChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <AlertCircle className="size-4 mr-2" />
            <SelectValue placeholder="All priorities" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-neutral-400" />
              <span>All priorities</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskPriority.LOW}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-slate-400" />
              <span>Low</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskPriority.MEDIUM}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-blue-500" />
              <span>Medium</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskPriority.HIGH}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span>High</span>
            </div>
          </SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskPriority.URGENT}>
            <div className="flex items-center gap-x-2">
              <div className="size-2 rounded-full bg-rose-600" />
              <span>Urgent</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      {!hideMemberFilter && (
        <Select
          defaultValue={assigneeId ?? undefined}
          onValueChange={(value) => onAssigneeChange(value)}
        >
          <SelectTrigger className="w-full lg:w-auto h-8">
            <div className="flex items-center pr-2">
              <UserIcon className="size-4 mr-2" />
              <SelectValue placeholder="All assignees" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-x-2">
                <UserIcon className="size-4 text-neutral-500 mr-0.5" />
                <span>All assignees</span>
              </div>
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="unassigned">
              <div className="flex items-center gap-x-2">
                <MemberAvatar
                  name="Unassigned"
                  className="size-6"
                  fallbackClassName="text-[10px]"
                />
                <span>Unassigned</span>
              </div>
            </SelectItem>
            <SelectSeparator />
            {memberOptions?.map((member, index) => (
              <React.Fragment key={member.value}>
                <SelectItem value={member.value}>
                  <div className="flex items-center gap-x-2">
                    <MemberAvatar
                      name={member.label}
                      imageUrl={member.imageUrl}
                      className="size-6"
                      fallbackClassName="text-[10px]"
                    />
                    <span>{member.label}</span>
                  </div>
                </SelectItem>
                {index < memberOptions.length - 1 && <SelectSeparator />}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      )}
      {!hideProjectFilter && (
        <Select
          defaultValue={projectId ?? undefined}
          onValueChange={(value) => onProjectChange(value)}
        >
          <SelectTrigger className="w-full lg:w-auto h-8">
            <div className="flex items-center pr-2">
              <FolderIcon className="size-4 mr-2" />
              <SelectValue placeholder="All projects" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectSeparator />
            {projectOptions?.map((project, index) => (
              <>
                <SelectItem key={project.value} value={project.value}>
                  {project.label}
                </SelectItem>
                {index < projectOptions.length - 1 && <SelectSeparator />}
              </>
            ))}
          </SelectContent>
        </Select>
      )}
      <DatePicker
        placeholder="Due date"
        className="h-8 w-full lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(value) => onDueDateChange(value ? value.toISOString() : '')}
      />
    </div>
  );
};

export default DataFilters;
