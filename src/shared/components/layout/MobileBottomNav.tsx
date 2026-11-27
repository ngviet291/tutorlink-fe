import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { getBottomNav } from "./navItems";

export function MobileBottomNav() {
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role) return null;
  const items = getBottomNav(role);

  return (
    <nav
      aria-label={t("shared.mobileBottomNav.ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold",
              isActive ? "text-primary" : "text-text-secondary",
            )
          }
        >
          <item.icon className="size-5" />
          <span className="max-w-full truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
