import { useNavigate } from 'react-router-dom'
import { Bell, CreditCard, FileText, MessageSquare, ShieldCheck, UserCheck, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'
import { timeAgo } from '@/shared/utils/date'
import type { NotificationResponse, NotificationType } from '../types/notification.types'
import { useNotificationMutations } from '../hooks/useNotifications'

const icons: Record<NotificationType, typeof Bell> = {
  SYSTEM: ShieldCheck,
  APPLICATION: UserPlus,
  PAYMENT: CreditCard,
  CHAT: MessageSquare,
}

interface Props {
  items: NotificationResponse[]
  onNavigate?: () => void
  compact?: boolean
}

export function NotificationList({ items, onNavigate, compact }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { markRead } = useNotificationMutations()

  return (
    <ul className="divide-y divide-border">
      {items.map((n) => {
        const Icon = icons[n.notificationType] ?? Bell
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.id)
                onNavigate?.()
              }}
              className={cn(
                'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-surface-hover',
                !n.isRead && 'bg-primary-light/50',
              )}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm text-text', !n.isRead && 'font-semibold')}>{n.title}</span>
                <span className={cn('block text-xs text-text-secondary', compact && 'line-clamp-2')}>{n.content}</span>
                <span className="mt-1 block text-[11px] text-text-secondary">{timeAgo(n.createdAt)}</span>
              </span>
              {!n.isRead && (
                <span aria-label={t('notification.unread')} className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
