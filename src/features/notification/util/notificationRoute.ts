import { ROUTES } from "@/constants/routes";
import type { NotificationResponse } from "../types/notification.types";

/**
 * Map đích đến của thông báo (BE trả targetType + targetId) sang URL của FE.
 * Trả về null nếu không điều hướng (thông báo cũ chưa có target, NONE, hoặc thiếu id bắt buộc).
 */
export function resolveNotificationRoute(
  n: Pick<NotificationResponse, "targetType" | "targetId">,
): string | null {
    
  switch (n.targetType) {
    case "POST":
      return n.targetId ? ROUTES.POST_DETAIL(n.targetId) : null;
    case "MY_POSTS":
      return ROUTES.MY_POSTS;
    case "MY_APPLICATIONS":
      return ROUTES.MY_APPLICATIONS;
    case "TUTOR_PROFILE":
      return ROUTES.TUTOR_PROFILE;
    case "WALLET":
      return ROUTES.WALLET;
    case "CHAT":
      return n.targetId ? ROUTES.CHAT(n.targetId) : ROUTES.CHAT_INBOX;
    default:
      return null; // NONE / null / undefined
  }
}
