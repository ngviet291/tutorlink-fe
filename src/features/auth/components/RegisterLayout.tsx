import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { AuthShell } from "@/shared/components/layout/AuthShell";

// Chỉ giữ khóa dịch; chữ được dịch lúc render để đổi VI/EN có hiệu lực ngay.
const TABS = [
  { to: ROUTES.REGISTER_STUDENT, labelKey: "auth.registerLayout.tabStudent" },
  { to: ROUTES.REGISTER_TUTOR, labelKey: "auth.registerLayout.tabTutor" },
];

interface Props {
  children: ReactNode;
  wide?: boolean;
}

export function RegisterLayout({ children, wide }: Props) {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t("auth.createAccount")}
      subtitle={t("auth.registerLayout.subtitle")}
      wide={wide}
    >
      <nav className="mb-4 grid grid-cols-2 gap-2">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            replace
            className={({ isActive }) =>
              `flex items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "border-primary bg-primary-light text-primary" : "border-border text-text-secondary hover:border-primary/50"}`
            }
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>
      {children}
      <p className="mt-4 text-center text-sm text-text-secondary">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-primary hover:underline"
        >
          {t("auth.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
