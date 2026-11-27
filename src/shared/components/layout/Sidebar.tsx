import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useUnreadCount } from "@/features/chat/hooks/useChat";
import { Avatar } from "@/shared/components/ui/Avatar";
import { ROUTES } from "@/constants/routes";
import { getNavGroups } from "./navItems";

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;
  const unread = useUnreadCount(Boolean(role)).data ?? 0;
  if (!user || !role) return null;
  const groups = getNavGroups(role);

  return (
    // Thẻ bo góc nằm trong khung chung, không dính mép màn hình (giống bộ lọc ở "Tìm lớp").
    <aside className="sticky top-[5.5rem] mt-6 hidden h-[calc(100dvh-6.5rem)] w-64 shrink-0 flex-col self-start overflow-hidden rounded-2xl border border-border bg-surface lg:flex">
      {/* Thẻ người dùng */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <Avatar name={user.fullName} src={user.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text">
            {user.fullName}
          </p>
          <p className="truncate text-xs text-text-secondary">{user.email}</p>
        </div>
      </div>

      <nav
        aria-label={t("shared.sidebar.ariaLabel")}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 [scrollbar-width:thin]"
      >
        {groups.map((group, gi) => (
          <div
            key={gi}
            className={cn(
              "flex flex-col gap-1",
              gi > 0 && "border-t border-border pt-4",
            )}
          >
            {group.title && (
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
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
                    "group relative flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Vạch nhấn bên trái khi đang ở trang này */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface-secondary text-text-secondary group-hover:bg-primary-light group-hover:text-primary",
                      )}
                    >
                      <item.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.to === ROUTES.CHAT_INBOX && unread > 0 && (
                      <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
