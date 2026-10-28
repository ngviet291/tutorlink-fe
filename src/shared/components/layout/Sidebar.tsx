import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { getNavGroups } from './navItems'

export function Sidebar() {
  const role = useAppSelector((s) => s.auth.user?.role)
  if (!role) return null
  const groups = getNavGroups(role)

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border bg-surface p-4 lg:block">
      <nav aria-label="Menu chức năng" className="flex flex-col gap-5">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            {group.title && (
              <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text',
                  )
                }
              >
                <item.icon className="size-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
