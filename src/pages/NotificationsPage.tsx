import { CheckCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { NotificationList } from "@/features/notification/components/NotificationList";
import {
  useNotificationMutations,
  useNotifications,
} from "@/features/notification/hooks/useNotifications";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll"; // chỉnh path theo dự án

export default function NotificationsPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { markAll } = useNotificationMutations();
  const hasUnread = data?.some((n) => !n.read) ?? false;

  const sentinelRef = useInfiniteScroll(
    () => void fetchNextPage(),
    !!hasNextPage && !isFetchingNextPage,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        title="Thông báo"
        actions={
          hasUnread ? (
            <Button
              variant="outline"
              size="sm"
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}>
              <CheckCheck className="size-4" /> Đánh dấu đã đọc
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title="Chưa có thông báo" />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <NotificationList items={data} />
          </div>

          {/* Sentinel: chạm viewport thì tải trang tiếp */}
          <div ref={sentinelRef} className="h-1" aria-hidden />

          {isFetchingNextPage && <ListSkeleton />}
        </>
      )}
    </div>
  );
}
