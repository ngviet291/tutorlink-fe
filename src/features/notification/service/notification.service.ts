import { http } from "@/config/axiosClient";
import { env } from "@/config/env";
import type { NotificationResponse } from "../types/notification.types";
import { notifications } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";

const USE_MOCK = true;

export const notificationService = {
  async getMyNotifications(): Promise<NotificationResponse[]> {
    if (USE_MOCK) {
      await delay(200);
      const me = requireUser();
      return [...(notifications[me.id] ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    return http
      .get<NotificationResponse[]>("/v1/notifications/me")
      .then((res) => res.data);
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
