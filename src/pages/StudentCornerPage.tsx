import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  FilePlus2,
  GraduationCap,
  Heart,
  MessageCircle,
  Search,
  FileText,
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
  { to: ROUTES.POST_CREATE, icon: FilePlus2, key: "postCreate" },
  { to: ROUTES.MY_POSTS, icon: FileText, key: "myPosts" },
  { to: ROUTES.FIND_TUTOR, icon: Search, key: "findTutor" },
  { to: ROUTES.FAVORITES, icon: Heart, key: "favorites" },
  { to: ROUTES.CHAT_INBOX, icon: MessageCircle, key: "chat" },
];

const STEP_KEYS = ["post", "receive", "choose", "tuition", "review"];

export default function StudentCornerPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const isStudent = user?.role === "STUDENT";
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl bg-primary-light p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="size-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-text">
            {t("studentCorner.title")}
          </h1>
        </div>
        <p className="mt-2 text-text-secondary">
          {isStudent
            ? t("studentCorner.subtitleStudent")
            : t("studentCorner.subtitleGuest")}
        </p>
        {!isStudent && (
          <div className="mt-4">
            <Link to={ROUTES.REGISTER_STUDENT}>
              <Button>{t("studentCorner.registerStudent")}</Button>
            </Link>
          </div>
        )}
      </div>

      {isStudent && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-text">
            {t("studentCorner.shortcutsTitle")}
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
                    {t(`studentCorner.shortcuts.${key}.title`)}
                  </span>
                  <span className="block text-sm text-text-secondary">
                    {t(`studentCorner.shortcuts.${key}.desc`)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-text">
          {t("studentCorner.stepsTitle")}
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {STEP_KEYS.map((key) => (
            <li
              key={key}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-text">
                {t(`studentCorner.steps.${key}`)}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
