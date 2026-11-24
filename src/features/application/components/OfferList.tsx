import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatVnd } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useMyApplications, useApplicationMutations } from '../hooks/useApplications'
import { ExpiryCountdown } from './ExpiryCountdown'
import { isApplicant, isFeePayer } from '../util/applicant'
import type { ApplicationResponse } from '../types/application.types'

interface Props {
  onPay: (a: ApplicationResponse) => void
}

export function OfferList({ onPay }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data, isLoading, refetch } = useMyApplications()
  const { decline, confirm } = useApplicationMutations()
  const user = useSelector((state: RootState) => state.auth.user)

  const offers = data?.filter((a) => {
    // Chỉ hiển thị đơn ACCEPTED và chưa thanh toán
    // Check cả paid và transactionStatus để chắc chắn
    const isPaid = a.paid || a.transactionStatus === 'SUCCESS';
    const shouldShow = a.applicationStatus === 'ACCEPTED' && !isPaid;
    
    return shouldShow;
  }) ?? [];

  if (isLoading) return <Skeleton className="h-24 w-full" />
  if (!offers.length) return null

  const handleDecline = (id: string) => {
    decline.mutate(id, {
      onSuccess: () => toast.success(t('application.declineSuccess')),
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <section className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-extrabold text-text">
        <CheckCircle className="size-5" />
        {t('application.offersTitle', { count: offers.length })}
      </h2>
      <p className="mb-4 text-xs text-text-secondary">{t('application.offersDesc')}</p>
      <ul className="flex flex-col gap-3">
        {offers.map((a) => (
          <li
            key={a.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-bold text-text">{a.post.title}</p>
              <p className="text-xs text-text-secondary">
                {t('application.offeredBy', { name: a.student.fullName })} · {formatDate(a.appliedAt)}
              </p>
              {/* Hạn cuối do BE tính: chưa trả -> hạn thanh toán (W1), đã trả -> hạn applicant confirm (W2) */}
              {a.paid && isFeePayer(a, user?.id) && (
                <p className="mt-1 text-xs font-semibold text-success-text">
                  Đã thanh toán — chờ học viên xác nhận
                </p>
              )}
              {a.expiresAt && (
                <ExpiryCountdown expiresAt={a.expiresAt} actionLabel={a.paid ? 'học viên xác nhận' : 'thanh toán'} onExpire={() => void refetch()} className="mt-1" />
              )}
              {a.post.minBudget != null && (
                <Badge tone="green" className="mt-1">
                  {formatVnd(a.post.minBudget)}
                  {a.post.maxBudget && a.post.maxBudget !== a.post.minBudget
                    ? ` – ${formatVnd(a.post.maxBudget)}`
                    : ''}{' '}
                  {t('post.perMonth')}
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {!a.paid && isFeePayer(a, user?.id) && (
                <Button size="sm" onClick={() => onPay(a)}>
                  <CheckCircle className="size-4" /> {t('application.payAndConnect')}
                </Button>
              )}
              {a.paid && isApplicant(a, user?.id) && (
                <Button
                  size="sm"
                  loading={confirm.isPending && confirm.variables === a.id}
                  onClick={() =>
                    confirm.mutate(a.id, {
                      onSuccess: () => toast.success('Đã xác nhận'),
                      onError: (e) => toast.error(getErrorMessage(e)),
                    })
                  }
                >
                  <CheckCircle className="size-4" /> Xác nhận
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                loading={decline.isPending}
                onClick={() => handleDecline(a.id)}
              >
                <XCircle className="size-4" /> {t('application.decline')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
