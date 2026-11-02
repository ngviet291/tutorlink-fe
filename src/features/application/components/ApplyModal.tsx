import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Input } from '@/shared/components/ui/Input'
import { formatVnd } from '@/shared/utils/currency'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations } from '../hooks/useApplications'

interface Props {
  postId: string
  open: boolean
  onClose: () => void
}

export function ApplyModal({ postId, open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const { apply } = useApplicationMutations()
  const [message, setMessage] = useState('')
  const [fee, setFee] = useState('')
  const feeValue = Number(fee.replace(/\D/g, ''))

  const handleSubmit = () => {
    if (!feeValue) {
      toast.error('Vui lòng nhập mức phí đề xuất')
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
    <Modal open={open} onClose={onClose} title={t('application.applyTitle')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t('application.applyDesc')}</p>
        <Input
          label="Mức phí đề xuất (VND/tháng)"
          inputMode="numeric"
          required
          placeholder="VD: 2000000"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          hint={feeValue ? formatVnd(feeValue) : undefined}
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
          <Button loading={apply.isPending} onClick={handleSubmit}>
            {t('application.submitApplication')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
