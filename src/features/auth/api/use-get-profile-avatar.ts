import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/rpc'

export const useGetProfileAvatar = () => {
  const query = useQuery({
    queryKey: ['profile-avatar'],
    queryFn: async () => {
      const response = await client.api.auth['profile-avatar']['$get']()

      if (!response.ok) {
        return null
      }

      return await response.json()
    },
  })

  return query
}
