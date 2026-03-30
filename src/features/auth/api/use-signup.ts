import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/rpc'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

type ResponseType = InferResponseType<
  (typeof client.api.auth.register)['$post']
>
type RequestType = InferRequestType<(typeof client.api.auth.register)['$post']>

export const useSignUp = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.register['$post']({ json })

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json()
          if ('error' in errorData && errorData.error === 'This email is already registered') {
            throw new Error('This email is already registered')
          }
        }
        throw new Error('Failed to register')
      }

      return await response.json()
    },
    onSuccess: () => {
      toast.success('Registration successful!')
      router.refresh()
      queryClient.invalidateQueries({
        queryKey: ['current'],
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return mutation
}
