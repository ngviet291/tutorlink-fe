import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Mail } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { getErrorMessage } from '@/shared/utils/errors'
import { useLogin } from '@/features/auth/hooks/useAuth'
import { rules } from '@/features/auth/validation/auth.validation'
import { AuthShell } from '@/shared/components/layout/AuthShell'

interface FormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const login = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>()

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại TutorLink">
      <form onSubmit={(e) => void handleSubmit((v) => login.mutate(v))(e)} className="flex flex-col gap-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" leftIcon={<Mail className="size-4" />} error={errors.email?.message} {...register('email', rules.email)} />
        <Input label="Mật khẩu" type="password" autoComplete="current-password" leftIcon={<Lock className="size-4" />} error={errors.password?.message} {...register('password', { required: 'Mật khẩu là bắt buộc' })} />
        {login.isError && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300">{getErrorMessage(login.error)}</p>}
        <Button type="submit" size="lg" fullWidth loading={login.isPending}>Đăng nhập</Button>
        <p className="text-center text-sm text-text-secondary">
          Chưa có tài khoản? <Link to={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">Đăng ký ngay</Link>
        </p>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-border p-3 text-xs text-text-secondary">
        <p className="mb-1 font-semibold text-text">Tài khoản demo (mật khẩu: 12345678)</p>
        <ul className="grid gap-0.5 font-mono">
          <li>student@demo.com — Học viên</li>
          <li>tutor@demo.com — Gia sư đã duyệt</li>
          <li>pending.tutor@demo.com — Gia sư chờ duyệt</li>
          <li>rejected.tutor@demo.com — Gia sư bị từ chối</li>
          <li>admin@demo.com — Admin</li>
        </ul>
      </div>
    </AuthShell>
  )
}
