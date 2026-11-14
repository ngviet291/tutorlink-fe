import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatVnd } from '@/shared/utils/currency'
import { cn } from '@/shared/utils/cn'
import type { PaymentMethod } from '@/shared/types/common.types'
import { useTopUp } from '../hooks/useWallet'
import { walletService } from '../service/wallet.service'
import type { TopUpResponse } from '../types/wallet.types'

const PRESETS = [50_000, 100_000, 200_000, 500_000]
const METHODS: { value: Extract<PaymentMethod, 'MOMO' | 'ZALOPAY'>; label: string }[] = [
  { value: 'MOMO', label: 'MoMo' },
]
const MIN = 10_000
const MAX = 50_000_000

interface Props {
  open: boolean
  onClose: () => void
}

export function TopUpModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const topUp = useTopUp()
  const qc = useQueryClient()
  const [amount, setAmount] = useState<number>(100_000)
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState<'MOMO' | 'ZALOPAY'>('MOMO')
  const [session, setSession] = useState<TopUpResponse | null>(null)
  // Nhận diện đơn giả lập từ backend; quyền xác nhận vẫn do backend kiểm tra.
  const isDemo = session?.transaction.providerOrderId?.startsWith('MOCK') === true
  const demoConfirm = useMutation({
    mutationFn: (id: string) => walletService.confirmDemoTopUp(id),
    onSuccess: (transaction) => {
      qc.setQueryData(['wallet', 'topup-status', transaction.id], transaction)
      void qc.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const finalAmount = custom ? Number(custom.replace(/\D/g, '')) : amount
  const valid = finalAmount >= MIN && finalAmount <= MAX

  // Hỏi backend mỗi 3 giây; việc đọc trạng thái không tự xác nhận đơn demo.
  const status = useQuery({
    queryKey: ['wallet', 'topup-status', session?.transaction.id],
    queryFn: () => walletService.getTopUpStatus(session!.transaction.id),
    enabled: open && Boolean(session),
    retry: false,
    refetchInterval: (q) => (q.state.status === 'error' || (q.state.data && q.state.data.transactionStatus !== 'PENDING') ? false : 3_000),
  })
  const finalStatus = status.data?.transactionStatus ?? session?.transaction.transactionStatus

  useEffect(() => {
    if (finalStatus === 'SUCCESS') { toast.success(t('wallet.topUpSuccess', { amount: formatVnd(finalAmount) })); void qc.invalidateQueries({ queryKey: ['wallet'] }); }
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

  if (session) {
    const done = finalStatus === 'SUCCESS'
    const failed = finalStatus === 'FAILED' || finalStatus === 'CANCELLED'
    return (
      <Modal open={open} onClose={close} title="Thanh toán nạp ví">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{formatVnd(session.transaction.amount)}</p>
          {isDemo && <p role="status" className="text-sm font-semibold text-amber-600">CHẾ ĐỘ DEMO — tiền giả lập, không thanh toán qua MoMo. Chỉ dùng với dữ liệu phát triển.</p>}
          {done ? (
            <p className="flex items-center gap-2 font-semibold text-green-600"><CheckCircle2 className="size-5" /> Nạp ví thành công</p>
          ) : failed ? (
            <p className="font-semibold text-danger">Giao dịch không thành công. Vui lòng thử lại.</p>
          ) : (
            <>
              {isDemo ? (
                <Button loading={demoConfirm.isPending} onClick={() => demoConfirm.mutate(session.transaction.id)}>
                  Xác nhận thanh toán demo thành công
                </Button>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">Hoàn tất thanh toán trên {method === 'MOMO' ? 'MoMo' : 'ZaloPay'}, số dư sẽ được cập nhật tự động.</p>
                  {/* qrCodeUrl là dữ liệu QR, không phải ảnh; mở trang thanh toán MoMo. */}
                  <p className="text-sm text-text-secondary">
                    {session.paymentLink
                      ? 'Bấm mở trang thanh toán để xem mã QR trên MoMo.'
                      : 'Chưa nhận được liên kết thanh toán. Vui lòng đóng và thử lại.'}
                  </p>
                  {session.paymentLink && (
                    <a href={session.paymentLink} target="_blank" rel="noreferrer">
                      <Button><ExternalLink className="size-4" /> Mở trang thanh toán</Button>
                    </a>
                  )}
                </>
              )}
              {status.isError ? <div role="alert"><p className="text-sm text-danger">{getErrorMessage(status.error)}</p><Button variant="outline" onClick={() => void status.refetch()}>Kiểm tra lại</Button></div> : <p className="flex items-center gap-2 text-xs text-text-secondary"><Spinner size="sm" /> Đang chờ xác nhận…</p>}
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
