'use client';

// lib
import { ColumnDef } from '@tanstack/react-table';

// types
import { Task } from '../types';

// components
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { TaskDate } from './task-date';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { Badge } from '@/components/ui/badge';
import { TaskActions } from './task-actions';

import Link from 'next/link';

import { useTaskDetailModal } from '../hooks/use-task-detail-modal';

// utils
import { snakeCaseToTitleCase } from '@/lib/utils';

interface TaskNameCellProps {
  name: string;
  id: string;
}

const TaskNameCell = ({ name, id }: TaskNameCellProps) => {
  const { open } = useTaskDetailModal();
  return (
    <span
      onClick={() => open(id)}
      className="font-medium hover:underline text-primary cursor-pointer line-clamp-1 max-w-[300px]"
    >
      {name}
    </span>
  );
};

export const Columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Task name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.original.name;
      const id = row.original.$id;

      return <TaskNameCell name={name} id={id} />;
    },
  },
  {
    accessorKey: 'project',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Project
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const project = row.original.project;
      const workspaceId = row.original.workspaceId;
      return (
        <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
          <div className="flex items-center gap-x-2 text-sm font-medium hover:underline cursor-pointer">
            <ProjectAvatar
              name={project.name}
              className="size-6"
              image={project.imageUrl}
            />
            <p className="truncate max-w-[200px] line-clamp-1">{project.name}</p>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'assignee',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Assignee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const assignee = row.original.assignee;
      return (
        <div className="flex items-center gap-x-2 text-sm font-medium">
          <MemberAvatar
            name={assignee.name}
            className="size-6"
            fallbackClassName="text-xs"
          />
          {assignee.name}
        </div>
      );
    },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dueDate = row.original.dueDate;
      return <TaskDate value={dueDate} />;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant={status}>{snakeCaseToTitleCase(status)}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <TaskActions id={task.$id} projectId={task.projectId}>
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="size-4" />
          </Button>
        </TaskActions>
      );
    },
  },
];
