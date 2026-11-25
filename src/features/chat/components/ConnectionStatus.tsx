import { useTranslation } from "react-i18next";
import { useRealtimeStatus } from "@/shared/realtime/useRealtimeStatus";
import { cn } from "@/shared/utils/cn";
import type { RealtimeStatus } from "@/config/realtime/realtime.types";

const DOT: Record<RealtimeStatus, string> = {
  connected: "bg-online",
  connecting: "animate-pulse bg-warning",
  disconnected: "bg-text-secondary",
  error: "bg-danger",
};

/** Chấm + nhãn trạng thái kết nối realtime. */
export function ConnectionStatus({ className }: { className?: string }) {
  const { t } = useTranslation();
  const status = useRealtimeStatus();

  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-1 text-xs text-text-secondary",
        className,
      )}
    >
      <span
        className={cn("size-2 rounded-full", DOT[status])}
        aria-hidden="true"
      />
      {t(`chat.connectionStatus.${status}`)}
    </p>
  );
}
