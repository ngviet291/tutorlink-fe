import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatVnd } from '@/shared/utils/currency'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations } from '@/features/application/hooks/useApplications'
import { useFeeQuote, useWallet } from '../hooks/useWallet'
import type { ApplicationResponse } from '@/features/application/types/application.types'

interface Props {
  application: ApplicationResponse | null
  onClose: () => void
}

export function PayFeeModal({ application, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { pay } = useApplicationMutations()
  const wallet = useWallet(Boolean(application))
  const quote = useFeeQuote(application?.id ?? '', Boolean(application))

  const balance = wallet.data?.balance ?? 0
  const fee = quote.data?.feeAmount ?? 0
  const insufficient = fee > 0 && balance < fee

  const handlePay = () => {
    if (!application) return
    pay.mutate(application.id, {
      onSuccess: () => {
        toast.success(t('wallet.paySuccess'))
        onClose()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <Modal open={Boolean(application)} onClose={onClose} title={t('wallet.payFeeTitle')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {t('wallet.payFeeDesc', { title: application?.post.title ?? '' })}
        </p>

        {quote.isLoading || wallet.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col gap-2 rounded-xl bg-surface-hover p-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('wallet.balance')}</span>
              <span className="font-bold text-text">{formatVnd(balance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('wallet.fee')}</span>
              <span className="font-bold text-primary">{fee > 0 ? formatVnd(fee) : '—'}</span>
            </div>
            <div className="my-1 border-t border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('wallet.afterBalance')}</span>
              <span className={`font-bold ${insufficient ? 'text-danger' : 'text-text'}`}>
                {fee > 0 ? formatVnd(balance - fee) : '—'}
              </span>
            </div>
          </div>
        )}

        {insufficient && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {t('wallet.insufficientBalance')}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            loading={pay.isPending}
            disabled={insufficient || quote.isLoading}
            onClick={handlePay}
          >
            {t('wallet.confirmPay')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
