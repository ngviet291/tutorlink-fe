import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { MaskedContact } from '@/shared/components/ui/MaskedContact'
import { useAppSelector } from '@/shared/hooks/useAppStore'

/** Hiển thị khi chưa thanh toán phí nhận lớp: khóa liên hệ + khóa chat. */
export function ContactUnlockBox({ partnerName }: { partnerName: string }) {
  const role = useAppSelector((s) => s.auth.user?.role)
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-light text-primary"><Lock className="size-7" /></span>
      <h2 className="text-xl font-extrabold text-text">Kênh liên hệ đang bị khóa</h2>
      <p className="text-sm text-text-secondary">
        Thông tin liên hệ và chat với <strong className="text-text">{partnerName}</strong> sẽ mở sau khi gia sư thanh toán phí nhận lớp.
      </p>
      <MaskedContact className="w-full text-left" />
      {role === 'TUTOR' && (
        <Link to={ROUTES.MY_APPLICATIONS}><Button>Đến trang thanh toán phí</Button></Link>
      )}
    </div>
  )
}
