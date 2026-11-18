import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { ROUTES } from '@/constants/routes'
import { getErrorMessage } from '@/shared/utils/errors'
import { useToast } from '@/shared/hooks/useToast'
import { applicationService } from '@/config/di/container'
import { formatVnd } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { RatingStars } from '@/shared/components/ui/RatingStars'
import { reviewService } from '@/features/review/service/review.service'
import { useAdminMutations, useComplaints } from '@/features/admin/hooks/useAdmin'
import type { ComplaintDto, ComplaintStatus } from '@/features/admin/service/admin.complaints.service'
const labels = { PENDING: 'Chờ xử lý', APPROVED: 'Đã chấp nhận', REJECTED: 'Đã từ chối' };
export default function AdminComplaintsPage() {
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const { data, isLoading, isError, refetch } = useComplaints(status || undefined);
  const { decideComplaint } = useAdminMutations();
  const [target, setTarget] = useState<ComplaintDto | null>(null);
  const appQuery = useQuery({
    queryKey: ['admin', 'complaint-application', target?.applicationId],
    queryFn: () => applicationService.getApplicationById(target!.applicationId!),
    enabled: Boolean(target?.applicationId),
  });
  const reviewQuery = useQuery({
    queryKey: ['admin', 'complaint-review', target?.reviewId],
    queryFn: () => reviewService.getReviewById(target!.reviewId),
    enabled: Boolean(target?.reviewId),
  });
  const app = appQuery.data;
  const review = reviewQuery.data;
  const toast = useToast();
  const resolve = (status: 'APPROVED' | 'REJECTED') => {
    if (!target) return;
    decideComplaint.mutate({ complaintId: target.id, status }, {
      onSuccess: () => { toast.success('Đã cập nhật trạng thái khiếu nại'); setTarget(null); },
      onError: e => toast.error(getErrorMessage(e)) });
  };
  return <div className="mx-auto flex max-w-4xl flex-col gap-5">
    <PageHeader title="Xử lý khiếu nại đánh giá" />
    <Select aria-label="Trạng thái khiếu nại" placeholder="Tất cả trạng thái" value={status} onChange={e => setStatus(e.target.value as ComplaintStatus | '')}
      options={Object.entries(labels).map(([value,label]) => ({value,label}))} />
    {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? <EmptyState title="Không có khiếu nại" /> :
      <ul className="flex flex-col gap-3">{data.map(c => <li key={c.id} className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-bold">{labels[c.status]}</p>
        <Link to={ROUTES.TUTOR_DETAIL(c.tutorId)} className="text-primary">
          Gia sư: {c.tutorName ?? c.tutorId}
        </Link>
        <p className="text-sm">Mã đánh giá: {c.reviewId}</p>
        <p className="my-2">Lý do: {c.reason}</p>
        {c.status === 'PENDING' && <Button size="sm" onClick={() => setTarget(c)}>Xem xét</Button>}
      </li>)}</ul>}
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="Chi tiết khiếu nại"
      footer={<><Button variant="outline" loading={decideComplaint.isPending} onClick={() => resolve('REJECTED')}>Từ chối</Button><Button loading={decideComplaint.isPending} onClick={() => resolve('APPROVED')}>Chấp nhận</Button></>}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
        <section>
          <h3 className="mb-2 font-bold">Khiếu nại</h3>
          <p>{target?.reason}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {labels[target?.status ?? 'PENDING']}{target?.createdAt ? ` · ${formatDate(target.createdAt)}` : ''}
          </p>
        </section>
        <section>
          <h3 className="mb-2 font-bold">Đánh giá bị khiếu nại</h3>
          {reviewQuery.isLoading ? <p className="text-text-secondary">Đang tải đánh giá...</p> : review ? (
            <div>
              <div className="flex items-center gap-2">
                <RatingStars value={review.rating} />
                <span className="text-xs text-text-secondary">{review.student.fullName}{review.createdAt ? ` · ${formatDate(review.createdAt)}` : ''}</span>
              </div>
              {review.comment && <p className="mt-2">{review.comment}</p>}
            </div>
          ) : <p className="text-text-secondary">Không tải được đánh giá.</p>}
        </section>
        <section>
          <h3 className="mb-2 font-bold">Đơn ứng tuyển</h3>
          {appQuery.isLoading ? <p className="text-text-secondary">Đang tải đơn ứng tuyển...</p> : app ? (
            <div className="flex flex-col gap-1.5">
              <p className="font-bold">{app.post.title}</p>
              <p className="text-xs text-text-secondary">
                {app.post.type === 'FIND_TUTOR' ? 'Tìm gia sư' : 'Tìm học viên'} · Trạng thái: {app.applicationStatus}{app.paid ? ' · Đã thanh toán' : ''}
              </p>
              <p className="text-xs text-text-secondary">Học viên: {app.student.fullName} — Gia sư: {app.tutor.fullName}</p>
              {app.message && <p className="text-xs">Lời nhắn: {app.message}</p>}
              {app.proposedFee != null && <p className="text-xs font-semibold text-primary">Phí đề xuất: {formatVnd(app.proposedFee)}</p>}
            </div>
          ) : <p className="text-text-secondary">Không tải được đơn ứng tuyển.</p>}
        </section>
        {app && (
          <section>
            <h3 className="mb-2 font-bold">Tiến trình</h3>
            <ol className="flex flex-col gap-1.5">
              <li>• Ứng tuyển{app.appliedAt ? ` — ${formatDate(app.appliedAt)}` : ''}</li>
              {app.selectedAt && <li>• Được chọn — {formatDate(app.selectedAt)}</li>}
              {app.paid
                ? <li>• Thanh toán phí{app.paidAt ? ` — ${formatDate(app.paidAt)}` : ''}</li>
                : <li>• Chưa thanh toán{app.expiresAt ? ` (hạn ${formatDate(app.expiresAt)})` : ''}</li>}
              {review?.createdAt && <li>• Đánh giá — {formatDate(review.createdAt)}</li>}
              {target?.createdAt && <li>• Khiếu nại — {formatDate(target.createdAt)}</li>}
            </ol>
          </section>
        )}
        <p className="text-xs text-text-secondary">Thao tác cập nhật trạng thái khiếu nại. Đánh giá không bị xóa.</p>
      </div>
    </Modal>
  </div>;
}
