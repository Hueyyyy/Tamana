import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { DatePicker } from '@/components/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderIcon, ListCheckIcon, UserIcon } from 'lucide-react';
import { TaskStatus } from '../types';
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
  }));

  const [{ status, projectId, assigneeId, dueDate }, setFilters] =
    useTaskFilters();

  const onStatusChange = (status: string) => {
    setFilters({
      status: status === 'all' ? null : (status as TaskStatus),
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
          <SelectItem value="all">All statuses</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
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
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectSeparator />
            {memberOptions?.map((member, index) => (
              <>
                <SelectItem key={member.value} value={member.value}>
                  {member.label}
                </SelectItem>
                {index < memberOptions.length - 1 && <SelectSeparator />}
              </>
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
