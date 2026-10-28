import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { SubjectTag } from '@/shared/components/ui/SubjectTag'
import { Textarea } from '@/shared/components/ui/Textarea'
import { formatVnd } from '@/shared/utils/currency'
import { getErrorMessage } from '@/shared/utils/errors'
import { useToast } from '@/shared/hooks/useToast'
import { useAdminMutations, usePendingTutors } from '@/features/admin/hooks/useAdmin'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'

export default function AdminTutorReviewPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = usePendingTutors()
  const { reviewTutor } = useAdminMutations()
  const [detail, setDetail] = useState<TutorResponse | null>(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  const close = () => { setDetail(null); setNote(''); setNoteError('') }

  const decide = (decision: 'APPROVED' | 'REJECTED') => {
    if (!detail) return
    if (decision === 'REJECTED' && note.trim().length < 5) {
      setNoteError('Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)')
      return
    }
    reviewTutor.mutate(
      { id: detail.id, payload: { decision, note: note.trim() || undefined } },
      {
        onSuccess: () => { toast.success(decision === 'APPROVED' ? 'Đã duyệt hồ sơ' : 'Đã từ chối hồ sơ'); close() },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader title="Duyệt hồ sơ gia sư" description="Hồ sơ ở trạng thái Chờ duyệt." />
      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState title="Không có hồ sơ nào chờ duyệt" />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
              <Avatar name={t.fullName} src={t.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text">{t.fullName}</p>
                <p className="text-xs text-text-secondary">{t.experienceYears} năm KN · {formatVnd(t.hourlyRate)}/giờ</p>
                <div className="mt-1 flex flex-wrap gap-1">{t.subjects.length ? t.subjects.map((s) => <SubjectTag key={s.id} name={s.name} />) : <span className="text-xs text-text-secondary">Chưa chọn môn</span>}</div>
              </div>
              <Button variant="outline" onClick={() => setDetail(t)}>Xem & duyệt</Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(detail)} onClose={close} title={`Hồ sơ: ${detail?.fullName ?? ''}`} size="lg"
        footer={
          <>
            <Button variant="danger" loading={reviewTutor.isPending} onClick={() => decide('REJECTED')}><X className="size-4" /> Từ chối</Button>
            <Button loading={reviewTutor.isPending} onClick={() => decide('APPROVED')}><Check className="size-4" /> Duyệt</Button>
          </>
        }
      >
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-text-secondary">Học vấn</dt><dd className="font-semibold text-text">{detail.education || '—'}</dd></div>
              <div><dt className="text-xs text-text-secondary">Khu vực</dt><dd className="font-semibold text-text">{[detail.district, detail.city].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt className="text-xs text-text-secondary">Kinh nghiệm</dt><dd className="font-semibold text-text">{detail.experienceYears} năm</dd></div>
              <div><dt className="text-xs text-text-secondary">Giá / giờ</dt><dd className="font-semibold text-text">{formatVnd(detail.hourlyRate)}</dd></div>
            </dl>
            <div><p className="text-xs text-text-secondary">Giới thiệu</p><p className="text-text">{detail.bio || '—'}</p></div>
            <div>
              <p className="text-xs text-text-secondary">Chứng chỉ</p>
              {detail.certificates.length ? <ul className="list-disc pl-5 text-text">{detail.certificates.map((c) => <li key={c.id}>{c.name} — {c.issuer} ({c.year})</li>)}</ul> : <p className="text-text">Chưa có</p>}
            </div>
            <Link to={ROUTES.TUTOR_DETAIL(detail.id)} className="text-xs font-semibold text-primary hover:underline" onClick={close}>Mở trang hồ sơ công khai</Link>
            <Textarea label="Ghi chú cho gia sư" value={note} onChange={(e) => { setNote(e.target.value); setNoteError('') }} error={noteError} hint="Bắt buộc khi từ chối; gia sư sẽ thấy ghi chú này." />
          </div>
        )}
      </Modal>
    </div>
  )
}
