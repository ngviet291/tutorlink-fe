import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound } from 'lucide-react'
import { useResetPassword } from '@/features/auth/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'

interface ResetForm {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>()

  const password = watch('password')

  const onSubmit = async (data: ResetForm) => {
    try {
      await resetPassword.mutateAsync({ token, newPassword: data.password })
      toast.success(t('auth.resetPassword'))
      navigate(ROUTES.LOGIN)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('error.notFound')}</p>
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text text-center mb-1">
            {t('auth.resetPassword')}
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6">
            {t('auth.loginSubtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.password')}
              type="password"
              error={errors.password?.message}
              {...register('password', {
                required: t('validation.required'),
                minLength: { value: 8, message: t('validation.minLength', { min: 8 }) },
              })}
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: t('validation.required'),
                validate: (v) => v === password || t('validation.passwordMismatch'),
              })}
            />

            <Button type="submit" className="w-full" loading={isSubmitting}>
              {t('auth.resetPassword')}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
              ← {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
