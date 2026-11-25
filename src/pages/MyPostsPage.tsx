import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { CardGridSkeleton } from "@/shared/components/ui/Skeleton";
import { Tabs } from "@/shared/components/ui/Tabs";
import { PostCard } from "@/features/post/components/PostCard";
import { useMyPosts } from "@/features/post/hooks/usePosts";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { PostStatus } from "@/shared/types/common.types";

type Filter = PostStatus | "ALL";

export default function MyPostsPage() {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyPosts();
  const [tab, setTab] = useState<Filter>("ALL");
  const allPosts = data?.pages.flatMap((p) => p.content) ?? [];
  const list = allPosts.filter((p) => tab === "ALL" || p.status === tab);

  const sentinelRef = useInfiniteScroll(
    () => void fetchNextPage(),
    !!hasNextPage && !isFetchingNextPage,
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        title={t("myPosts.title")}
        description={t("myPosts.description")}
        actions={
          <Link to={ROUTES.POST_CREATE}>
            <Button>
              <Plus className="size-4" /> {t("myPosts.newPost")}
            </Button>
          </Link>
        }
      />
      <Tabs<Filter>
        value={tab}
        onChange={setTab}
        items={[
          { value: "ALL", label: t("myPosts.tabAll") },
          { value: "DRAFT", label: t("myPosts.tabDraft") },
          { value: "PUBLISHED", label: t("myPosts.tabPublished") },
          { value: "PENDING", label: t("myPosts.tabPending") },
          { value: "CLOSED", label: t("myPosts.tabClosed") },
        ]}
      />
      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : list.length === 0 && !hasNextPage ? (
        <EmptyState
          title={t("myPosts.emptyTitle")}
          action={
            <Link to={ROUTES.POST_CREATE}>
              <Button>{t("myPosts.createFirst")}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <PostCard key={p.id} post={p} mine />
            ))}
          </div>

          {/* Sentinel: chạm vào viewport thì tải trang kế tiếp */}
          {hasNextPage && <div ref={sentinelRef} className="h-1" />}

          {isFetchingNextPage && <CardGridSkeleton count={3} />}
        </>
      )}
    </div>
  );
}
