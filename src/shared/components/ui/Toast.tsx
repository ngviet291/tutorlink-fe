import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useAppStore";
import {
  removeToast,
  type ToastItem,
  type ToastKind,
} from "@/shared/store/toastSlice";
import { cn } from "@/shared/utils/cn";
import { useTranslation } from "react-i18next";
import { ApiError, resolveErrorMessage } from "@/config/http/apiError";

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors: Record<ToastKind, string> = {
  success: "text-success-text",
  error: "text-danger-text",
  info: "text-info",
  warning: "text-warning-text",
};

function ToastView({ toast }: { toast: ToastItem }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const Icon = icons[toast.kind];

  useEffect(() => {
    // Lỗi cần thời gian đọc lâu hơn thông báo thành công
    const timer = setTimeout(
      () => dispatch(removeToast(toast.id)),
      toast.kind === "error" ? 7000 : 4000,
    );
    return () => clearTimeout(timer);
  }, [dispatch, toast.id, toast.kind]);

  // Tính chữ lúc render để đổi ngôn ngữ thì toast đang hiện đổi theo.
  const text = toast.apiError
    ? resolveErrorMessage(
        Object.assign(new ApiError(toast.message, toast.apiError.status), {
          rawMessage: toast.apiError.rawMessage,
        }),
      )
    : toast.i18nKey
      ? t(toast.i18nKey, toast.i18nParams)
      : toast.message;

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className="flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-lg"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", colors[toast.kind])} />
      <p className="flex-1 text-sm text-text">{text}</p>
      <button
        type="button"
        aria-label={t("shared.toast.close")}
        className="-m-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => dispatch(removeToast(toast.id))}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const items = useAppSelector((s) => s.toast.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex w-full justify-center sm:justify-end"
        >
          <ToastView toast={item} />
        </div>
      ))}
    </div>
  );
}
