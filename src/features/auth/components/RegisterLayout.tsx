import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { AuthShell } from "@/shared/components/layout/AuthShell";

const TABS = [
  { to: ROUTES.REGISTER_STUDENT, label: "Học sinh / Phụ huynh" },
  { to: ROUTES.REGISTER_TUTOR, label: "Gia sư" },
];

interface Props {
  children: ReactNode;
}

export function RegisterLayout({ children }: Props) {
  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Miễn phí cho học viên — gia sư chỉ trả phí khi được nhận lớp">
      <nav className="mb-4 grid grid-cols-2 gap-2">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            replace
            className={({ isActive }) =>
              `flex items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "border-primary bg-primary-light text-primary" : "border-border text-text-secondary hover:border-primary/50"}`
            }>
            {t.label}
          </NavLink>
        ))}
      </nav>
      {children}
      <p className="mt-4 text-center text-sm text-text-secondary">
        Đã có tài khoản?{" "}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
