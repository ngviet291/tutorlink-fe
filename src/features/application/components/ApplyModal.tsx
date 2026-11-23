import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Input } from '@/shared/components/ui/Input'
import { formatVnd } from '@/shared/utils/currency'
import { BUDGET_UNIT_LABEL } from '@/constants/enums'
import type { BudgetUnit } from '@/shared/types/common.types'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations } from '../hooks/useApplications'

interface Props {
  postId: string
  /** Khoảng ngân sách của bài: phí đề xuất phải nằm trong khoảng này. */
  minBudget?: number
  maxBudget?: number
  budgetUnit?: BudgetUnit
  open: boolean
  onClose: () => void
}

export function ApplyModal({ postId, minBudget, maxBudget, budgetUnit, open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { apply } = useApplicationMutations()
  const [message, setMessage] = useState('')
  const [fee, setFee] = useState('')
  const feeValue = Number(fee.replace(/\D/g, ''))

  const rangeText =
    minBudget != null && maxBudget != null
      ? `${formatVnd(minBudget)} – ${formatVnd(maxBudget)}${budgetUnit ? ` (${BUDGET_UNIT_LABEL[budgetUnit]})` : ''}`
      : ''
  const outOfRange =
    feeValue > 0 &&
    ((minBudget != null && feeValue < minBudget) || (maxBudget != null && feeValue > maxBudget))

  const submit = () => {
    if (!feeValue) {
      toast.error('Vui lòng nhập mức phí đề xuất')
      return
    }
    if (
      (minBudget != null && feeValue < minBudget) ||
      (maxBudget != null && feeValue > maxBudget)
    ) {
      toast.error(`Mức phí đề xuất phải nằm trong khoảng ${rangeText}`)
      return
    }
    apply.mutate(
      { postId, message: message.trim() || undefined, proposedFee: feeValue },
      {
        onSuccess: () => {
          toast.success(t('application.applied'))
          setMessage('')
          setFee('')
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('application.applyTitle')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {t('application.applyDesc')}
        </p>
        <Input
          label={`Mức phí đề xuất${budgetUnit ? ` (${BUDGET_UNIT_LABEL[budgetUnit]})` : ''}`}
          inputMode="numeric"
          required
          placeholder="VD: 2000000"
          value={fee}
          onChange={(e) => setFee(e.target.value.replace(/\D/g, '').slice(0, 9))}
          error={outOfRange ? `Phải nằm trong khoảng ${rangeText}` : undefined}
          hint={outOfRange ? undefined : feeValue ? formatVnd(feeValue) : rangeText ? `Khoảng của bài: ${rangeText}` : undefined}
        />
        <Textarea
          label={t('application.messageLabel')}
          placeholder={t('application.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p className="text-right text-xs text-text-secondary">{message.length}/500</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={apply.isPending} onClick={submit}>
            {t('application.submitApplication')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
