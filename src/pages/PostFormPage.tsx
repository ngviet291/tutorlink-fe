import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CITIES, EDUCATION_LEVELS, EDUCATION_LEVEL_LABEL, TEACHING_MODES, TEACHING_MODE_LABEL } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useToast } from '@/shared/hooks/useToast'
import { toDateInputValue } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { usePost, usePostMutations } from '@/features/post/hooks/usePosts'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import type { PostPayload } from '@/features/post/types/post.types'

type FormValues = Omit<PostPayload, 'type'>

const tomorrow = (): string => new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)

export default function PostFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const { data: subjects } = useSubjects()
  const { data: existing, isLoading, isError, refetch } = usePost(id)
  const { create, update } = usePostMutations()
  const type: PostPayload['type'] = existing?.type ?? (user?.role === 'TUTOR' ? 'FIND_STUDENT' : 'FIND_TUTOR')

  const { register, reset, getValues, trigger, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      educationLevel: 'SECONDARY', teachingMode: 'BOTH', city: CITIES[0], sessionsPerWeek: 2, durationMinutes: 90, deadline: tomorrow(),
    },
  })

  useEffect(() => {
    if (!existing) return
    reset({
      title: existing.title, content: existing.content, subjectId: existing.subject.id, educationLevel: existing.educationLevel,
      teachingMode: existing.teachingMode, city: existing.address.city, district: existing.address.district, detail: existing.address.detail,
      minBudget: existing.minBudget, maxBudget: existing.maxBudget, sessionsPerWeek: existing.sessionsPerWeek,
      durationMinutes: existing.durationMinutes, deadline: toDateInputValue(existing.deadline),
    })
  }, [existing, reset])

  if (isEdit && isLoading) return <Skeleton className="mx-auto h-96 max-w-3xl" />
  if (isEdit && (isError || !existing)) return <ErrorState message="Không tải được bài đăng." onRetry={() => void refetch()} />
  if (isEdit && existing && existing.author.id !== user?.id && user?.role !== 'ADMIN') {
    return <ErrorState message="Bạn không có quyền sửa bài này." />
  }

  const save = (asDraft: boolean) => async () => {
    if (!(await trigger())) return
    const payload: PostPayload = { ...getValues(), type }
    const done = (msg: string) => {
      toast.success(msg)
      navigate(ROUTES.MY_POSTS)
    }
    if (isEdit && id) {
      update.mutate({ id, payload }, { onSuccess: () => done('Đã cập nhật bài đăng'), onError: (e) => toast.error(getErrorMessage(e)) })
    } else {
      create.mutate({ payload, asDraft }, { onSuccess: () => done(asDraft ? 'Đã lưu nháp' : 'Đã đăng công khai'), onError: (e) => toast.error(getErrorMessage(e)) })
    }
  }

  const req = (label: string) => ({ required: `${label} là bắt buộc` })
  const num = (label: string, min: number, max?: number) => ({
    ...req(label), valueAsNumber: true as const,
    min: { value: min, message: `${label} tối thiểu ${min.toLocaleString('vi-VN')}` },
    ...(max ? { max: { value: max, message: `${label} tối đa ${max.toLocaleString('vi-VN')}` } } : {}),
  })
  const busy = create.isPending || update.isPending

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Chỉnh sửa bài đăng' : type === 'FIND_TUTOR' ? 'Đăng bài tìm gia sư' : 'Đăng bài tìm học viên'}
        description="Điền đầy đủ thông tin để nhận được ứng viên phù hợp. Thông tin liên hệ của bạn được ẩn cho tới khi kết nối."
      />
      <form onSubmit={(e) => e.preventDefault()} noValidate className="mt-6 flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <Input label="Tiêu đề" required placeholder="VD: Cần gia sư Toán 9 ôn thi vào lớp 10" error={errors.title?.message} {...register('title', { ...req('Tiêu đề'), minLength: { value: 10, message: 'Tiêu đề tối thiểu 10 ký tự' }, maxLength: { value: 120, message: 'Tối đa 120 ký tự' } })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Môn học" required placeholder="Chọn môn học" options={(subjects ?? []).map((s) => ({ value: s.id, label: s.name }))} error={errors.subjectId?.message} {...register('subjectId', req('Môn học'))} />
          <Select label="Cấp học" required options={EDUCATION_LEVELS.map((l) => ({ value: l, label: EDUCATION_LEVEL_LABEL[l] }))} {...register('educationLevel')} />
          <Select label="Hình thức" required options={TEACHING_MODES.map((m) => ({ value: m, label: TEACHING_MODE_LABEL[m] }))} {...register('teachingMode')} />
          <Input label="Hạn nhận đăng ký" type="date" required error={errors.deadline?.message} {...register('deadline', req('Hạn nhận đăng ký'))} />
          <Select label="Tỉnh / Thành phố" required options={CITIES.map((c) => ({ value: c, label: c }))} {...register('city')} />
          <Input label="Quận / Huyện" required error={errors.district?.message} {...register('district', req('Quận/huyện'))} />
        </div>
        <Input label="Địa chỉ chi tiết (không bắt buộc)" hint="Chỉ nên ghi khu vực chung, không ghi số nhà/SĐT." {...register('detail')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Học phí dự kiến tối thiểu (VNĐ/tháng)" type="number" required inputMode="numeric" error={errors.minBudget?.message} {...register('minBudget', num('Học phí tối thiểu', 100_000))} />
          <Input
            label="Học phí dự kiến tối đa (VNĐ/tháng)" type="number" required inputMode="numeric" error={errors.maxBudget?.message}
            {...register('maxBudget', { ...num('Học phí tối đa', 100_000), validate: (v) => v >= Number(getValues('minBudget')) || 'Phải lớn hơn hoặc bằng mức tối thiểu' })}
          />
          <Input label="Số buổi / tuần" type="number" required error={errors.sessionsPerWeek?.message} {...register('sessionsPerWeek', num('Số buổi', 1, 7))} />
          <Input label="Thời lượng mỗi buổi (phút)" type="number" required error={errors.durationMinutes?.message} {...register('durationMinutes', num('Thời lượng', 30, 240))} />
        </div>
        <Textarea label="Yêu cầu / mô tả chi tiết" required rows={6} placeholder="Trình độ hiện tại, mục tiêu, yêu cầu với gia sư..." error={errors.content?.message} {...register('content', { ...req('Mô tả'), minLength: { value: 20, message: 'Mô tả tối thiểu 20 ký tự' } })} />
        <p className="text-xs text-text-secondary">Học phí thực tế hằng tháng do hai bên tự thỏa thuận ngoài hệ thống; mức trên chỉ dùng để tính phí nhận lớp.</p>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
          {isEdit ? (
            <Button loading={busy} onClick={() => void save(false)()}>Lưu thay đổi</Button>
          ) : (
            <>
              <Button variant="outline" loading={busy} onClick={() => void save(true)()}>Lưu nháp</Button>
              <Button loading={busy} onClick={() => void save(false)()}>Đăng công khai</Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
