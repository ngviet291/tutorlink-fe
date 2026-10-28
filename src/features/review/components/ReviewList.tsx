import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { formatDate } from '@/shared/utils/date'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useTutorReviews } from '../hooks/useReviews'
import { ComplaintModal } from './ComplaintModal'
import type { ReviewResponse } from '../types/review.types'

export function ReviewList({ tutorId }: { tutorId: string }) {
  const user = useAppSelector((s) => s.auth.user)
  const { data, isLoading } = useTutorReviews(tutorId)
  const [target, setTarget] = useState<ReviewResponse | null>(null)
  const isOwner = user?.id === tutorId

  if (isLoading) return <ListSkeleton rows={3} />
  if (!data?.length) return <EmptyState title="Chưa có đánh giá" description="Đánh giá sẽ xuất hiện sau khi lớp học kết thúc." />

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <Avatar name={r.student.fullName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-text">{r.student.fullName}</span>
                  {r.createdAt && <span className="text-xs text-text-secondary">{formatDate(r.createdAt)}</span>}
                  {r.complaintStatus === 'OPEN' && <Badge tone="yellow">Đang bị khiếu nại</Badge>}
                  {r.complaintStatus === 'RESOLVED' && <Badge tone="green">Admin đã giữ lại</Badge>}
                </div>
                <RatingStars value={r.rating} showValue={false} />
                <p className="mt-1 text-sm text-text-secondary">{r.comment}</p>
                {r.complaintDecisionNote && (
                  <p className="mt-2 rounded-lg bg-surface-hover p-2 text-xs text-text-secondary">Kết quả xử lý: {r.complaintDecisionNote}</p>
                )}
              </div>
              {isOwner && (!r.complaintStatus || r.complaintStatus === 'NONE') && (
                <Button variant="ghost" size="sm" onClick={() => setTarget(r)}>
                  <Flag className="size-4" /> Khiếu nại
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ComplaintModal review={target} onClose={() => setTarget(null)} />
    </>
  )
}
