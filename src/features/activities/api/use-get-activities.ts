import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/rpc';

interface UseGetActivitiesProps {
  taskId: string;
}

export const useGetActivities = ({ taskId }: UseGetActivitiesProps) => {
  const query = useQuery({
    queryKey: ['activities', taskId],
    queryFn: async () => {
      const response = await client.api.activities.$get({
        query: {
          taskId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
