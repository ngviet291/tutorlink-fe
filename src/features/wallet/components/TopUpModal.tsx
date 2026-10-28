import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Copy, QrCode } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { useToast } from '@/shared/hooks/useToast'
import { formatVnd } from '@/shared/utils/currency'
import { getErrorMessage } from '@/shared/utils/errors'
import { useWalletMutations } from '../hooks/useWallet'
import type { TopUpResponse } from '../types/wallet.types'

interface Props {
  open: boolean
  onClose: () => void
  /** Gợi ý số tiền (ví dụ số còn thiếu để trả phí) */
  suggestedAmount?: number
}

interface FormValues {
  amount: number
}

const QUICK = [100_000, 200_000, 500_000, 1_000_000]

/** QR giả dạng ma trận ô vuông xác định theo chuỗi, chỉ để minh họa UI. */
function FakeQr({ seed }: { seed: string }) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const code = seed.charCodeAt(i % seed.length) + i * 7
    return code % 3 === 0
  })
  return (
    <div role="img" aria-label="Mã QR chuyển khoản (minh họa)" className="grid size-40 shrink-0 grid-cols-[repeat(21,1fr)] gap-px rounded-lg border border-border bg-white p-2">
      {cells.map((on, i) => <span key={i} className={on ? 'bg-black' : 'bg-white'} />)}
    </div>
  )
}

export function TopUpModal({ open, onClose, suggestedAmount }: Props) {
  const toast = useToast()
  const { topUp, confirmTopUp } = useWalletMutations()
  const [info, setInfo] = useState<TopUpResponse | null>(null)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    values: { amount: suggestedAmount && suggestedAmount > 0 ? Math.ceil(suggestedAmount / 1000) * 1000 : 200_000 },
  })

  const close = () => {
    setInfo(null)
    reset()
    onClose()
  }

  const submit = handleSubmit(({ amount }) =>
    topUp.mutate(Number(amount), { onSuccess: setInfo, onError: (e) => toast.error(getErrorMessage(e)) }),
  )

  const confirm = () => {
    if (!info) return
    confirmTopUp.mutate(info.transaction.id, {
      onSuccess: () => {
        toast.success('Nạp tiền thành công!')
        close()
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <Modal open={open} onClose={close} title="Nạp tiền vào ví" size="md">
      {!info ? (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <Input
            label="Số tiền cần nạp (VNĐ)" type="number" inputMode="numeric" required min={10000} step={1000}
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Vui lòng nhập số tiền',
              valueAsNumber: true,
              min: { value: 10_000, message: 'Tối thiểu 10.000đ' },
              max: { value: 50_000_000, message: 'Tối đa 50.000.000đ mỗi lần' },
            })}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setValue('amount', q, { shouldValidate: true })} className="cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-semibold text-text hover:border-primary hover:text-primary">
                {formatVnd(q)}
              </button>
            ))}
          </div>
          <Button type="submit" loading={topUp.isPending} fullWidth>Tiếp tục</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Chuyển khoản <strong className="text-text">{formatVnd(info.transaction.amount)}</strong> theo thông tin dưới đây, nhập đúng nội dung chuyển khoản.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <FakeQr seed={info.transferCode} />
            <dl className="w-full space-y-2 text-sm">
              {[['Ngân hàng', info.bankName], ['Số tài khoản', info.accountNumber], ['Chủ tài khoản', info.accountName], ['Nội dung', info.transferCode]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border pb-1">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="flex items-center gap-1.5 font-mono font-semibold text-text">
                    {v}
                    <button type="button" aria-label={`Sao chép ${k}`} className="cursor-pointer text-text-secondary hover:text-primary" onClick={() => void navigator.clipboard?.writeText(v ?? '').then(() => toast.info('Đã sao chép'))}>
                      <Copy className="size-3.5" />
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-surface-hover p-3 text-xs text-text-secondary">
            <QrCode className="mt-0.5 size-4 shrink-0 text-primary" />
            Đây là thông tin minh họa (chế độ mock). Giao dịch ở trạng thái “Đang xử lý” cho đến khi ngân hàng xác nhận; bấm nút bên dưới để giả lập đã nhận tiền.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Để sau</Button>
            <Button onClick={confirm} loading={confirmTopUp.isPending}>Tôi đã chuyển khoản</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
