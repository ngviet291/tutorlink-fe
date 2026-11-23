import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { POST_STATUS_META } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import {
  FilterSidebar,
  emptyFilter,
  budgetQuery,
  type FilterValues,
} from "@/shared/components/ui/FilterSidebar";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { Select } from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";
import { timeAgo } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/errors";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminMutations,
  useAdminPosts,
} from "@/features/admin/hooks/useAdmin";
import { useApplicationsByPost } from "@/features/application/hooks/useApplications";
import { PostCard } from "@/features/post/components/PostCard";
import type { PostResponse } from "@/features/post/types/post.types";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import type { PostStatus } from "@/shared/types/common.types";

const RANGE_MAX = 10_000_000;

function ApplicationsModal({
  post,
  onClose,
}: {
  post: PostResponse | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useApplicationsByPost(
    post?.id ?? "",
    Boolean(post),
  );

  return (
    <Modal
      open={Boolean(post)}
      onClose={onClose}
      title={`Lượt đăng ký: ${post?.title ?? ""}`}
      size="lg"
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState title="Chưa có lượt đăng ký" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((a) => {
            const avatarUrl = a.tutor.avatarUrl || "/default-avatar.png";
            const rating = a.tutor.averageRating?.toFixed(1) ?? "0.0";
            const reviewCount = a.tutor.reviewCount ?? 0;

            return (
              <Link
                key={a.id}
                to={ROUTES.TUTOR_DETAIL(a.tutor.id)}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-md"
              >
                {/* Header: Avatar + Name + Rating */}
                <div className="flex items-start gap-3">
                  <img
                    src={avatarUrl}
                    alt={a.tutor.fullName}
                    className="size-14 rounded-full object-cover ring-2 ring-border group-hover:ring-primary transition-all flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">
                      {a.tutor.fullName}
                    </p>
                    {/* Rating */}
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        ⭐{" "}
                        <span className="font-medium text-text">{rating}</span>
                      </span>
                      <span>•</span>
                      <span>{reviewCount} đánh giá</span>
                    </div>
                  </div>
                </div>

                {/* Proposed Fee */}
                {a.proposedFee && (
                  <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                    <span className="text-xs font-medium text-text-secondary">
                      Đề xuất phí
                    </span>
                    <span className="text-base font-bold text-primary">
                      {a.proposedFee.toLocaleString()} đ
                    </span>
                  </div>
                )}

                {/* Applied Time */}
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Clock className="size-3.5" />
                  <span>Đã ứng tuyển {timeAgo(a.appliedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function AdminPostsPage() {
  const toast = useToast();
  const subjects = useSubjects();

  const [status, setStatus] = useState<PostStatus | "">("");
  const [filter, setFilter] = useState<FilterValues>(emptyFilter(RANGE_MAX));

  // FilterSidebar giữ subjectId nhưng BE nhận subjectName
  const subjectName = subjects.data?.find(
    (s) => s.id === filter.subjectId,
  )?.name;

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminPosts({
    status,
    subjectName,
    teachingMode: filter.teachingMode || undefined,

    // BE nhận một educationLevel.
    // Nếu chọn nhiều thì lọc thêm phía FE.
    educationLevel:
      filter.educationLevels.length === 1
        ? filter.educationLevels[0]
        : undefined,

    ...budgetQuery(filter),
  });

  const posts = (data?.pages.flatMap((page) => page.content) ?? []).filter(
    (post) =>
      filter.educationLevels.length <= 1 ||
      filter.educationLevels.includes(post.educationLevel),
  );

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "300px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  const { removePost } = useAdminMutations();

  const [target, setTarget] = useState<PostResponse | null>(null);

  const [viewing, setViewing] = useState<PostResponse | null>(null);

  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const close = () => {
    setTarget(null);
    setReason("");
    setReasonError("");
  };

  const confirm = () => {
    if (!target) {
      return;
    }

    if (reason.trim().length < 5) {
      setReasonError("Vui lòng nhập lý do (tối thiểu 5 ký tự)");
      return;
    }

    removePost.mutate(
      {
        id: target.id,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Đã gỡ bài vi phạm");
          close();
        },
        onError: (e) => {
          toast.error(getErrorMessage(e));
        },
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader title="Quản lý bài đăng & lượt đăng ký" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* FILTER */}
        <div className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-64 lg:shrink-0 lg:self-start lg:overflow-y-auto">
          <Select
            aria-label="Lọc theo trạng thái"
            placeholder="Tất cả trạng thái"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus | "")}
            options={(Object.keys(POST_STATUS_META) as PostStatus[]).map(
              (s) => ({
                value: s,
                label: POST_STATUS_META[s].label,
              }),
            )}
          />

          <FilterSidebar
            value={filter}
            onChange={setFilter}
            rangeLabel="Học phí (VNĐ)"
            rangeMax={RANGE_MAX}
            budgetUnitMode
            hideProvince
          />
        </div>

        {/* POSTS */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : !posts.length ? (
            <EmptyState title="Không có bài đăng" />
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <li key={post.id}>
                    <PostCard
                      post={post}
                      onViewApplications={() => setViewing(post)}
                      onRemove={
                        post.status !== "REMOVED" && post.status !== "CLOSED"
                          ? () => setTarget(post)
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>

              <div ref={sentinelRef} className="h-8" />

              {isFetchingNextPage && <ListSkeleton rows={2} />}
            </>
          )}
        </div>
      </div>

      {/* APPLICATIONS */}
      <ApplicationsModal post={viewing} onClose={() => setViewing(null)} />

      {/* REMOVE POST */}
      <Modal
        open={Boolean(target)}
        onClose={close}
        title="Gỡ bài vi phạm"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Hủy
            </Button>

            <Button
              variant="danger"
              loading={removePost.isPending}
              onClick={confirm}
            >
              Gỡ bài
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text-secondary">
          Bài “{target?.title}” sẽ chuyển sang trạng thái Đã gỡ và người đăng
          được thông báo.
        </p>

        <Textarea
          label="Lý do gỡ"
          required
          value={reason}
          error={reasonError}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError("");
          }}
        />
      </Modal>
    </div>
  );
}
