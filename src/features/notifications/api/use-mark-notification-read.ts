import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.notifications[":notificationId"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.notifications[":notificationId"]["$patch"]>;

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.notifications[":notificationId"]["$patch"]({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });

  return mutation;
};
