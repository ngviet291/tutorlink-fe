import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { isNotificationNew } from "../realtime/notification.realtime";
import { realtimeClient } from "@/config/di/container";

const NOTIFICATION_KEY = ["notifications"]; // ĐỔI: query key thật

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    const offEvent = realtimeClient.onEvent((envelope) => {
      if (!isNotificationNew(envelope)) return;
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
      toast.info(envelope.data.title); // ĐỔI/bỏ nếu useToast không có `info`
    });

    const offConnected = realtimeClient.onConnected((info) => {
      if (info.isReconnect) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });
      }
    });

    return () => {
      offEvent();
      offConnected();
    };
  }, [queryClient, toast]);
}
