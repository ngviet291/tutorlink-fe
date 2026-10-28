import { useState } from 'react'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations, useApplicationsByPost } from '../hooks/useApplications'
import { AiTop5Panel } from './AiTop5Panel'
import { ApplicantRow } from './ApplicantRow'
import type { ApplicationResponse } from '../types/application.types'
import type { PostResponse } from '@/features/post/types/post.types'

/** Dành cho tác giả bài: panel AI Top 5 + danh sách đầy đủ + chọn ứng viên. */
export function ApplicantList({ post }: { post: PostResponse }) {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useApplicationsByPost(post.id, true)
  const { select } = useApplicationMutations()
  const [target, setTarget] = useState<ApplicationResponse | null>(null)

  const hasAccepted = data?.some((a) => a.status === 'ACCEPTED') ?? false
  const canSelect = post.status === 'PUBLISHED' && !hasAccepted
  const pending = data?.filter((a) => a.status === 'PENDING').length ?? 0

  const confirm = () => {
    if (!target) return
    select.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Đã chọn ${target.applicant.fullName}. Chờ gia sư thanh toán phí nhận lớp.`)
        setTarget(null)
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <AiTop5Panel postId={post.id} canSelect={canSelect} onSelect={setTarget} pendingCount={pending} />

      <section aria-labelledby="all-applicants">
        <h2 id="all-applicants" className="mb-3 text-lg font-extrabold text-text">Tất cả ứng viên {data ? `(${data.length})` : ''}</h2>
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data && data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {data.map((a) => <ApplicantRow key={a.id} application={a} canSelect={canSelect} onSelect={setTarget} />)}
          </ul>
        ) : (
          <EmptyState title="Chưa có ai đăng ký" description="Hãy chia sẻ bài đăng để nhận thêm ứng viên." />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Chọn ứng viên này?"
        confirmText="Chọn ứng viên"
        loading={select.isPending}
        onConfirm={confirm}
        description={
          <>
            Bạn chọn <strong>{target?.applicant.fullName}</strong>. Các ứng viên khác sẽ bị từ chối. Gia sư cần thanh toán phí nhận lớp thì thông tin liên hệ mới được mở khóa.
            Nếu gia sư từ chối hoặc quá hạn, bạn có thể chọn lại ứng viên khác.
          </>
        }
      />
    </div>
  )
}
