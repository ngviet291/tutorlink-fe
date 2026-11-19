import { ROUTES } from "@/constants/routes";
import type { NotificationResponse } from "../types/notification.types";

type RouteInput = Pick<
  NotificationResponse,
  "targetType" | "targetId" | "notificationType"
>;

const FALLBACK_ROUTE_BY_TYPE: Partial<
  Record<NotificationResponse["notificationType"], string>
> = {
  APPLICATION: ROUTES.MY_APPLICATIONS,
  TRANSACTION: ROUTES.WALLET,
  PAYMENT: ROUTES.WALLET,
  REVIEW: ROUTES.TUTOR_PROFILE,
  POST: ROUTES.MY_POSTS,
  CHAT: ROUTES.CHAT_INBOX,
  MESSAGE: ROUTES.CHAT_INBOX,
};

export function resolveNotificationRoute(n: RouteInput): string | null {
  if (!n.targetType) {
    return FALLBACK_ROUTE_BY_TYPE[n.notificationType] ?? null;
  }
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
    case "ADMIN_COMPLAINTS":
      return ROUTES.ADMIN_COMPLAINTS;
    case "ADMIN_TUTORS":
      return ROUTES.ADMIN_TUTOR_REVIEW;
    default:
      return null; // NONE: cố ý không điều hướng
  }
}
