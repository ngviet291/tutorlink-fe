import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { NotificationResponse } from "../types/notification.types";
import type { CursorResponse } from "@/shared/types/common.dto";
import { notificationService } from "@/config/di/container";

export const NOTIFICATION_KEY = ["notifications"] as const;
const LIMIT = 10;

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEY,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      notificationService.getMyNotifications(pageParam, LIMIT),
    getNextPageParam: (last: CursorResponse<NotificationResponse>) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined, // ĐỔI: field thật của CursorResponse
    // Làm phẳng để `data` là mảng như NotificationBell và NotificationsPage đang dùng
    select: (d): NotificationResponse[] => d.pages.flatMap((p) => p.content), // ĐỔI: tên field chứa danh sách
  });
}

/**
 * Số thông báo chưa đọc thật từ BE (không phụ thuộc số mục đã tải).
 * Key nằm dưới NOTIFICATION_KEY nên realtime và các mutation invalidate là tự làm mới.
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATION_KEY, "unread"] as const,
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEY });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: invalidate,
  });

  return { markOne, markAll };
}
