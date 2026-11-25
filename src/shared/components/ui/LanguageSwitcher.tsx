import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";

const LANGS = [
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "en", label: "EN", name: "English" },
] as const;

/** Nút chuyển ngôn ngữ Việt / Anh. Lựa chọn được lưu lại cho lần mở sau (xem app/i18n.ts). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "vi";

  return (
    <div
      role="group"
      aria-label="Language / Ngôn ngữ"
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs font-bold",
        className,
      )}
    >
      {LANGS.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          title={name}
          aria-label={name}
          aria-pressed={current === code}
          onClick={() => void i18n.changeLanguage(code)}
          className={cn(
            "cursor-pointer rounded-md px-2 py-1 transition-colors",
            current === code
              ? "bg-primary text-white"
              : "text-text-secondary hover:bg-surface-hover",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
