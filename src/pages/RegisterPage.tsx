import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CITIES } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { AuthShell } from '@/shared/components/layout/AuthShell'
import { useToast } from '@/shared/hooks/useToast'
import { Select } from '@/shared/components/ui/Select'
import { getErrorMessage } from '@/shared/utils/errors'
import { useRegister } from '@/features/auth/hooks/useAuth'
import { rules } from '@/features/auth/validation/auth.validation'

interface FormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  city: string
  district: string
  role: 'STUDENT' | 'TUTOR'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm<FormValues>({ defaultValues: { role: 'STUDENT', city: CITIES[0] } })
  const role = watch('role')
  const registerMutation = useRegister(role)
  const toast = useToast()

  const onSubmit = handleSubmit((v) => {
    registerMutation.mutate(
      { fullName: v.fullName, email: v.email, password: v.password, phone: v.phone, city: v.city, district: v.district },
      {
        onSuccess: () => {
          if (v.role === 'TUTOR') {
            toast.info('Hồ sơ đang chờ Admin duyệt. Hãy hoàn thiện hồ sơ giảng dạy của bạn.')
            navigate(ROUTES.TUTOR_PROFILE, { replace: true })
          } else {
            navigate(ROUTES.DASHBOARD, { replace: true })
          }
        },
      },
    )
  })

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Miễn phí cho học viên — gia sư chỉ trả phí khi được nhận lớp">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1.5 text-sm font-medium text-text">Bạn là</legend>
          {([['STUDENT', 'Học sinh / Phụ huynh'], ['TUTOR', 'Gia sư']] as const).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${role === value ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
            >
              <input type="radio" value={value} className="sr-only" {...register('role')} />
              {label}
            </label>
          ))}
        </fieldset>

        <Input label="Họ và tên" required autoComplete="name" error={errors.fullName?.message} {...register('fullName', { required: 'Họ tên là bắt buộc', minLength: { value: 2, message: 'Họ tên quá ngắn' } })} />
        <Input label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register('email', rules.email)} />
        <Input label="Mật khẩu" type="password" required autoComplete="new-password" hint="Tối thiểu 8 ký tự" error={errors.password?.message} {...register('password', rules.password)} />
        <Input
          label="Xác nhận mật khẩu" type="password" required autoComplete="new-password" error={errors.confirmPassword?.message}
          {...register('confirmPassword', { required: 'Vui lòng nhập lại mật khẩu', validate: (v) => v === getValues('password') || 'Mật khẩu xác nhận không khớp' })}
        />
        <Input label="Số điện thoại" type="tel" required autoComplete="tel" placeholder="09xx xxx xxx" error={errors.phone?.message} {...register('phone', rules.phone)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tỉnh / Thành phố" required options={CITIES.map((c) => ({ value: c, label: c }))} error={errors.city?.message} {...register('city', { required: 'Chọn tỉnh/thành' })} />
          <Input label="Quận / Huyện" required error={errors.district?.message} {...register('district', { required: 'Quận/huyện là bắt buộc' })} />
        </div>

        {registerMutation.isError && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300">{getErrorMessage(registerMutation.error)}</p>}
        <Button type="submit" size="lg" fullWidth loading={registerMutation.isPending}>Đăng ký</Button>
        <p className="text-center text-sm text-text-secondary">
          Đã có tài khoản? <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </AuthShell>
  )
}
