import { Link } from 'react-router-dom'
import { Avatar } from '@/shared/components/ui/Avatar'
import { ROUTES } from '@/constants/routes'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import type { ChatPartner } from '../types/chat.types'
import { ConnectionStatus } from './ConnectionStatus'

export function ChatHeader({ partner }: { partner: ChatPartner }) {
  const role = useAppSelector((s) => s.auth.user?.role)
  // Hồ sơ công khai của đối phương: học viên xem gia sư, gia sư xem học viên
  const profileLink =
    role === 'STUDENT' ? ROUTES.TUTOR_DETAIL(partner.id) : role === 'TUTOR' ? ROUTES.STUDENT_DETAIL(partner.id) : null

  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar name={partner.fullName} src={partner.avatarUrl} />
      <div className="min-w-0 flex-1">
        {profileLink ? (
          <Link to={profileLink} className="block truncate font-bold text-text hover:text-primary">
            {partner.fullName}
          </Link>
        ) : (
          <p className="truncate font-bold text-text">{partner.fullName}</p>
        )}
        <ConnectionStatus />
      </div>
    </header>
  )
}
