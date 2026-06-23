import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

import { Notification } from "../types";

type ResponseType = InferResponseType<typeof client.api.notifications[":notificationId"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.notifications[":notificationId"]["$patch"]>;

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, { previous: { documents: Notification[]; total: number } | undefined }>({
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
    // Flip the flag in the local cache immediately — no round-trip needed.
    onMutate: async ({ param }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<{ documents: Notification[]; total: number }>(["notifications"]);

      queryClient.setQueryData<{ documents: Notification[]; total: number }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            documents: old.documents.map((n) =>
              n.$id === param.notificationId ? { ...n, isRead: true } : n
            ),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back to the snapshot taken before the optimistic update.
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      toast.error("Failed to mark notification as read");
    },
    // No onSuccess invalidation needed — the Realtime subscriber will
    // propagate the authoritative update from Appwrite automatically.
  });

  return mutation;
};
