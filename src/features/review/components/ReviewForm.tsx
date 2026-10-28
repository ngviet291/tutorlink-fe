import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { RatingInput } from '@/shared/components/ui/RatingStars'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useReviewMutations } from '../hooks/useReviews'

interface Props {
  applicationId: string
  tutorName: string
  open: boolean
  onClose: () => void
}

interface FormValues {
  rating: number
  comment: string
}

export function ReviewForm({ applicationId, tutorName, open, onClose }: Props) {
  const toast = useToast()
  const { create } = useReviewMutations()
  const [ratingError, setRatingError] = useState('')
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ defaultValues: { rating: 0, comment: '' } })

  const submit = handleSubmit((v) => {
    if (v.rating < 1) {
      setRatingError('Vui lòng chọn số sao')
      return
    }
    setRatingError('')
    create.mutate(
      { applicationId, rating: v.rating, comment: v.comment },
      {
        onSuccess: () => {
          toast.success('Cảm ơn bạn đã đánh giá gia sư!')
          reset()
          onClose()
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Đánh giá gia sư ${tutorName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={() => void submit()} loading={create.isPending}>Gửi đánh giá</Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Mức độ hài lòng</span>
          <Controller control={control} name="rating" render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} />} />
          {ratingError && <p role="alert" className="text-xs text-danger">{ratingError}</p>}
        </div>
        <Textarea
          label="Nhận xét"
          required
          placeholder="Chia sẻ trải nghiệm học với gia sư..."
          error={errors.comment?.message}
          {...register('comment', { required: 'Vui lòng nhập nhận xét', minLength: { value: 10, message: 'Nhận xét tối thiểu 10 ký tự' } })}
        />
      </form>
    </Modal>
  )
}
