import { useEffect } from "react";
import { unauthorizedEvent } from "@/config/events/emitter";
import type { IRealtimeClient } from "@/config/realtime/IRealtimeClient";
import type { RealtimeEventRouter } from "@/config/realtime/RealtimeEventRouter";
import { useAppSelector } from "@/shared/hooks/useAppStore";

interface Props {
  client: IRealtimeClient;
  router: RealtimeEventRouter;
}

/**
 * Gắn vòng đời kết nối realtime với phiên đăng nhập:
 * có user → connect; user đổi/mất hoặc 401 → disconnect.
 * Login, register và khôi phục phiên khi reload đều đi qua `setUser`, nên chỉ cần theo dõi `user.id`.
 */
export function RealtimeBridge({ client, router }: Props) {
  const userId = useAppSelector((s) => s.auth.user?.id);

  // Chuyển event sang router (không phụ thuộc user)
  useEffect(() => client.onEvent((e) => router.handle(e)), [client, router]);

  useEffect(() => {
    if (!userId) return;
    client.connect();
    return () => {
      void client.disconnect();
    };
  }, [client, userId]);

  // Refresh thất bại hoặc 401: ngắt ngay, kể cả khi Redux chưa kịp xóa user
  useEffect(
    () =>
      unauthorizedEvent.on(() => {
        void client.disconnect();
      }),
    [client],
  );

  return null;
}
