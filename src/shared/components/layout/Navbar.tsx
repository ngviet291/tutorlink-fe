import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/shared/utils/cn";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useTheme } from "@/shared/hooks/useTheme";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Button } from "@/shared/components/ui/Button";
import { Dropdown, dropdownItemClass } from "@/shared/components/ui/Dropdown";
import { Logo } from "@/shared/components/ui/Logo";
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { getPublicNav } from "./navItems";
import { NavbarQuickLinks } from "../ui/NavbarQuickLinks";

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggle } = useTheme();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
      isActive
        ? "bg-primary-light text-primary"
        : "text-text-secondary hover:text-primary",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Logo />

        <nav
          aria-label={t("shared.navbar.mainNav")}
          className="ml-6 hidden items-center gap-1 lg:flex"
        >
          {getPublicNav(user?.role).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.HOME}
              className={linkClass}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === "dark"
                ? t("shared.navbar.switchToLight")
                : t("shared.navbar.switchToDark")
            }
            className="hidden cursor-pointer rounded-lg p-2 text-text-secondary hover:bg-surface-hover sm:block"
          >
            {theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </button>

          {user ? (
            <>
              <NavbarQuickLinks />
              <NotificationBell />
              <Dropdown
                triggerLabel={t("shared.navbar.accountMenu")}
                trigger={<Avatar name={user.fullName} src={user.avatarUrl} />}
              >
                {(close) => (
                  <>
                    <div className="border-b border-border px-4 py-2">
                      <p className="text-sm font-semibold text-text">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {user.email}
                      </p>
                    </div>
                    {user.role === "TUTOR" && (
                      <button
                        type="button"
                        role="menuitem"
                        className={dropdownItemClass}
                        onClick={() => {
                          close();
                          navigate(ROUTES.TUTOR_DETAIL(user.id));
                        }}
                      >
                        <Globe className="size-4" aria-hidden="true" />{" "}
                        {t("shared.navbar.publicProfile")}
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className={dropdownItemClass}
                      onClick={() => {
                        close();
                        navigate(
                          user.role === "ADMIN"
                            ? ROUTES.ADMIN
                            : ROUTES.DASHBOARD,
                        );
                      }}
                    >
                      <LayoutDashboard className="size-4" />{" "}
                      {user.role === "ADMIN"
                        ? t("shared.navbar.adminPanel")
                        : t("shared.navbar.overview")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={dropdownItemClass}
                      onClick={() => {
                        close();
                        navigate(ROUTES.PROFILE);
                      }}
                    >
                      <User className="size-4" /> {t("shared.navbar.account")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={cn(dropdownItemClass, "text-danger-text")}
                      onClick={() => {
                        close();
                        logout.mutate(undefined, {
                          onSettled: () =>
                            navigate(ROUTES.HOME, { replace: true }),
                        });
                      }}
                    >
                      <LogOut className="size-4" /> {t("nav.logout")}
                    </button>
                  </>
                )}
              </Dropdown>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost">{t("nav.login")}</Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button>{t("nav.register")}</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={
              mobileOpen
                ? t("shared.navbar.closeMenu")
                : t("shared.navbar.openMenu")
            }
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="cursor-pointer rounded-lg p-2 text-text hover:bg-surface-hover lg:hidden"
          >
            {mobileOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label={t("shared.navbar.mobileNav")}
          className="animate-fade-in border-t border-border bg-surface px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {getPublicNav(user?.role).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.HOME}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3 sm:hidden">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={toggle}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover"
              >
                {theme === "dark" ? (
                  <Sun className="size-5" />
                ) : (
                  <Moon className="size-5" />
                )}
                {theme === "dark"
                  ? t("shared.navbar.switchToLight")
                  : t("shared.navbar.switchToDark")}
              </button>
            </div>
            {!user && (
              <div className="mt-2 flex gap-2 sm:hidden">
                <Link
                  to={ROUTES.LOGIN}
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  <Button variant="outline" fullWidth>
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  <Button fullWidth>{t("nav.register")}</Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
