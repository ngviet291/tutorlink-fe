import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  FilterSidebar,
  emptyFilter,
  budgetQuery,
  type FilterValues,
} from "@/shared/components/ui/FilterSidebar";
import { Input } from "@/shared/components/ui/Input";
import { CardGridSkeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Segmented } from "@/shared/components/ui/Tabs";
import { PostCard } from "@/features/post/components/PostCard";
import { usePosts } from "@/features/post/hooks/usePosts";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import type { PostType } from "@/shared/types/common.types";
import type { PostFilter } from "@/features/post/types/post.types";
import { useSearchTracking } from "@/features/tracking/hooks";
import { RecommendedPosts } from "@/features/post/components/RecommendedPosts";

const BUDGET_MAX = 10_000_000;

export default function FindClassPage() {
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isTutor = role === "TUTOR";
  const isStudent = !role || role === "STUDENT";
  const defaultType: PostType = isStudent ? "FIND_STUDENT" : "FIND_TUTOR";
  const [picked, setPicked] = useState<PostType | null>(null);
  const lockedType: PostType | null = isTutor
    ? "FIND_TUTOR"
    : isStudent
      ? "FIND_STUDENT"
      : null;
  const type: PostType = lockedType ?? picked ?? defaultType;
  const typeItems: { value: PostType; label: string }[] = [
    { value: "FIND_TUTOR", label: t("findClass.typeFindTutor") },
    { value: "FIND_STUDENT", label: t("findClass.typeFindStudent") },
  ];
  if (defaultType === "FIND_STUDENT") typeItems.reverse();
  const [filter, setFilter] = useState<FilterValues>(emptyFilter(BUDGET_MAX));
  const [keyword, setKeyword] = useState("");
  const debounced = useDebounce(keyword);
  const { data: subjects } = useSubjects();
  const subjectName = useMemo(
    () => subjects?.find((s) => s.id === filter.subjectId)?.name,
    [subjects, filter.subjectId],
  );

  const query = useMemo<PostFilter>(
    () => ({
      type,
      keyword: debounced || undefined,
      subjectName: subjectName || undefined,
      province: filter.province || undefined,
      ward: filter.ward || undefined,
      teachingMode: filter.teachingMode || undefined,
      educationLevel: filter.educationLevels[0] || undefined,
      ...budgetQuery(filter),
      limit: 12,
    }),
    [type, debounced, subjectName, filter],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePosts(query);

  const items = data?.pages.flatMap((p) => p.content) ?? [];

  const sentinelRef = useInfiniteScroll(
    () => void fetchNextPage(),
    !!hasNextPage && !isFetchingNextPage,
  );

  const hasSearch = Boolean(
    debounced ||
    filter.subjectId ||
    filter.province ||
    filter.ward ||
    filter.teachingMode ||
    filter.educationLevels.length ||
    filter.budgetUnit,
  );
  useSearchTracking({
    active: hasSearch,
    ready: !isFetching && !isError,
    key: JSON.stringify(query),
    query: debounced,
    filters: {
      type,
      subjectName: query.subjectName,
      province: query.province,
      teachingMode: query.teachingMode,
      educationLevel: query.educationLevel,
      minBudget: query.minBudget,
      maxBudget: query.maxBudget,
    },
    resultCount: items.length,
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">
        {isStudent ? t("findClass.titleStudent") : t("findClass.titleTutor")}
      </h1>
      <p className="mt-1 text-text-secondary">{t("findClass.subtitle")}</p>
      {!lockedType && (
        <div className="mt-5">
          <Segmented value={type} onChange={setPicked} items={typeItems} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar
          value={filter}
          onChange={setFilter}
          rangeLabel={t("findClass.tuitionRange")}
          rangeMax={BUDGET_MAX}
          budgetUnitMode
        />

        <div className="min-w-0 flex-1">
          <Input
            aria-label={t("findClass.searchAria")}
            placeholder={t("findClass.searchPlaceholder")}
            leftIcon={<Search className="size-4" />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <div className="mt-4" aria-busy={isLoading || isFetchingNextPage}>
            {isLoading ? (
              <CardGridSkeleton />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : items.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-text-secondary">
                  {t("findClass.postCount", { count: items.length })}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
                {hasNextPage && <div ref={sentinelRef} className="mt-8 h-1" aria-hidden />}
                {isFetchingNextPage && <CardGridSkeleton />}
              </>
            ) : (
              <EmptyState
                title={t("findClass.emptyTitle")}
                description={t("findClass.emptyDescription")}
              />
            )}
          </div>
        </div>

        {role && !hasSearch && (
          <aside className="min-w-0 lg:w-64 lg:shrink-0 xl:w-72">
            <RecommendedPosts />
          </aside>
        )}
      </div>
    </div>
  );
}
