import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  FilterSidebar,
  emptyFilter,
  type FilterValues,
} from "@/shared/components/ui/FilterSidebar";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { CardGridSkeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { TutorCard } from "@/features/tutor/components/TutorCard";
import { useTutors } from "@/features/tutor/hooks/useTutors";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import type { TutorFilter } from "@/features/tutor/types/tutor.types";
import { useSearchTracking } from "@/features/tracking/hooks";

const RATE_MAX = 500_000;

export default function FindTutorPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<FilterValues>({
    ...emptyFilter(RATE_MAX),
    subjectId: params.get("subject") ?? "",
  });
  const [keyword, setKeyword] = useState("");
  const debounced = useDebounce(keyword);
  const subjects = useSubjects();

  const subjectName = useMemo(
    () => subjects.data?.find((s) => s.id === filter.subjectId)?.name,
    [subjects.data, filter.subjectId],
  );

  const query = useMemo<TutorFilter>(
    () => ({
      name: debounced || undefined,
      subjectName: subjectName || undefined,
      province: filter.province || undefined,
      minRate: filter.min > 0 ? filter.min : undefined,
      maxRate: filter.max < RATE_MAX ? filter.max : undefined,
      limit: 12,
    }),
    [subjectName, debounced, filter],
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
  } = useTutors(query);
  const items = data?.pages.flatMap((page) => page.content) ?? [];

  const total = items.length;

  const onFilter = (v: FilterValues) => setFilter(v);

  const hasSearch = Boolean(
    debounced ||
    filter.subjectId ||
    filter.province ||
    filter.min > 0 ||
    filter.max < RATE_MAX,
  );
  useSearchTracking({
    active: hasSearch,
    ready: !isFetching && !isError,
    key: JSON.stringify(query),
    query: debounced,
    filters: {
      subject: subjectName,
      province: query.province,
      minRate: query.minRate,
      maxRate: query.maxRate,
    },
    resultCount: items.length,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">
        {t("findTutor.title")}
      </h1>
      <p className="mt-1 text-text-secondary">{t("findTutor.subtitle")}</p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar
          value={filter}
          onChange={onFilter}
          rangeLabel={t("findTutor.rateRange")}
          rangeMax={RATE_MAX}
          rangeStep={10_000}
          hideWard
          hideTeachingMode
          hideEducationLevels
        />

        <div className="min-w-0 flex-1">
          <Input
            aria-label={t("findTutor.searchAria")}
            placeholder={t("findTutor.searchPlaceholder")}
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
                  {t("findTutor.matchCount", { count: total })}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      loading={isFetchingNextPage}
                      onClick={() => void fetchNextPage()}
                    >
                      {t("findTutor.loadMore")}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={t("findTutor.emptyTitle")}
                description={t("findTutor.emptyDescription")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
