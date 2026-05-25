import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/rpc';

type ResponseType = InferResponseType<(typeof client.api.comments)['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.comments)['$post']>;

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.comments['$post']({ form });

      if (!response.ok) {
        throw new Error('Failed to create comment');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Comment added!');
      queryClient.invalidateQueries({
        queryKey: ['comments', data.data.taskId],
      });
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  return mutation;
};
