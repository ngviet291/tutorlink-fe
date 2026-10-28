import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Users } from 'lucide-react'
import { POST_STATUS_META, POST_TYPE_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Pagination } from '@/shared/components/ui/Pagination'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { Textarea } from '@/shared/components/ui/Textarea'
import { formatDate } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useToast } from '@/shared/hooks/useToast'
import { useAdminMutations, useAdminPosts } from '@/features/admin/hooks/useAdmin'
import { useApplicationsByPost } from '@/features/application/hooks/useApplications'
import type { PostResponse } from '@/features/post/types/post.types'
import type { PostStatus } from '@/shared/types/common.types'

function ApplicationsModal({ post, onClose }: { post: PostResponse | null; onClose: () => void }) {
  const { data, isLoading } = useApplicationsByPost(post?.id ?? '', Boolean(post))
  return (
    <Modal open={Boolean(post)} onClose={onClose} title={`Lượt đăng ký: ${post?.title ?? ''}`} size="lg">
      {isLoading ? <ListSkeleton rows={3} /> : !data?.length ? <EmptyState title="Chưa có lượt đăng ký" /> : (
        <ul className="divide-y divide-border">
          {data.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0"><p className="truncate font-semibold text-text">{a.applicant.fullName}</p><p className="text-xs text-text-secondary">{formatDate(a.createdAt)}</p></div>
              <StatusBadge kind="application" status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export default function AdminPostsPage() {
  const toast = useToast()
  const [status, setStatus] = useState<PostStatus | ''>('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAdminPosts({ status, page })
  const { removePost } = useAdminMutations()
  const [target, setTarget] = useState<PostResponse | null>(null)
  const [viewing, setViewing] = useState<PostResponse | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const close = () => { setTarget(null); setReason(''); setReasonError('') }
  const confirm = () => {
    if (!target) return
    if (reason.trim().length < 5) { setReasonError('Vui lòng nhập lý do (tối thiểu 5 ký tự)'); return }
    removePost.mutate({ id: target.id, reason: reason.trim() }, { onSuccess: () => { toast.success('Đã gỡ bài vi phạm'); close() }, onError: (e) => toast.error(getErrorMessage(e)) })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Quản lý bài đăng & lượt đăng ký" />
      <div className="w-56">
        <Select aria-label="Lọc theo trạng thái" placeholder="Tất cả trạng thái" value={status} onChange={(e) => { setStatus(e.target.value as PostStatus | ''); setPage(1) }}
          options={(Object.keys(POST_STATUS_META) as PostStatus[]).map((s) => ({ value: s, label: POST_STATUS_META[s].label }))} />
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.items.length ? <EmptyState title="Không có bài đăng" /> : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link to={ROUTES.POST_DETAIL(p.id)} className="block truncate font-bold text-text hover:text-primary">{p.title}</Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <Badge tone="gray">{POST_TYPE_LABEL[p.type]}</Badge> {p.author.fullName} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge kind="post" status={p.status} />
                  <Button variant="ghost" size="sm" onClick={() => setViewing(p)}><Users className="size-4" /> {p.applicationCount ?? 0}</Button>
                  {p.status !== 'REMOVED' && p.status !== 'CLOSED' && <Button variant="danger" size="sm" onClick={() => setTarget(p)}><Ban className="size-4" /> Gỡ bài</Button>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ApplicationsModal post={viewing} onClose={() => setViewing(null)} />
      <Modal
        open={Boolean(target)} onClose={close} title="Gỡ bài vi phạm" size="sm"
        footer={<><Button variant="ghost" onClick={close}>Hủy</Button><Button variant="danger" loading={removePost.isPending} onClick={confirm}>Gỡ bài</Button></>}
      >
        <p className="mb-3 text-sm text-text-secondary">Bài “{target?.title}” sẽ chuyển sang trạng thái Đã gỡ và người đăng được thông báo.</p>
        <Textarea label="Lý do gỡ" required value={reason} error={reasonError} onChange={(e) => { setReason(e.target.value); setReasonError('') }} />
      </Modal>
    </div>
  )
}
