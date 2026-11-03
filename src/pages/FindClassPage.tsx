import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { FilterSidebar, emptyFilter, type FilterValues } from '@/shared/components/ui/FilterSidebar'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { CardGridSkeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Segmented } from '@/shared/components/ui/Tabs'
import { PostCard } from '@/features/post/components/PostCard'
import { usePosts } from '@/features/post/hooks/usePosts'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { PostType } from '@/shared/types/common.types'
import type { PostFilter } from '@/features/post/types/post.types'
import { useSearchTracking } from '@/features/tracking/hooks'

const BUDGET_MAX = 10_000_000

export default function FindClassPage() {
  const [type, setType] = useState<PostType>('FIND_TUTOR')
  const [filter, setFilter] = useState<FilterValues>(emptyFilter(BUDGET_MAX))
  const [keyword, setKeyword] = useState('')
  const debounced = useDebounce(keyword)
  const { data: subjects } = useSubjects()

  // FilterSidebar lưu subjectId (cho UI dropdown), nhưng BE nhận subjectName
  const subjectName = useMemo(
    () => subjects?.find((s) => s.id === filter.subjectId)?.name,
    [subjects, filter.subjectId],
  )

  const query = useMemo<PostFilter>(
    () => ({
      type,
      keyword: debounced || undefined,
      subjectName: subjectName || undefined,
      province: filter.province || undefined,
      teachingMode: filter.teachingMode || undefined,
      // BE nhận single educationLevel — lấy giá trị đầu tiên nếu có
      educationLevel: filter.educationLevels[0] || undefined,
      minBudget: filter.min > 0 ? filter.min : undefined,
      maxBudget: filter.max < BUDGET_MAX ? filter.max : undefined,
      limit: 12,
    }),
    [type, debounced, subjectName, filter],
  )

  const { data, isLoading, isFetching, isError, refetch, isFetchingNextPage, hasNextPage, fetchNextPage } = usePosts(query)

  const items = data?.pages.flatMap((p) => p.content) ?? []

    const hasSearch = Boolean(
      debounced || filter.subjectId || filter.province || filter.teachingMode ||
      filter.educationLevels.length || filter.min > 0 || filter.max < BUDGET_MAX,
    )
    useSearchTracking({
      active: hasSearch,
      ready: !isFetching && !isError,
      key: JSON.stringify(query),
      query: debounced,
      filters: {
        type,
        subjectId: query.subjectId,
        province: query.province,
        teachingMode: query.teachingMode,
        educationLevels: query.educationLevels,
        minBudget: query.minBudget,
        maxBudget: query.maxBudget,
      },
      resultCount: items.length,
    })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-text">Tìm Lớp</h1>
      <p className="mt-1 text-text-secondary">Các bài đăng đang tuyển. Thông tin liên hệ của người đăng được ẩn cho tới khi kết nối thành công.</p>

      <div className="mt-5">
        <Segmented
          value={type}
          onChange={(v) => { setType(v) }}
          items={[
            { value: 'FIND_TUTOR', label: 'Lớp cần gia sư' },
            { value: 'FIND_STUDENT', label: 'Gia sư tìm học viên' },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
        <FilterSidebar
          value={filter}
          onChange={setFilter}
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
            onChange={(e) => setKeyword(e.target.value)}
          />

          <div className="mt-4" aria-busy={isLoading || isFetchingNextPage}>
            {isLoading ? (
              <CardGridSkeleton />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : items.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-text-secondary">{items.length} bài đăng</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                      Xem thêm
                    </Button>
                  </div>
                )}
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
