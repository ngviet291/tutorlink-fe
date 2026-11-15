import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate } from '@/shared/utils/date'
import { OfferList } from '@/features/application/components/OfferList'
import { ExpiryCountdown } from '@/features/application/components/ExpiryCountdown'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations, useMyApplications } from '@/features/application/hooks/useApplications'
import { isApplicant, isFeePayer } from '@/features/application/util/applicant'
import type { RootState } from '@/app/store'
import type { ApplicationResponse } from '@/features/application/types/application.types'
import { PayFeeModal } from '@/features/wallet/components/PayFeeModal'

export default function MyApplicationsPage() {
  const { data, isLoading, isError, refetch } = useMyApplications()
  const toast = useToast()
  const user = useSelector((state: RootState) => state.auth.user)
  const { finish, confirm } = useApplicationMutations()
  const [offer, setOffer] = useState<ApplicationResponse | null>(null)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Đơn đã ứng tuyển"
        description={
          user?.role === 'TUTOR'
            ? 'Theo dõi trạng thái các lớp bạn đăng ký và thanh toán phí nhận lớp khi được chọn.'
            : 'Theo dõi trạng thái các lớp bạn đã đăng ký.'
        }
      />
      {user?.role === 'TUTOR' && <OfferList onPay={setOffer} />}
    
      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState title="Bạn chưa đăng ký lớp nào" action={<Link to={ROUTES.FIND_CLASS}><Button>Tìm lớp ngay</Button></Link>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link to={ROUTES.POST_DETAIL(a.post.id)} state={{mine:true}} className="block truncate font-bold text-text hover:text-primary">{a.post.title}</Link>
                <p className="mt-0.5 text-xs text-text-secondary">Đăng ký ngày {formatDate(a.appliedAt)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge kind="application" status={a.applicationStatus} />
                {/* Đơn ACCEPTED có expiresAt do BE tính: chưa trả -> hạn thanh toán (W1), đã trả -> hạn applicant confirm (W2) */}
                {a.applicationStatus === 'ACCEPTED' && a.expiresAt && (
                  <ExpiryCountdown expiresAt={a.expiresAt} actionLabel={a.paid || !isFeePayer(a, user?.id) ? 'xác nhận' : 'thanh toán'} onExpire={() => void refetch()} />
                )}
                {a.applicationStatus === 'ACCEPTED' && !a.paid && isFeePayer(a, user?.id) && <Button size="sm" onClick={() => setOffer(a)}>Thanh toán phí</Button>}
                {a.applicationStatus === 'ACCEPTED' && a.paid && isApplicant(a, user?.id) && <Button size="sm" loading={confirm.isPending && confirm.variables === a.id} onClick={() => confirm.mutate(a.id, { onSuccess: () => toast.success('Đã xác nhận'), onError: (e) => toast.error(getErrorMessage(e)) })}>Xác nhận</Button>}
                {a.applicationStatus === 'CONFIRMED' && <Button size="sm" variant="outline" loading={finish.isPending && finish.variables === a.id} onClick={() => finish.mutate(a.id, { onSuccess: () => toast.success('Đã đánh dấu hoàn thành'), onError: (e) => toast.error(getErrorMessage(e)) })}>Hoàn thành lớp</Button>}
                {a.applicationStatus === 'FINISHED' && <Link to={ROUTES.CHAT_WITH(a.post.author.id)}><Button size="sm" variant="secondary">Mở chat</Button></Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  )
}
