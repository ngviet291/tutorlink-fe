import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatVnd } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useMyApplications, useApplicationMutations } from '../hooks/useApplications'
import type { ApplicationResponse } from '../types/application.types'

interface Props {
  onPay: (a: ApplicationResponse) => void
}

export function OfferList({ onPay }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { data, isLoading } = useMyApplications()
  const { decline } = useApplicationMutations()

  const offers = data?.filter((a) => a.applicationStatus === 'ACCEPTED') ?? []

  if (isLoading) return <Skeleton className="h-24 w-full" />
  if (!offers.length) return null

  const handleDecline = (id: string) => {
    decline.mutate(id, {
      onSuccess: () => toast.success(t('application.declineSuccess')),
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <h2 className="mb-3 flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-200">
        <CheckCircle className="size-5" />
        {t('application.offersTitle', { count: offers.length })}
      </h2>
      <p className="mb-4 text-xs text-amber-800 dark:text-amber-300">{t('application.offersDesc')}</p>
      <ul className="flex flex-col gap-3">
        {offers.map((a) => (
          <li
            key={a.id}
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-500/30 dark:bg-surface sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-bold text-text">{a.post.title}</p>
              <p className="text-xs text-text-secondary">
                {t('application.offeredBy', { name: a.student.fullName })} · {formatDate(a.appliedAt)}
              </p>
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
              <Button size="sm" onClick={() => onPay(a)}>
                <CheckCircle className="size-4" /> {t('application.payAndConnect')}
              </Button>
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
