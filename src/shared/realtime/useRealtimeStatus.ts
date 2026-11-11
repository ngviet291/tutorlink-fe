import { useCallback, useSyncExternalStore } from "react";
import type { IRealtimeClient } from "@/config/realtime/IRealtimeClient";
import type { RealtimeStatus } from "@/config/realtime/realtime.types";
import { realtimeClient } from "@/config/di/container";

/** Trạng thái kết nối realtime hiện tại, để UI hiển thị và để bật/tắt polling dự phòng. */
export function useRealtimeStatus(
  client: IRealtimeClient = realtimeClient,
): RealtimeStatus {
  const subscribe = useCallback(
    (notify: () => void) => client.onStatus(notify),
    [client],
  );
  return useSyncExternalStore(subscribe, () => client.getStatus());
}
