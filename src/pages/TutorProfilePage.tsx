import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { CheckCircle2, Clock, Plus, Trash2, XCircle } from 'lucide-react'
import { CITIES, TEACHING_MODES, TEACHING_MODE_LABEL } from '@/constants/enums'
import { Button } from '@/shared/components/ui/Button'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useMyTutorProfile, useSaveTutorProfile } from '@/features/tutor/hooks/useTutors'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import type { TutorProfilePayload, TutorResponse } from '@/features/tutor/types/tutor.types'

function StatusBanner({ tutor }: { tutor: TutorResponse }) {
  const map = {
    PENDING: { Icon: Clock, cls: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200', title: 'Hồ sơ đang chờ Admin duyệt', body: 'Bạn chưa hiển thị công khai và chưa thể đăng ký nhận lớp. Chúng tôi sẽ thông báo ngay khi có kết quả.' },
    APPROVED: { Icon: CheckCircle2, cls: 'bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200', title: 'Hồ sơ đã được duyệt', body: 'Hồ sơ của bạn đã hiển thị công khai. Bạn có thể đăng ký nhận lớp.' },
    REJECTED: { Icon: XCircle, cls: 'bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200', title: 'Hồ sơ bị từ chối', body: 'Vui lòng xem ghi chú của Admin, chỉnh sửa và gửi lại.' },
  }[tutor.profileStatus]
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl p-4 ${map.cls}`}>
      <map.Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-bold">{map.title}</p>
        <p className="text-sm opacity-90">{map.body}</p>
        {tutor.reviewNote && <p className="mt-2 rounded-lg bg-white/60 p-2 text-sm dark:bg-black/20"><strong>Ghi chú của Admin:</strong> {tutor.reviewNote}</p>}
      </div>
    </div>
  )
}

export default function TutorProfilePage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useMyTutorProfile()
  const { data: subjects } = useSubjects()
  const save = useSaveTutorProfile()
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<TutorProfilePayload>({
    defaultValues: { subjectIds: [], experienceYears: 0, hourlyRate: 100000, teachingMode: 'BOTH', city: CITIES[0], certificates: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'certificates' })

  useEffect(() => {
    if (!data) return
    reset({
      subjectIds: data.subjects.map((s) => s.id), experienceYears: data.experienceYears, education: data.education ?? '',
      hourlyRate: data.hourlyRate || 100000, bio: data.bio ?? '', city: data.city ?? CITIES[0], district: data.district ?? '',
      teachingMode: data.teachingMode ?? 'BOTH', certificates: data.certificates.map((c) => ({ name: c.name, issuer: c.issuer, year: c.year })),
    })
  }, [data, reset])

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-3xl" />
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const submit = handleSubmit((v) =>
    save.mutate(v, {
      onSuccess: () => toast.success(data.profileStatus === 'APPROVED' ? 'Đã cập nhật hồ sơ' : 'Đã gửi hồ sơ, vui lòng chờ Admin duyệt'),
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Hồ sơ giảng dạy" description="Thông tin này hiển thị công khai khi hồ sơ được duyệt (trừ thông tin liên hệ)." />
      <StatusBanner tutor={data} />

      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <Controller
          control={control} name="subjectIds" rules={{ validate: (v) => v.length > 0 || 'Chọn ít nhất 1 môn dạy' }}
          render={({ field, fieldState }) => (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Môn dạy <span className="text-danger">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {(subjects ?? []).map((s) => {
                  const on = field.value.includes(s.id)
                  return (
                    <label key={s.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium ${on ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:border-primary'}`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => field.onChange(on ? field.value.filter((x) => x !== s.id) : [...field.value, s.id])} />
                      {s.name}
                    </label>
                  )
                })}
              </div>
              {fieldState.error && <p role="alert" className="mt-1 text-xs text-danger">{fieldState.error.message}</p>}
            </fieldset>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Số năm kinh nghiệm" type="number" required error={errors.experienceYears?.message} {...register('experienceYears', { valueAsNumber: true, required: 'Bắt buộc', min: { value: 0, message: 'Không âm' }, max: { value: 50, message: 'Tối đa 50' } })} />
          <Input label="Giá mỗi giờ (VNĐ)" type="number" required error={errors.hourlyRate?.message} {...register('hourlyRate', { valueAsNumber: true, required: 'Bắt buộc', min: { value: 50000, message: 'Tối thiểu 50.000đ' } })} />
          <Select label="Tỉnh / Thành phố" options={CITIES.map((c) => ({ value: c, label: c }))} {...register('city')} />
          <Input label="Quận / Huyện" required error={errors.district?.message} {...register('district', { required: 'Bắt buộc' })} />
          <Select label="Hình thức dạy" options={TEACHING_MODES.map((m) => ({ value: m, label: TEACHING_MODE_LABEL[m] }))} {...register('teachingMode')} />
          <Input label="Học vấn" required placeholder="VD: Cử nhân Sư phạm Toán — ĐH Sư phạm" error={errors.education?.message} {...register('education', { required: 'Bắt buộc' })} />
        </div>
        <Textarea label="Giới thiệu bản thân" required rows={5} error={errors.bio?.message} {...register('bio', { required: 'Bắt buộc', minLength: { value: 30, message: 'Tối thiểu 30 ký tự' } })} />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-text">Chứng chỉ / Bằng cấp</legend>
          {fields.map((f, i) => (
            <div key={f.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_6rem_auto]">
              <Input aria-label="Tên chứng chỉ" placeholder="Tên chứng chỉ" error={errors.certificates?.[i]?.name?.message} {...register(`certificates.${i}.name`, { required: 'Nhập tên' })} />
              <Input aria-label="Nơi cấp" placeholder="Nơi cấp" error={errors.certificates?.[i]?.issuer?.message} {...register(`certificates.${i}.issuer`, { required: 'Nhập nơi cấp' })} />
              <Input aria-label="Năm" type="number" placeholder="Năm" error={errors.certificates?.[i]?.year?.message} {...register(`certificates.${i}.year`, { valueAsNumber: true, required: 'Nhập năm', min: { value: 1980, message: '≥1980' } })} />
              <Button variant="ghost" aria-label="Xóa chứng chỉ" onClick={() => remove(i)}><Trash2 className="size-4 text-danger" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-fit" onClick={() => append({ name: '', issuer: '', year: new Date().getFullYear() })}><Plus className="size-4" /> Thêm chứng chỉ</Button>
        </fieldset>

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" loading={save.isPending}>{data.profileStatus === 'REJECTED' ? 'Gửi lại để duyệt' : 'Lưu hồ sơ'}</Button>
        </div>
      </form>
    </div>
  )
}
