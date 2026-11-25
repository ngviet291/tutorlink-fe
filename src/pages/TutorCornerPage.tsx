import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { useAppSelector } from "@/shared/hooks/useAppStore";

interface Shortcut {
  to: string;
  icon: LucideIcon;
  key: string;
}

// Chỉ giữ khóa, chữ được dịch lúc render để đổi VI/EN có hiệu lực ngay
const SHORTCUTS: Shortcut[] = [
  { to: ROUTES.FIND_CLASS, icon: Search, key: "findClass" },
  { to: ROUTES.MY_APPLICATIONS, icon: ClipboardList, key: "myApplications" },
  { to: ROUTES.TUTOR_PROFILE, icon: UserRound, key: "tutorProfile" },
  { to: ROUTES.WALLET, icon: Wallet, key: "wallet" },
  { to: ROUTES.CHAT_INBOX, icon: MessageCircle, key: "chat" },
];

const STEP_KEYS = ["profile", "approval", "apply", "payFee", "unlock"];

export default function TutorCornerPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const isTutor = user?.role === "TUTOR";
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl bg-primary-light p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="size-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-text">
            {t("tutorCorner.title")}
          </h1>
        </div>
        <p className="mt-2 text-text-secondary">
          {isTutor
            ? t("tutorCorner.subtitleTutor")
            : t("tutorCorner.subtitleGuest")}
        </p>
        {!isTutor && (
          <div className="mt-4">
            <Link to={ROUTES.REGISTER_TUTOR}>
              <Button>{t("tutorCorner.registerTutor")}</Button>
            </Link>
          </div>
        )}
      </div>

      {isTutor && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-text">
            {t("tutorCorner.shortcutsTitle")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map(({ to, icon: Icon, key }) => (
              <Link
                key={to}
                to={to}
                className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-primary"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-text">
                    {t(`tutorCorner.shortcuts.${key}.title`)}
                  </span>
                  <span className="block text-sm text-text-secondary">
                    {t(`tutorCorner.shortcuts.${key}.desc`)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-text">
          {t("tutorCorner.stepsTitle")}
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {STEP_KEYS.map((key) => (
            <li
              key={key}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-text">{t(`tutorCorner.steps.${key}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-bold text-text">{t("tutorCorner.feeTitle")}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("tutorCorner.feeDesc")}
        </p>
        <Link
          to={ROUTES.FEE_POLICY}
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t("tutorCorner.feePolicyLink")}
        </Link>
      </section>
    </div>
  );
}
