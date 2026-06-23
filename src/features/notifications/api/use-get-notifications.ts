import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetNotifications = () => {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await client.api.notifications.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const { data } = await response.json();
      return data;
    },
    staleTime: 30_000,            // consider fresh for 30s
    refetchOnWindowFocus: true,   // re-sync when user switches back to tab
    refetchInterval: 30_000,      // poll every 30s as Realtime failsafe
    refetchIntervalInBackground: false, // only poll when tab is visible
  });

  return query;
};
