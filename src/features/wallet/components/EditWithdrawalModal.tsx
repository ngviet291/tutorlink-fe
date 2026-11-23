import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useUpdateWithdrawal } from '../hooks/useWallet'
import type { TransactionResponse, WithdrawalBankDetails } from '../types/wallet.types'
import { BankSelect } from './BankSelect'

interface Props {
  transaction: TransactionResponse
  onClose: () => void
}

export function EditWithdrawalModal({ transaction, onClose }: Props) {
  const toast = useToast()
  const update = useUpdateWithdrawal()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WithdrawalBankDetails>({
    defaultValues: {
      bankAccountNumber: transaction.bankAccountNumber ?? '',
      bankName: transaction.bankName ?? '',
      accountHolderName: transaction.accountHolderName ?? '',
    },
  })

  const onSubmit = (details: WithdrawalBankDetails) => {
    update.mutate(
      { id: transaction.id, details },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật thông tin nhận tiền')
          onClose()
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="mb-5 text-xl font-bold text-text">Sửa thông tin nhận tiền</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <label className="text-sm text-text">
            Số tài khoản
            <Input
              disabled={update.isPending}
              {...register('bankAccountNumber', {
                required: 'Vui lòng nhập số tài khoản',
                pattern: { value: /^\d{6,19}$/, message: 'Số tài khoản gồm 6–19 chữ số' },
              })}
            />
            {errors.bankAccountNumber && <span className="text-danger">{errors.bankAccountNumber.message}</span>}
          </label>
          <div>
            <label className="text-sm text-text">Ngân hàng</label>
            <Controller
              name="bankName"
              control={control}
              rules={{ required: 'Vui lòng chọn ngân hàng' }}
              render={({ field }) => (
                <BankSelect
                  value={field.value}
                  onChange={field.onChange}
                  disabled={update.isPending}
                  error={Boolean(errors.bankName)}
                />
              )}
            />
            {errors.bankName && <span className="text-danger">{errors.bankName.message}</span>}
          </div>
          <label className="text-sm text-text">
            Tên chủ tài khoản
            <Input
              disabled={update.isPending}
              {...register('accountHolderName', {
                required: 'Vui lòng nhập tên chủ tài khoản',
                pattern: { value: /^[\p{L} ]{2,50}$/u, message: 'Tên gồm 2–50 chữ cái' },
                setValueAs: (value: string) => value.trim().replace(/\s+/g, ' '),
              })}
            />
            {errors.accountHolderName && <span className="text-danger">{errors.accountHolderName.message}</span>}
          </label>
          <div className="mt-2 flex justify-end gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>Đóng</Button>
            <Button type="submit" loading={update.isPending}>Lưu thay đổi</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
