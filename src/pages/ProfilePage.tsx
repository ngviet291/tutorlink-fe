import { useForm } from 'react-hook-form'
import { CITIES } from '@/constants/enums'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { Avatar } from '@/shared/components/ui/Avatar'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { rules } from '@/features/auth/validation/auth.validation'
import { useChangePassword, useUpdateProfile } from '@/features/user/hooks/useUser'
import type { UpdateProfilePayload } from '@/features/user/types/user.types'

interface PwForm {
  currentPassword: string
  newPassword: string
  confirm: string
}

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user)
  const toast = useToast()
  const update = useUpdateProfile()
  const change = useChangePassword()

  const info = useForm<UpdateProfilePayload>({
    defaultValues: { fullName: user?.fullName, phone: user?.phone, city: user?.address?.city ?? CITIES[0], district: user?.address?.district ?? '' },
  })
  const pw = useForm<PwForm>()

  if (!user) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Tài khoản" />

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div><p className="font-bold text-text">{user.fullName}</p><p className="text-sm text-text-secondary">{user.email}</p></div>
        </div>
        <form
          noValidate className="flex flex-col gap-4"
          onSubmit={(e) => void info.handleSubmit((v) => update.mutate(v, { onSuccess: () => toast.success('Đã cập nhật thông tin'), onError: (er) => toast.error(getErrorMessage(er)) }))(e)}
        >
          <Input label="Họ và tên" required error={info.formState.errors.fullName?.message} {...info.register('fullName', { required: 'Họ tên là bắt buộc' })} />
          <Input label="Email" value={user.email} disabled readOnly hint="Email không thể thay đổi" />
          <Input label="Số điện thoại" required error={info.formState.errors.phone?.message} {...info.register('phone', rules.phone)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tỉnh / Thành phố" options={CITIES.map((c) => ({ value: c, label: c }))} {...info.register('city')} />
            <Input label="Quận / Huyện" required error={info.formState.errors.district?.message} {...info.register('district', { required: 'Bắt buộc' })} />
          </div>
          <div className="flex justify-end"><Button type="submit" loading={update.isPending}>Lưu thay đổi</Button></div>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-text">Đổi mật khẩu</h2>
        <form
          noValidate className="flex flex-col gap-4"
          onSubmit={(e) =>
            void pw.handleSubmit((v) =>
              change.mutate(
                { currentPassword: v.currentPassword, newPassword: v.newPassword },
                { onSuccess: () => { toast.success('Đã đổi mật khẩu'); pw.reset() }, onError: (er) => toast.error(getErrorMessage(er)) },
              ),
            )(e)
          }
        >
          <Input label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required error={pw.formState.errors.currentPassword?.message} {...pw.register('currentPassword', { required: 'Bắt buộc' })} />
          <Input label="Mật khẩu mới" type="password" autoComplete="new-password" required error={pw.formState.errors.newPassword?.message} {...pw.register('newPassword', rules.password)} />
          <Input
            label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" required error={pw.formState.errors.confirm?.message}
            {...pw.register('confirm', { required: 'Bắt buộc', validate: (v) => v === pw.getValues('newPassword') || 'Mật khẩu không khớp' })}
          />
          <div className="flex justify-end"><Button type="submit" loading={change.isPending}>Đổi mật khẩu</Button></div>
        </form>
      </section>
    </div>
  )
}
