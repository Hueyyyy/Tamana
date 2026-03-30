import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/rpc'

import { toast } from 'sonner'

type ResponseType = InferResponseType<
  (typeof client.api.members)[':memberId']['$delete'],
  200
>
type RequestType = InferRequestType<
  (typeof client.api.members)[':memberId']['$delete']
>

export const useDeleteMember = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.members[':memberId']['$delete']({
        param
      })

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          const errorData = await response.json()
          if ('error' in errorData) {
            throw new Error(errorData.error)
          }
        }
        throw new Error('Failed to delete member')
      }

      return await response.json()
    },
    onSuccess: () => {
      toast.success('Member deleted successfully!')
      queryClient.invalidateQueries({
        queryKey: ['members'],
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return mutation
}
