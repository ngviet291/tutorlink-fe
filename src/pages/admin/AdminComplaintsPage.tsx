import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Textarea } from '@/shared/components/ui/Textarea'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useToast } from '@/shared/hooks/useToast'
import { useAdminMutations, useComplaints } from '@/features/admin/hooks/useAdmin'
import type { ReviewComplaint } from '@/features/admin/types/admin.types'

export default function AdminComplaintsPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useComplaints()
  const { decideComplaint } = useAdminMutations()
  const [target, setTarget] = useState<ReviewComplaint | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const close = () => { setTarget(null); setNote(''); setErr('') }
  const decide = (decision: 'KEPT' | 'REMOVED') => {
    if (!target) return
    if (note.trim().length < 5) { setErr('Vui lòng nhập lý do xử lý (tối thiểu 5 ký tự)'); return }
    decideComplaint.mutate({ reviewId: target.reviewId, payload: { decision, note: note.trim() } }, {
      onSuccess: () => { toast.success(decision === 'REMOVED' ? 'Đã gỡ đánh giá' : 'Đã giữ đánh giá'); close() },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader title="Xử lý khiếu nại đánh giá" />
      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? <EmptyState title="Không có khiếu nại" /> : (
        <ul className="flex flex-col gap-3">
          {data.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={ROUTES.TUTOR_DETAIL(c.tutorId)} className="font-bold text-text hover:text-primary">Gia sư {c.tutorName}</Link>
                {c.status === 'OPEN' ? <Badge tone="yellow">Chờ xử lý</Badge> : <Badge tone="green">Đã xử lý{c.decision === 'REMOVED' ? ' — đã gỡ' : ' — giữ lại'}</Badge>}
                <span className="text-xs text-text-secondary">{formatDate(c.createdAt)}</span>
              </div>
              <div className="mt-2 rounded-xl bg-surface-hover p-3 text-sm"><RatingStars value={c.rating} showValue={false} /><p className="mt-1 text-text-secondary">“{c.reviewComment}”</p></div>
              <p className="mt-2 text-sm text-text"><strong>Lý do khiếu nại:</strong> {c.reason}</p>
              {c.decisionNote && <p className="mt-1 text-xs text-text-secondary">Kết quả: {c.decisionNote}</p>}
              {c.status === 'OPEN' && <div className="mt-3"><Button size="sm" onClick={() => setTarget(c)}>Xem xét</Button></div>}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(target)} onClose={close} title="Xem xét khiếu nại"
        footer={<><Button variant="danger" loading={decideComplaint.isPending} onClick={() => decide('REMOVED')}>Gỡ đánh giá</Button><Button loading={decideComplaint.isPending} onClick={() => decide('KEPT')}>Giữ đánh giá</Button></>}
      >
        <Textarea label="Lý do xử lý" required value={note} error={err} onChange={(e) => { setNote(e.target.value); setErr('') }} hint="Lý do này được lưu và hiển thị cho gia sư." />
      </Modal>
    </div>
  )
}
