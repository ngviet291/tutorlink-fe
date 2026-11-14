import type { RealtimeEnvelope } from "@/config/realtime/realtime.types";
import type { NotificationResponse } from "../types/notification.types";

export const NOTIFICATION_NEW = "NOTIFICATION_NEW";

export interface NotificationRealtimeData {
  id: string;
  title: string;
  content: string;
  notificationType:
    | "SYSTEM"
    | "APPLICATION"
    | "TRANSACTION"
    | "MESSAGE"
    | "REVIEW"
    | "POST"
    | "MATCHING";
  read: boolean; // ĐỔI: xem ghi chú bên dưới
  createdAt: string;
}


export function isNotificationNew(
  envelope: RealtimeEnvelope,
): envelope is RealtimeEnvelope<NotificationResponse> {
  return envelope.type === NOTIFICATION_NEW;
}
