import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useReviewMutations } from '../hooks/useReviews'
import type { ReviewResponse } from '../types/review.types'

interface Props {
  review: ReviewResponse | null
  onClose: () => void
}

interface FormValues {
  reason: string
}

export function ComplaintModal({ review, onClose }: Props) {
  const toast = useToast()
  const { complain } = useReviewMutations()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>()

  const close = () => {
    reset()
    onClose()
  }

  const submit = handleSubmit(({ reason }) => {
    if (!review) return
    complain.mutate(
      { reviewId: review.id, reason },
      {
        onSuccess: () => {
          toast.success('Đã gửi khiếu nại. Admin sẽ xem xét đánh giá này.')
          close()
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  })

  return (
    <Modal
      open={Boolean(review)}
      onClose={close}
      title="Khiếu nại đánh giá"
      footer={
        <>
          <Button variant="ghost" onClick={close}>Hủy</Button>
          <Button onClick={() => void submit()} loading={complain.isPending}>Gửi khiếu nại</Button>
        </>
      }
    >
      {review && (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <blockquote className="rounded-xl bg-surface-hover p-3 text-sm text-text-secondary">
            “{review.comment}” — {review.rating}★ từ {review.student.fullName}
          </blockquote>
          <Textarea
            label="Lý do khiếu nại"
            required
            placeholder="Giải thích vì sao đánh giá này không chính xác hoặc vi phạm quy định..."
            error={errors.reason?.message}
            {...register('reason', {
              required: 'Vui lòng nhập lý do',
              minLength: { value: 10, message: 'Lý do tối thiểu 10 ký tự' },
            })}
          />
        </form>
      )}
    </Modal>
  )
}
