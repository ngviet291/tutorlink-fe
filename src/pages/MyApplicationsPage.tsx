import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate } from '@/shared/utils/date'
import { OfferList } from '@/features/application/components/OfferList'
import { useMyApplications } from '@/features/application/hooks/useApplications'
import type { ApplicationResponse } from '@/features/application/types/application.types'
import { PayFeeModal } from '@/features/wallet/components/PayFeeModal'

export default function MyApplicationsPage() {
  const { data, isLoading, isError, refetch } = useMyApplications()
  const [offer, setOffer] = useState<ApplicationResponse | null>(null)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Đơn đã ứng tuyển" description="Theo dõi trạng thái các lớp bạn đăng ký và thanh toán phí nhận lớp khi được chọn." />
      <OfferList onPay={setOffer} />

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState title="Bạn chưa đăng ký lớp nào" action={<Link to={ROUTES.FIND_CLASS}><Button>Tìm lớp ngay</Button></Link>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link to={ROUTES.POST_DETAIL(a.post.id)} className="block truncate font-bold text-text hover:text-primary">{a.post.title}</Link>
                <p className="mt-0.5 text-xs text-text-secondary">Đăng ký ngày {formatDate(a.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge kind="application" status={a.status} />
                {a.awaitingPayment && <Button size="sm" onClick={() => setOffer(a)}>Thanh toán phí</Button>}
                {a.paid && <Link to={ROUTES.CHAT(a.id)}><Button size="sm" variant="secondary">Mở chat</Button></Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  )
}
