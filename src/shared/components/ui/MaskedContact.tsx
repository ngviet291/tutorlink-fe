import { Lock, Mail, Phone } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { CONTACT_LOCK_NOTE, LOCKED_EMAIL, LOCKED_PHONE, formatPhone } from '@/shared/utils/maskContact'
import type { ContactInfo } from '@/features/user/types/user.types'

interface MaskedContactProps {
  /** Chỉ truyền khi đã kết nối thành công (đã thanh toán phí). */
  contact?: ContactInfo
  className?: string
  showNote?: boolean
}

export function MaskedContact({ contact, className, showNote = true }: MaskedContactProps) {
  const unlocked = Boolean(contact)
  return (
    <div className={cn('rounded-xl border border-border bg-surface-hover p-3', className)}>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2">
          <Phone className="size-4 text-text-secondary" />
          <span className={cn('font-mono', !unlocked && 'select-none text-text-secondary')}>
            {contact ? formatPhone(contact.phone) : LOCKED_PHONE}
          </span>
          {!unlocked && <Lock className="size-3.5 text-primary" aria-label="Đã khóa" />}
        </li>
        <li className="flex items-center gap-2">
          <Mail className="size-4 text-text-secondary" />
          <span className={cn('font-mono', !unlocked && 'select-none text-text-secondary')}>
            {contact ? contact.email : LOCKED_EMAIL}
          </span>
          {!unlocked && <Lock className="size-3.5 text-primary" aria-label="Đã khóa" />}
        </li>
      </ul>
      {!unlocked && showNote && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-text-secondary">
          <Lock className="mt-0.5 size-3 shrink-0" />
          {CONTACT_LOCK_NOTE}
        </p>
      )}
    </div>
  )
}
