import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Info } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useToast } from '@/shared/hooks/useToast'
import { formatVnd } from '@/shared/utils/currency'
import { formatCountdown } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations } from '@/features/application/hooks/useApplications'
import type { ApplicationResponse } from '@/features/application/types/application.types'
import { useFeeQuote, useWallet } from '../hooks/useWallet'
import { TopUpModal } from './TopUpModal'

interface Props {
  application: ApplicationResponse | null
  onClose: () => void
}

function useCountdown(deadline?: string): number {
  const [left, setLeft] = useState(() => (deadline ? new Date(deadline).getTime() - Date.now() : 0))
  useEffect(() => {
    if (!deadline) return
    const tick = () => setLeft(new Date(deadline).getTime() - Date.now())
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [deadline])
  return left
}

export function PayFeeModal({ application, onClose }: Props) {
  const toast = useToast()
  const quote = useFeeQuote(application?.id)
  const wallet = useWallet(Boolean(application))
  const { pay, decline } = useApplicationMutations()
  const left = useCountdown(application?.payDeadline)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const balance = wallet.data?.balance ?? 0
  const fee = quote.data?.feeAmount ?? 0
  const missing = Math.max(0, fee - balance)
  const expired = Boolean(application?.payDeadline) && left <= 0
  const ready = Boolean(quote.data) && wallet.data !== undefined

  const doPay = () => {
    if (!application) return
    pay.mutate(application.id, {
      onSuccess: () => {
        toast.success('Thanh toán thành công! Thông tin liên hệ và chat đã được mở.')
        onClose()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  const doDecline = () => {
    if (!application) return
    decline.mutate(application.id, {
      onSuccess: () => {
        toast.info('Bạn đã từ chối nhận lớp. Người đăng bài sẽ chọn ứng viên khác.')
        setDeclineOpen(false)
        onClose()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <>
      <Modal
        open={Boolean(application) && !topUpOpen}
        onClose={onClose}
        title="Thanh toán phí nhận lớp"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclineOpen(true)} disabled={pay.isPending}>Từ chối nhận lớp</Button>
            {missing > 0 ? (
              <Button onClick={() => setTopUpOpen(true)} disabled={expired}>Nạp thêm {formatVnd(missing)}</Button>
            ) : (
              <Button onClick={doPay} loading={pay.isPending} disabled={!ready || expired}>Thanh toán {fee ? formatVnd(fee) : ''}</Button>
            )}
          </>
        }
      >
        {application && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">Lớp: <strong className="text-text">{application.post.title}</strong></p>

            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${expired ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'}`}>
              <Clock className="size-4" />
              {expired ? 'Đã quá hạn thanh toán' : <>Hạn thanh toán còn <span className="font-mono">{formatCountdown(left)}</span></>}
            </div>

            {quote.isLoading || wallet.isLoading ? (
              <div className="flex flex-col gap-2"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6" /></div>
            ) : (
              <dl className="divide-y divide-border rounded-xl border border-border text-sm">
                <Row k="Học phí dự kiến tháng đầu" v={formatVnd(quote.data?.monthlyTuition ?? 0)} />
                <Row k="Tỉ lệ phí nhận lớp" v={`${Math.round((quote.data?.feeRate ?? 0) * 100)}%`} />
                <Row k="Phí phải trả" v={formatVnd(fee)} strong />
                <Row k="Số dư ví hiện tại" v={formatVnd(balance)} />
              </dl>
            )}

            {missing > 0 && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Số dư không đủ, bạn còn thiếu {formatVnd(missing)}. Hãy nạp thêm rồi thanh toán.
              </p>
            )}

            <p className="flex items-start gap-2 text-xs text-text-secondary">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              Học phí thực tế hằng tháng do hai bên tự thỏa thuận ngoài hệ thống. Thanh toán thành công sẽ mở thông tin liên hệ và chat.
            </p>
          </div>
        )}
      </Modal>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} suggestedAmount={missing} />

      <ConfirmDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Từ chối nhận lớp?"
        danger
        confirmText="Từ chối"
        loading={decline.isPending}
        onConfirm={doDecline}
        description="Lượt đăng ký sẽ bị hủy và người đăng bài có thể chọn ứng viên khác. Bạn không bị trừ phí."
      />
    </>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <dt className="text-text-secondary">{k}</dt>
      <dd className={strong ? 'text-lg font-extrabold text-primary' : 'font-semibold text-text'}>{v}</dd>
    </div>
  )
}
