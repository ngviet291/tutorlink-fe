import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import type { CursorResponse } from "@/shared/types/api.types";
import type { NotificationResponse } from "../types/notification.types";
import { notifications } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";

const USE_MOCK = mockConfig.notify;

export const notificationService = {
  async getMyNotifications(): Promise<NotificationResponse[]> {
    if (USE_MOCK) {
      await delay(200);
      const me = requireUser();
      return [...(notifications[me.id] ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    const page = await http
      .get<CursorResponse<NotificationResponse>>("/v1/notifications", {
        params: { limit: 100 },
      })
      .then((res) => res.data);
    return page.content;
  },

  async markRead(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay(100);
      const me = requireUser();
      const n = notifications[me.id]?.find((x) => x.id === id);
      if (n) n.isRead = true;
      return;
    }
    await http.patch(`/v1/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) {
      await delay(100);
      const me = requireUser();
      for (const n of notifications[me.id] ?? []) n.isRead = true;
      return;
    }
    await http.patch("/v1/notifications/read-all");
  },
};
