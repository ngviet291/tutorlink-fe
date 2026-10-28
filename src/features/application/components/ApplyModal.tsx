import { useForm } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useApplicationMutations } from '../hooks/useApplications'

interface Props {
  postId: string
  open: boolean
  onClose: () => void
}

interface FormValues {
  message: string
}

export function ApplyModal({ postId, open, onClose }: Props) {
  const toast = useToast()
  const { apply } = useApplicationMutations()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ defaultValues: { message: '' } })

  const submit = handleSubmit(({ message }) => {
    apply.mutate(
      { postId, message: message.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi đăng ký nhận lớp!')
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
      title="Đăng ký nhận lớp"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={() => void submit()} loading={apply.isPending}>Gửi đăng ký</Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
        <Textarea
          label="Lời nhắn cho người đăng bài"
          placeholder="Giới thiệu ngắn về kinh nghiệm và lịch phù hợp của bạn..."
          hint="Không chia sẻ số điện thoại/email trong lời nhắn — thông tin liên hệ sẽ được mở sau khi kết nối."
          error={errors.message?.message}
          {...register('message', { maxLength: { value: 500, message: 'Tối đa 500 ký tự' } })}
        />
        <p className="text-xs text-text-secondary">Mỗi người chỉ đăng ký 1 lần cho mỗi bài. Gia sư chỉ thanh toán phí khi được chọn.</p>
      </form>
    </Modal>
  )
}
