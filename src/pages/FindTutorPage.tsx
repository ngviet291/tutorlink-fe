import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { FilterSidebar, emptyFilter, type FilterValues } from '@/shared/components/ui/FilterSidebar'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { TutorCard } from '@/features/tutor/components/TutorCard'
import { useTutors } from '@/features/tutor/hooks/useTutors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import type { TutorFilter } from '@/features/tutor/types/tutor.types'
import { useSearchTracking } from '@/features/tracking/hooks'

const RATE_MAX = 500_000;

export default function FindTutorPage() {
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
      subjectName: subjectName || debounced || undefined,
      province: filter.province || undefined,
      minRate: filter.min > 0 ? filter.min : undefined,
      maxRate: filter.max < RATE_MAX ? filter.max : undefined,
      limit: 12,
    }),
    [subjectName, debounced, filter],
  );

  const { data, isLoading, isFetching, isError, refetch, isFetchingNextPage, hasNextPage, fetchNextPage } = useTutors(query)
  const items = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.items.length !== undefined
    ? data!.pages.reduce((s, p) => s + p.items.length, 0)
    : 0

  const onFilter = (v: FilterValues) => setFilter(v);

    const hasSearch = Boolean(debounced || filter.subjectId || filter.province || filter.min > 0 || filter.max < RATE_MAX)
    useSearchTracking({
      active: hasSearch,
      ready: !isFetching && !isError,
      key: JSON.stringify(query),
      query: debounced,
      filters: { subject: subjectName, province: query.province, minRate: query.minRate, maxRate: query.maxRate },
      resultCount: items.length,
    })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">Tìm Gia Sư</h1>
      <p className="mt-1 text-text-secondary">
        Chỉ hiển thị hồ sơ gia sư đã được Admin duyệt. Thông tin liên hệ được mở
        sau khi kết nối.
      </p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar
          value={filter}
          onChange={onFilter}
          rangeLabel="Giá theo giờ (VNĐ)"
          rangeMax={RATE_MAX}
          rangeStep={10_000}
        />

        <div className="min-w-0 flex-1">
          <Input
            aria-label="Tìm kiếm gia sư"
            placeholder="Tìm theo tên, môn học, giới thiệu..."
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
                  {total} gia sư phù hợp
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((t) => (
                    <TutorCard key={t.id} tutor={t} />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      loading={isFetchingNextPage}
                      onClick={() => void fetchNextPage()}
                    >
                      Xem thêm
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Không tìm thấy gia sư phù hợp"
                description="Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
