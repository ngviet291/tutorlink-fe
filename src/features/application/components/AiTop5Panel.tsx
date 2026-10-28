import { Brain, Info, RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { useAiTop5 } from '../hooks/useApplications'
import { ApplicantRow } from './ApplicantRow'
import type { ApplicationResponse } from '../types/application.types'

interface Props {
  postId: string
  canSelect: boolean
  onSelect: (a: ApplicationResponse) => void
  /** Số lượt đăng ký còn PENDING — nếu 0 thì không gọi AI */
  pendingCount: number
}

export function AiTop5Panel({ postId, canSelect, onSelect, pendingCount }: Props) {
  const { data, isLoading, isError, refetch, isFetching } = useAiTop5(postId, pendingCount > 0)
  const fallback = data?.source === 'RULE_BASED'

  return (
    <section aria-labelledby="ai-top5" className="rounded-3xl border-2 border-primary/30 bg-primary-light/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Brain className="size-6 text-primary" />
        <h2 id="ai-top5" className="text-lg font-extrabold text-text">AI gợi ý Top 5</h2>
        {data && (fallback ? <Badge tone="yellow">Gợi ý theo quy tắc</Badge> : <Badge tone="orange">Gợi ý bởi AI</Badge>)}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void refetch()} loading={isFetching && !isLoading} aria-label="Làm mới gợi ý">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-text-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        Chỉ mang tính tham khảo. Điểm được tính theo môn học, khu vực, lịch dạy, kinh nghiệm và đánh giá (đồng điểm ưu tiên đăng ký sớm). Bạn có thể chọn bất kỳ ứng viên nào.
      </p>

      {fallback && (
        <p role="status" className="mb-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Dịch vụ AI tạm thời không khả dụng — đang hiển thị bảng điểm theo quy tắc.
        </p>
      )}

      {pendingCount === 0 ? (
        <EmptyState title="Chưa có ứng viên để gợi ý" description="Gợi ý sẽ xuất hiện khi có lượt đăng ký đang chờ." />
      ) : isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState message="Không thể tải gợi ý. Bạn vẫn có thể chọn từ danh sách đầy đủ bên dưới." onRetry={() => void refetch()} />
      ) : (
        <ol className="flex flex-col gap-3">
          {data?.items.map((a) => <ApplicantRow key={a.id} application={a} canSelect={canSelect} onSelect={onSelect} showAi />)}
        </ol>
      )}
    </section>
  )
}
