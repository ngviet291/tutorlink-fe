import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { BudgetUnit } from '@/shared/types/common.types'
import { BUDGET_UNIT_LABEL, EDUCATION_LEVELS, PROVINCES, TEACHING_MODES, EDUCATION_LEVEL_LABEL, TEACHING_MODE_LABEL } from '@/constants/enums'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import type { PostPayload, PostResponse } from '../types/post.types'
import type { PostType } from '@/shared/types/common.types'

interface PostFormProps {
  defaultValues?: Partial<PostResponse>
  onSubmit: (payload: PostPayload, asDraft?: boolean) => Promise<void>
  isSubmitting?: boolean
}

export function PostForm({ defaultValues, onSubmit, isSubmitting }: PostFormProps) {
  const { t } = useTranslation()
  const { data: subjects = [] } = useSubjects()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PostPayload>({
    defaultValues: {
      type: defaultValues?.type ?? 'FIND_TUTOR',
      title: defaultValues?.title ?? '',
      content: defaultValues?.content ?? '',
      subjectId: defaultValues?.subject?.id ?? '',
      educationLevel: defaultValues?.educationLevel ?? 'HIGH_SCHOOL',
      teachingMode: defaultValues?.teachingMode ?? 'BOTH',
      address: defaultValues?.address ?? {},
      minBudget: defaultValues?.minBudget ?? 0,
      maxBudget: defaultValues?.maxBudget ?? 0,
      budgetUnit: defaultValues?.budgetUnit ?? 'PER_MONTH',
      sessionsPerWeek: defaultValues?.sessionsPerWeek ?? 2,
      durationMinutes: defaultValues?.durationMinutes ?? 90,
      deadline: defaultValues?.deadline
        ? defaultValues.deadline.slice(0, 10)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  })

  const submitAs = (asDraft: boolean) =>
    handleSubmit((data) => onSubmit(data, asDraft))()

  const postTypeOptions: { value: PostType; label: string }[] = [
    { value: 'FIND_TUTOR', label: t('post.type.FIND_TUTOR') },
    { value: 'FIND_STUDENT', label: t('post.type.FIND_STUDENT') },
  ]

  return (
    <form className="space-y-5">
      {/* Post type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('post.title')}</label>
        <div className="flex gap-3">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <>
                {postTypeOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={opt.value}
                      checked={field.value === opt.value}
                      onChange={() => field.onChange(opt.value)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </>
            )}
          />
        </div>
      </div>

      <Input
        label={t('post.title')}
        error={errors.title?.message}
        {...register('title', { required: t('validation.required') })}
      />

      <Textarea
        label={t('post.description')}
        error={errors.content?.message}
        rows={4}
        {...register('content', { required: t('validation.required') })}
      />

      {/* Subject */}
      <Controller
        name="subjectId"
        control={control}
        rules={{ required: t('validation.required') }}
        render={({ field }) => (
          <Select
            label={t('post.subject')}
            error={errors.subjectId?.message}
            value={field.value}
            onChange={field.onChange}
          >
            <option value="">{t('tutor.selectSubject')}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="educationLevel"
          control={control}
          render={({ field }) => (
            <Select label={t('post.educationLevel')} value={field.value} onChange={field.onChange}>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{EDUCATION_LEVEL_LABEL[l]}</option>
              ))}
            </Select>
          )}
        />

        <Controller
          name="teachingMode"
          control={control}
          render={({ field }) => (
            <Select label={t('post.teachingMode')} value={field.value} onChange={field.onChange}>
              {TEACHING_MODES.map((m) => (
                <option key={m} value={m}>{TEACHING_MODE_LABEL[m]}</option>
              ))}
            </Select>
          )}
        />
      </div>

      <Select
        label="Đơn vị ngân sách"
        options={(Object.keys(BUDGET_UNIT_LABEL) as BudgetUnit[]).map((u) => ({ value: u, label: BUDGET_UNIT_LABEL[u] }))}
        {...register('budgetUnit')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${t('post.budgetPerMonth')} min`}
          type="number"
          error={errors.minBudget?.message}
          {...register('minBudget', { valueAsNumber: true, min: { value: 0, message: t('validation.minZero') } })}
        />
        <Input
          label={`${t('post.budgetPerMonth')} max`}
          type="number"
          error={errors.maxBudget?.message}
          {...register('maxBudget', { valueAsNumber: true, min: { value: 0, message: t('validation.minZero') } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('post.sessionsPerWeek')}
          type="number"
          {...register('sessionsPerWeek', { valueAsNumber: true })}
        />
        <Input
          label={t('post.duration')}
          type="number"
          {...register('durationMinutes', { valueAsNumber: true })}
        />
      </div>

      <Input
        label={t('post.deadline')}
        type="date"
        error={errors.deadline?.message}
        {...register('deadline', { required: t('validation.required') })}
      />

      {/* Province */}
      <Controller
        name="address.province"
        control={control}
        render={({ field }) => (
          <Select label={t('common.province')} value={field.value ?? ''} onChange={field.onChange}>
            <option value="">{t('common.selectProvince')}</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => submitAs(true)}
          loading={isSubmitting}
          className="flex-1"
        >
          {t('post.draftSaved')}
        </Button>
        <Button
          type="button"
          onClick={() => submitAs(false)}
          loading={isSubmitting}
          className="flex-1"
        >
          {t('post.publishPost')}
        </Button>
      </div>
    </form>
  )
}
