// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { NotificationType } from "@/shared/types/common.types";

/** BE: notification/enums/NotificationTarget.java */
export type NotificationTarget =
  | "POST"
  | "MY_POSTS"
  | "MY_APPLICATIONS"
  | "TUTOR_PROFILE"
  | "WALLET"
  | "CHAT"
  | "NONE";

/** BE: notification/dto/response/NotificationResponse.java */
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
