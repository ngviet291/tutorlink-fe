import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatVnd } from '@/shared/utils/currency'
import { env } from '@/config/env'
import { cn } from '@/shared/utils/cn'
import type { PaymentMethod } from '@/shared/types/common.types'
import { useTopUp, useWalletMutations } from '../hooks/useWallet'
import { walletService } from '../service/wallet.service'
import type { TopUpResponse } from '../types/wallet.types'

const PRESETS = [50_000, 100_000, 200_000, 500_000]
const METHODS: { value: Extract<PaymentMethod, 'MOMO' | 'ZALOPAY'>; label: string }[] = [
  { value: 'MOMO', label: 'MoMo' },
  { value: 'ZALOPAY', label: 'ZaloPay' },
]
const MIN = 1_000
const MAX = 50_000_000

interface Props {
  open: boolean
  onClose: () => void
}

export function TopUpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const topUp = useTopUp()
  const { confirmTopUp } = useWalletMutations()
  const [amount, setAmount] = useState<number>(100_000)
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState<'MOMO' | 'ZALOPAY'>('MOMO')
  const [session, setSession] = useState<TopUpResponse | null>(null)

  const finalAmount = custom ? Number(custom.replace(/\D/g, '')) : amount
  const valid = finalAmount >= MIN && finalAmount <= MAX

  // Sau khi tạo giao dịch: hỏi trạng thái mỗi 3 giây (API thật) cho tới khi hết PENDING.
  const status = useQuery({
    queryKey: ['wallet', 'topup-status', session?.transaction.id],
    queryFn: () => walletService.getTopUpStatus(session!.transaction.id),
    enabled: Boolean(session) && !env.useMock,
    refetchInterval: (q) => (q.state.data && q.state.data.transactionStatus !== 'PENDING' ? false : 3_000),
  })
  const finalStatus = status.data?.transactionStatus ?? session?.transaction.transactionStatus

  useEffect(() => {
    if (finalStatus === 'SUCCESS') toast.success(t('wallet.topUpSuccess', { amount: formatVnd(finalAmount) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStatus])

  const close = () => {
    setSession(null)
    setCustom('')
    onClose()
  }

  const create = () => {
    if (!valid) {
      toast.error(`Số tiền nạp từ ${formatVnd(MIN)} đến ${formatVnd(MAX)}`)
      return
    }
    topUp.mutate(
      { amount: finalAmount, paymentMethod: method },
      { onSuccess: setSession, onError: (e) => toast.error(getErrorMessage(e)) },
    )
  }

  // Mock: giả lập người dùng đã thanh toán xong ở cổng
  const simulatePaid = () =>
    session && confirmTopUp.mutate(session.transaction.id, {
      onSuccess: (tx) => setSession({ ...session, transaction: tx }),
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  if (session) {
    const done = finalStatus === 'SUCCESS'
    const failed = finalStatus === 'FAILED' || finalStatus === 'CANCELLED'
    return (
      <Modal open={open} onClose={close} title="Thanh toán nạp ví">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{formatVnd(session.transaction.amount)}</p>
          {done ? (
            <p className="flex items-center gap-2 font-semibold text-green-600"><CheckCircle2 className="size-5" /> Nạp ví thành công</p>
          ) : failed ? (
            <p className="font-semibold text-danger">Giao dịch không thành công. Vui lòng thử lại.</p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Hoàn tất thanh toán trên {method === 'MOMO' ? 'MoMo' : 'ZaloPay'}, số dư sẽ được cập nhật tự động.</p>
              {session.qrCodeUrl && <img src={session.qrCodeUrl} alt="Mã QR thanh toán" className="size-48 rounded-xl border border-border" />}
              {session.paymentLink && (
                <a href={session.paymentLink} target="_blank" rel="noreferrer">
                  <Button><ExternalLink className="size-4" /> Mở trang thanh toán</Button>
                </a>
              )}
              <p className="flex items-center gap-2 text-xs text-text-secondary"><Spinner size="sm" /> Đang chờ xác nhận…</p>
              {env.useMock && <Button variant="outline" size="sm" loading={confirmTopUp.isPending} onClick={simulatePaid}>[Mock] Giả lập đã thanh toán</Button>}
            </>
          )}
          <Button variant={done || failed ? 'primary' : 'ghost'} onClick={close}>{done || failed ? 'Đóng' : 'Để sau'}</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={close} title={t('wallet.topUpTitle')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t('wallet.topUpDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setAmount(p); setCustom('') }}
              className={cn(
                'cursor-pointer rounded-xl border p-3 text-sm font-semibold transition-colors',
                amount === p && !custom ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
              )}
            >
              {formatVnd(p)}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">{t('wallet.customAmount')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setAmount(0) }}
            placeholder={t('wallet.customAmountPlaceholder')}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-text-secondary">Phương thức thanh toán</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Phương thức thanh toán">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={method === m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3 text-sm font-semibold transition-colors',
                  method === m.value ? 'border-primary bg-primary-light text-primary' : 'border-border text-text hover:border-primary',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {valid && <p className="rounded-lg bg-surface-hover p-2 text-center text-sm font-bold text-primary">{t('wallet.willAdd', { amount: formatVnd(finalAmount) })}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
          <Button loading={topUp.isPending} onClick={create}>{t('wallet.confirmTopUp')}</Button>
        </div>
      </div>
    </Modal>
  )
}
