import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { IRealtimeClient } from "@/config/realtime/IRealtimeClient";
import type { RealtimeEventRouter } from "@/config/realtime/RealtimeEventRouter";
import { useToast } from "@/shared/hooks/useToast";
import { NOTIFICATION_KEY } from "../hooks/useNotifications";
import { NOTIFICATION_NEW } from "./notification.realtime";

interface Props {
  client: IRealtimeClient;
  router: RealtimeEventRouter;
}

/** Nối feature notification vào hạ tầng realtime: có event mới thì làm mới danh sách và báo toast. Không render gì. */
export function NotificationRealtimeBinding({ client, router }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(
    () =>
      router.register<{ title?: string }>(NOTIFICATION_NEW, (envelope) => {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
        if (envelope.data?.title) toast.info(envelope.data.title);
      }),
    [router, queryClient, toast],
  );

  // Event không được replay sau khi mất kết nối: đồng bộ lại bằng REST
  useEffect(
    () =>
      client.onConnected(({ isReconnect }) => {
        if (isReconnect) {
          void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
        }
      }),
    [client, queryClient],
  );

  return null;
}
