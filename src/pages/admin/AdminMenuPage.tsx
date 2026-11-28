import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminMenuItems } from "@/shared/components/layout/navItems";

export default function AdminMenuPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">{t("nav.items.adminTitle")}</h1>

      <div className="grid grid-cols-2 gap-3">
        {adminMenuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-4"
          >
            <item.icon className="size-6" />

            <span className="text-sm font-semibold text-center">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
