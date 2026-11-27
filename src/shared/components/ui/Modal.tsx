import { type ReactNode, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  /** Đang xử lý (gửi form...): chặn đóng bằng Esc / nền / nút X để tránh mất thao tác giữa chừng. */
  busy?: boolean;
}

const SIZE_CLASS = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const CLOSE_BUTTON_CLASS =
  "flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  maxWidth,
  size = "md",
  footer,
  busy = false,
}: ModalProps) {
  const { t } = useTranslation();
  const widthClass = maxWidth ?? SIZE_CLASS[size];
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // khóa cuộn nền

    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busyRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      // Giữ focus trong hộp thoại
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.(); // trả focus về nút đã mở modal
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
        aria-hidden
      />

      {/* Panel: dạng bottom-sheet trên mobile, hộp thoại giữa màn hình từ sm trở lên */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative max-h-[92dvh] w-full overflow-y-auto ${widthClass} rounded-t-2xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none sm:rounded-2xl sm:p-6 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-busy={busy || undefined}
      >
        {title && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-bold text-text">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={`-mr-2 -mt-2 shrink-0 ${CLOSE_BUTTON_CLASS}`}
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={`absolute right-3 top-3 ${CLOSE_BUTTON_CLASS}`}
            aria-label={t("common.close")}
          >
            <X className="size-5" />
          </button>
        )}
        {children}
        {footer && (
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
