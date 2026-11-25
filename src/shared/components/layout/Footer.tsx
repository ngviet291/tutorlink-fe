import { Link } from "react-router-dom";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { Logo } from "@/shared/components/ui/Logo";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import type { Role } from "@/shared/types/common.types";

interface FooterLink {
  to: string;
  /** Khóa dịch; chữ được dịch lúc render để đổi VI/EN có hiệu lực ngay. */
  labelKey: string;
  /** Vai trò không thấy link này (khách chưa đăng nhập được coi là học viên). */
  hideFor?: Role[];
}

const EXPLORE_LINKS: FooterLink[] = [
  {
    to: ROUTES.FIND_TUTOR,
    labelKey: "shared.footer.findTutor",
    hideFor: ["TUTOR"],
  },
  { to: ROUTES.FIND_CLASS, labelKey: "shared.footer.findClass" },
  {
    to: ROUTES.TUTOR_CORNER,
    labelKey: "shared.footer.tutorCorner",
    hideFor: ["STUDENT"],
  },
  {
    to: ROUTES.STUDENT_CORNER,
    labelKey: "shared.footer.studentCorner",
    hideFor: ["TUTOR"],
  },
];

export function Footer() {
  const { t } = useTranslation();
  const role = useAppSelector((s) => s.auth.user?.role);
  const effective: Role = role ?? "STUDENT";
  const exploreLinks =
    role === "ADMIN"
      ? []
      : EXPLORE_LINKS.filter((l) => !l.hideFor?.includes(effective));

  const col = "flex flex-col gap-2 text-sm text-text-secondary";
  const link = "hover:text-primary";
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-sm text-text-secondary">
            {t("shared.footer.tagline")}
          </p>
          <div className="flex gap-3 text-text-secondary">
            <a
              href="#"
              aria-label={t("shared.footer.websiteAria")}
              className={link}
            >
              <Globe className="size-5" />
            </a>
            <Link
              to={ROUTES.CHAT_INBOX}
              aria-label={t("shared.footer.messagesAria")}
              className={link}
            >
              <MessageCircle className="size-5" />
            </Link>
          </div>
        </div>

        {exploreLinks.length > 0 && (
          <nav aria-label={t("shared.footer.explore")} className={col}>
            <h3 className="mb-1 font-bold text-text">
              {t("shared.footer.explore")}
            </h3>
            {exploreLinks.map((l) => (
              <Link key={l.to} className={link} to={l.to}>
                {t(l.labelKey)}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label={t("shared.footer.support")} className={col}>
          <h3 className="mb-1 font-bold text-text">
            {t("shared.footer.support")}
          </h3>
          <Link className={link} to={ROUTES.GUIDE}>
            {t("shared.footer.guide")}
          </Link>
          <Link className={link} to={ROUTES.FEE_POLICY}>
            {t("shared.footer.feePolicy")}
          </Link>
          <Link className={link} to={ROUTES.PRIVACY}>
            {t("shared.footer.privacy")}
          </Link>
          <Link className={link} to={ROUTES.TERMS}>
            {t("shared.footer.terms")}
          </Link>
        </nav>

        <div className={col}>
          <h3 className="mb-1 font-bold text-text">
            {t("shared.footer.contact")}
          </h3>
          <span className="flex items-center gap-2">
            <Phone className="size-4" /> 1900 0000
          </span>
          <span className="flex items-center gap-2">
            <Mail className="size-4" /> tutorlink.n3@gmail.com
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4" /> {t("shared.footer.address")}
          </span>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-secondary">
        {t("shared.footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
