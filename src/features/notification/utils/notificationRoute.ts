import { ROUTES } from "@/constants/routes";
import { HIGHLIGHT_PARAM } from "@/shared/hooks/useHighlight";
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

function reviewsRoute(tutorId: string, reviewId?: string | null): string {
  const base = `${ROUTES.TUTOR_DETAIL(tutorId)}?tab=reviews`;
  return reviewId
    ? `${base}&${HIGHLIGHT_PARAM}=${encodeURIComponent(reviewId)}`
    : base;
}
export function resolveNotificationRoute(
  n: RouteInput,
  userId?: string,
): string | null {
  console.log("notif", n.notificationType, n.targetType, n.targetId, userId);
  if (!n.targetType) {
    if (n.notificationType === "REVIEW" && userId) return reviewsRoute(userId);
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
      if (n.notificationType === "REVIEW" && userId)
        return reviewsRoute(userId);
      return ROUTES.TUTOR_PROFILE;
    case "REVIEW":
      return userId ? reviewsRoute(userId, n.targetId) : ROUTES.TUTOR_PROFILE;
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
