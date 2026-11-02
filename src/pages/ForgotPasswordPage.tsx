import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { authService } from '@/config/di/container'

interface ForgotForm {
  email: string
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>()

  const onSubmit = async (data: ForgotForm) => {
    try {
      await authService.forgotPassword({ email: data.email })
      setSent(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text text-center mb-1">
            {t('auth.forgotPassword')}
          </h1>

          {!sent ? (
            <>
              <p className="text-sm text-text-secondary text-center mb-6">
                {t('auth.checkEmail')}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('auth.email')}
                  type="email"
                  placeholder="email@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: t('validation.required'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('validation.invalidEmail'),
                    },
                  })}
                />

                <Button
                  type="submit"
                  className="w-full"
                  loading={isSubmitting}
                >
                  {t('auth.sendResetEmail')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-6">
                {t('auth.checkEmail')}
              </p>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">{t('auth.sendResetEmail')}</p>
            </div>
          )}

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
