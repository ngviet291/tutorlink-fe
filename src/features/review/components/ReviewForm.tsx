import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useSubmitReview } from '../hooks/useReviews'

interface Props {
  applicationId: string
  tutorName: string
  open: boolean
  onClose: () => void
}

export function ReviewForm({ applicationId, tutorName, open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const submit = useSubmitReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(0)

  const handleSubmit = () => {
    submit.mutate(
      { applicationId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t('review.submitted'))
          setComment('')
          setRating(5)
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={t('review.title', { name: tutorName })}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t('review.desc')}</p>

        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`size-8 ${
                  star <= (hovered || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-border'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-text-secondary">
            {rating}/5
          </span>
        </div>

        <Textarea
          label={t('review.comment')}
          placeholder={t('review.commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={300}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={submit.isPending} onClick={handleSubmit}>
            {t('review.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
