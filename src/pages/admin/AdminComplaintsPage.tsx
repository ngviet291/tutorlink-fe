import { useState } from 'react'
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
import { useAdminMutations, useComplaints } from '@/features/admin/hooks/useAdmin'
import type { ComplaintDto, ComplaintStatus } from '@/features/admin/service/admin.complaints.service'
const labels = { PENDING: 'Chờ xử lý', APPROVED: 'Đã chấp nhận', REJECTED: 'Đã từ chối' };
export default function AdminComplaintsPage() {
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const { data, isLoading, isError, refetch } = useComplaints(status || undefined);
  const { decideComplaint } = useAdminMutations();
  const [target, setTarget] = useState<ComplaintDto | null>(null);
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
        <Link to={ROUTES.TUTOR_DETAIL(c.tutorId)} className="text-primary">Gia sư: {c.tutorId}</Link>
        <p className="text-sm">Mã đánh giá: {c.reviewId}</p>
        <p className="my-2">Lý do: {c.reason}</p>
        {c.status === 'PENDING' && <Button size="sm" onClick={() => setTarget(c)}>Xem xét</Button>}
      </li>)}</ul>}
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="Xem xét khiếu nại"
      footer={<><Button variant="outline" loading={decideComplaint.isPending} onClick={() => resolve('REJECTED')}>Từ chối</Button><Button loading={decideComplaint.isPending} onClick={() => resolve('APPROVED')}>Chấp nhận</Button></>}>
      <p>{target?.reason}</p><p className="mt-3 text-sm text-text-secondary">Thao tác cập nhật trạng thái khiếu nại. Đánh giá không bị xóa.</p>
    </Modal>
  </div>;
}
