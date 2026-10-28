import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Dropdown } from '@/shared/components/ui/Dropdown'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationList } from './NotificationList'

export function NotificationBell() {
  const { data } = useNotifications()
  const items = data ?? []
  const unread = items.filter((n) => !n.read).length

  return (
    <Dropdown
      triggerLabel={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}
      className="w-80 max-w-[calc(100vw-2rem)]"
      trigger={
        <span className="relative flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
      }
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-bold text-text">Thông báo</span>
            <Link to={ROUTES.NOTIFICATIONS} onClick={close} className="text-xs font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">Chưa có thông báo</p>
            ) : (
              <NotificationList items={items.slice(0, 6)} onNavigate={close} compact />
            )}
          </div>
        </div>
      )}
    </Dropdown>
  )
}
