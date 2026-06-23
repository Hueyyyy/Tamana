import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/rpc'
import { TaskStatus, TaskPriority } from '../types'

interface UseGetTasksProps {
    workspaceId: string
    projectId?: string | null
    assigneeId?: string | null
    status?: TaskStatus | null
    priority?: TaskPriority | null
    dueDate?: string | null
    search?: string | null
    parentId?: string | null
}

export const useGetTasks = ({workspaceId, projectId, assigneeId, status, priority, dueDate, search, parentId}: UseGetTasksProps) => {
  const query = useQuery({
    queryKey: ['tasks', workspaceId, projectId, assigneeId, status, priority, dueDate, search, parentId ],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query : {
            workspaceId,
            projectId: projectId ?? undefined,
            assigneeId: assigneeId ?? undefined,
            status: status ?? undefined,
            priority: priority ?? undefined,
            dueDate: dueDate ?? undefined,
            search: search ?? undefined,
            parentId: parentId ?? undefined,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const { data } = await response.json()

      return data
    },
    // Re-sync when the user switches back to the tab (e.g. after being
    // notified by another user) and poll every 30s as a catch-all so
    // tasks created by other users always appear within 30 seconds.
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false, // only poll when tab is visible
  })
  return query
}
