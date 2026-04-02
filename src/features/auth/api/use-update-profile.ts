import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/rpc'

import { toast } from 'sonner'

type ResponseType = InferResponseType<
  (typeof client.api.auth)['update-profile']['$patch'],
  200
>
type RequestType = InferRequestType<
  (typeof client.api.auth)['update-profile']['$patch']
>

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.auth['update-profile']['$patch']({
        form
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      return await response.json()
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!')
      queryClient.invalidateQueries({
        queryKey: ['current'],
      })
      queryClient.invalidateQueries({
        queryKey: ['profile-avatar'],
      })
    },
    onError: () => {
      toast.error(`Failed to update profile`)
    },
  })

  return mutation
}
