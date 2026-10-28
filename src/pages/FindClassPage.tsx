import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { FilterSidebar, emptyFilter, type FilterValues } from '@/shared/components/ui/FilterSidebar'
import { Input } from '@/shared/components/ui/Input'
import { Pagination } from '@/shared/components/ui/Pagination'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Segmented } from '@/shared/components/ui/Tabs'
import { PostCard } from '@/features/post/components/PostCard'
import { usePosts } from '@/features/post/hooks/usePosts'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { PostType } from '@/shared/types/common.types'
import type { PostFilter } from '@/features/post/types/post.types'

const BUDGET_MAX = 10_000_000

export default function FindClassPage() {
  const [type, setType] = useState<PostType>('FIND_TUTOR')
  const [filter, setFilter] = useState<FilterValues>(emptyFilter(BUDGET_MAX))
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(keyword)

  const query = useMemo<PostFilter>(
    () => ({
      type,
      keyword: debounced || undefined,
      subjectId: filter.subjectId || undefined,
      city: filter.city || undefined,
      teachingMode: filter.teachingMode,
      educationLevels: filter.educationLevels,
      minBudget: filter.min > 0 ? filter.min : undefined,
      maxBudget: filter.max < BUDGET_MAX ? filter.max : undefined,
      page,
      pageSize: 9,
    }),
    [type, debounced, filter, page],
  )
  const { data, isLoading, isError, refetch, isFetching } = usePosts(query)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">Tìm Lớp</h1>
      <p className="mt-1 text-text-secondary">Các bài đăng đang tuyển. Thông tin liên hệ của người đăng được ẩn cho tới khi kết nối thành công.</p>

      <div className="mt-5">
        <Segmented
          value={type}
          onChange={(v) => { setType(v); setPage(1) }}
          items={[
            { value: 'FIND_TUTOR', label: 'Lớp cần gia sư' },
            { value: 'FIND_STUDENT', label: 'Gia sư tìm học viên' },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1) }}
          rangeLabel="Học phí / tháng (VNĐ)"
          rangeMax={BUDGET_MAX}
          rangeStep={100_000}
        />

        <div className="min-w-0 flex-1">
          <Input
            aria-label="Tìm kiếm bài đăng"
            placeholder="Tìm theo tiêu đề, nội dung, môn học..."
            leftIcon={<Search className="size-4" />}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />

          <div className="mt-4" aria-busy={isFetching}>
            {isLoading ? (
              <CardGridSkeleton />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : data && data.items.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-text-secondary">{data.totalItems} bài đăng</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
                <div className="mt-8"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>
              </>
            ) : (
              <EmptyState title="Chưa có bài đăng phù hợp" description="Thử thay đổi bộ lọc hoặc quay lại sau." />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
