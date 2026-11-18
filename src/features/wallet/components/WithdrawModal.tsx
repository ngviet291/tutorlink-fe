import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useWalletMutations } from '../hooks/useWallet'
import { formatVnd } from '@/shared/utils/currency'

interface WithdrawFormData {
  amount: string
  bankAccountNumber: string
  bankName: string
  accountHolderName: string
}

interface Props {
  open: boolean
  onClose: () => void
  currentBalance: number
}

export function WithdrawModal({ open, onClose, currentBalance }: Props) {
  const toast = useToast()
  const { withdraw } = useWalletMutations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WithdrawFormData>()

  const onSubmit = async (data: WithdrawFormData) => {
    const amount = Number(data.amount)

    if (amount < 10000) {
      toast.error('Số tiền rút tối thiểu là 10,000 VND')
      return
    }

    if (amount > currentBalance) {
      toast.error('Số dư không đủ để rút')
      return
    }

    setIsSubmitting(true)

    withdraw.mutate(
      {
        amount,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
      },
      {
        onSuccess: () => {
          toast.success('Yêu cầu rút tiền đã được gửi. Vui lòng chờ Admin duyệt.')
          reset()
          onClose()
        },
        onError: (error) => {
          toast.error(getErrorMessage(error))
        },
        onSettled: () => {
          setIsSubmitting(false)
        },
      },
    )
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Rút tiền về tài khoản</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-1 hover:bg-border"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-text-secondary">
          Số dư hiện tại: <strong className="text-primary">{formatVnd(currentBalance)}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Số tiền rút (VND) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="Tối thiểu 10,000 VND"
              disabled={isSubmitting}
              {...register('amount', {
                required: 'Vui lòng nhập số tiền',
                min: { value: 10000, message: 'Số tiền tối thiểu là 10,000 VND' },
              })}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Số tài khoản <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Nhập số tài khoản ngân hàng"
              disabled={isSubmitting}
              {...register('bankAccountNumber', {
                required: 'Vui lòng nhập số tài khoản',
              })}
            />
            {errors.bankAccountNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.bankAccountNumber.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Tên ngân hàng <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ví dụ: Vietcombank, Techcombank"
              disabled={isSubmitting}
              {...register('bankName', {
                required: 'Vui lòng nhập tên ngân hàng',
              })}
            />
            {errors.bankName && (
              <p className="mt-1 text-xs text-red-500">{errors.bankName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Tên chủ tài khoản <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Tên như trên thẻ ngân hàng"
              disabled={isSubmitting}
              {...register('accountHolderName', {
                required: 'Vui lòng nhập tên chủ tài khoản',
              })}
            />
            {errors.accountHolderName && (
              <p className="mt-1 text-xs text-red-500">{errors.accountHolderName.message}</p>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Gửi yêu cầu
            </Button>
          </div>
        </form>

        <p className="mt-4 text-xs text-text-secondary">
          ⚠️ Tiền sẽ bị trừ khỏi ví ngay lập tức. Admin sẽ xử lý và chuyển khoản trong vòng 1-3 ngày làm việc.
        </p>
      </div>
    </div>
  )
}
