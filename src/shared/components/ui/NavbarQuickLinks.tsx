import { NavLink } from "react-router-dom";
import { MessageSquare, Wallet, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useChatUnreadTotal } from "@/features/chat/hooks/useChatUnreadTotal";
import { cn } from "@/shared/utils/cn";

interface IconLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Số hiện trên góc biểu tượng; 0 hoặc không có thì ẩn. */
  badge?: number;
}

function IconLink({ to, icon: Icon, label, badge = 0 }: IconLinkProps) {
  const { t } = useTranslation();
  const ariaLabel =
    badge > 0 ? t("nav.unreadAria", { label, count: badge }) : label;
  return (
    <NavLink
      to={to}
      aria-label={ariaLabel}
      title={label}
      className={({ isActive }) =>
        cn(
          "relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-surface-hover",
          isActive ? "text-primary" : "text-text-secondary",
        )
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </NavLink>
  );
}

/** Tách riêng để chỉ gọi hook đếm tin chưa đọc khi đã đăng nhập (khách không gọi API). */
function ChatLink() {
  const { t } = useTranslation();
  const unread = useChatUnreadTotal();
  return (
    <IconLink
      to={ROUTES.CHAT_INBOX}
      icon={MessageSquare}
      label={t("nav.messages")}
      badge={unread}
    />
  );
}

/**
 * Nút biểu tượng Ví (chỉ gia sư) và Tin nhắn (có số tin chưa đọc), đặt cạnh chuông thông báo.
 * Khách và Admin không thấy gì.
 */
export function NavbarQuickLinks() {
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);

  if (!role || role === "ADMIN") return null;

  return (
    <>
      {role === "TUTOR" && (
        <div className="hidden sm:block">
          <IconLink to={ROUTES.WALLET} icon={Wallet} label={t("nav.wallet")} />
        </div>
      )}
      <ChatLink />
    </>
  );
}
