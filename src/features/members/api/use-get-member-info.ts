import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/rpc'

interface   UseGetMemberInfoProps {
    workspaceId: string
    userId?: string
}

export const useGetMemberInfo = ({workspaceId, userId}: UseGetMemberInfoProps) => {
  const query = useQuery({
    queryKey: ['member-info', workspaceId, userId],
    queryFn: async () => {
      const response = await client.api.members['memberinfo'].$get({
        query: {
            workspaceId,
            userId: userId as string,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch member info')
      }

      const { data } = await response.json()

      return data
    },
    enabled: !!userId,
  })
  return query
}
