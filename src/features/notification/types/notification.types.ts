import type { NotificationType } from "@/shared/types/common.types";
import type { NotificationTarget } from "./notification.dto";

export interface NotificationResponse {
  id: string;
  title: string;
  content: string;
  notificationType: NotificationType;
  read: boolean;
  createdAt: string;
  /** Đích đến khi click. Thông báo cũ (trước khi có tính năng) sẽ không có. */
  targetType?: NotificationTarget | null;
  targetId?: string | null;
}

export { type NotificationType, type NotificationTarget };
