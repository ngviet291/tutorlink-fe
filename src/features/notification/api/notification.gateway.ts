import type { CursorResponse } from "@/shared/types/common.dto";
import type {
  NotificationResponse,
} from "../types/notification.types";

export interface NotificationGateway {
  getMyNotifications(
    cursor: string | undefined,
    limit: number,
  ): Promise<CursorResponse<NotificationResponse>>;
  markAsRead(id: string): Promise<NotificationResponse>;
  markAllAsRead(): Promise<number>;
}
