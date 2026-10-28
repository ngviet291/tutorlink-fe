import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { FilterSidebar, emptyFilter, type FilterValues } from '@/shared/components/ui/FilterSidebar'
import { Input } from '@/shared/components/ui/Input'
import { Pagination } from '@/shared/components/ui/Pagination'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { TutorCard } from '@/features/tutor/components/TutorCard'
import { useTutors } from '@/features/tutor/hooks/useTutors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { TutorFilter } from '@/features/tutor/types/tutor.types'

const RATE_MAX = 500_000

export default function FindTutorPage() {
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<FilterValues>({ ...emptyFilter(RATE_MAX), subjectId: params.get('subject') ?? '' })
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(keyword)

  const query = useMemo<TutorFilter>(
    () => ({
      keyword: debounced || undefined,
      subjectId: filter.subjectId || undefined,
      city: filter.city || undefined,
      teachingMode: filter.teachingMode,
      minRate: filter.min > 0 ? filter.min : undefined,
      maxRate: filter.max < RATE_MAX ? filter.max : undefined,
      educationLevels: filter.educationLevels,
      page,
      pageSize: 9,
    }),
    [debounced, filter, page],
  )
  const { data, isLoading, isError, refetch, isFetching } = useTutors(query)

  const onFilter = (v: FilterValues) => {
    setFilter(v)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">Tìm Gia Sư</h1>
      <p className="mt-1 text-text-secondary">Chỉ hiển thị hồ sơ gia sư đã được Admin duyệt. Thông tin liên hệ được mở sau khi kết nối.</p>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar value={filter} onChange={onFilter} rangeLabel="Giá theo giờ (VNĐ)" rangeMax={RATE_MAX} rangeStep={10_000} />

        <div className="min-w-0 flex-1">
          <Input
            aria-label="Tìm kiếm gia sư"
            placeholder="Tìm theo tên, môn học, giới thiệu..."
            leftIcon={<Search className="size-4" />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
          />

          <div className="mt-4" aria-busy={isFetching}>
            {isLoading ? (
              <CardGridSkeleton />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : data && data.items.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-text-secondary">{data.totalItems} gia sư phù hợp</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((t) => <TutorCard key={t.id} tutor={t} />)}
                </div>
                <div className="mt-8"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>
              </>
            ) : (
              <EmptyState title="Không tìm thấy gia sư phù hợp" description="Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm." />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
