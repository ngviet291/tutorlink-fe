import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  /**
   * Hạn cuối do BE trả về (ApplicationResponse.expiresAt).
   * BE tính theo đúng config expiry window nên FE không cần hardcode 24h.
   */
  expiresAt?: string;
  /**
   * Hành động sắp hết hạn đã được DỊCH (vd t("applicantRow.actionConfirm")),
   * hiển thị trong câu countdown.
   */
  actionLabel: string;
  /** Gọi đúng 1 lần khi đếm về 0 để parent refetch trạng thái mới (scheduler BE đổi sang CANCELLED). */
  onExpire?: () => void;
  className?: string;
}

/** Đếm ngược: >1h hiển thị "XgYYp" (vi) / "XhYYm" (en), <=1h hiển thị "MM:SS". */
function formatRemaining(
  ms: number,
  hourUnit: string,
  minuteUnit: string,
): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}${hourUnit}${String(m).padStart(2, "0")}${minuteUnit}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExpiryCountdown({
  expiresAt,
  actionLabel,
  onExpire,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);

  // expiresAt là ISO instant từ BE; parse 1 lần, so với now tick mỗi giây.
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const remaining = target != null ? target - now : null;
  const expired = remaining != null && remaining <= 0;

  useEffect(() => {
    if (target == null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  // Hết hạn -> báo parent refetch 1 lần (tránh spam mỗi giây).
  useEffect(() => {
    if (expired && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [expired, onExpire]);

  if (target == null) return null;

  // < 5 phút còn lại -> màu cảnh báo; đã hết -> đỏ.
  const urgent = !expired && remaining != null && remaining < 5 * 60 * 1000;
  const color = expired
    ? "text-danger-text"
    : urgent
      ? "text-warning-text"
      : "text-text-secondary";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${className}`}
      title={expiresAt}
    >
      <Clock className="size-3.5" />
      {expired
        ? t("application.expiryCountdown.expired")
        : t("application.expiryCountdown.remaining", {
            time: formatRemaining(
              remaining ?? 0,
              t("application.expiryCountdown.hourUnit"),
              t("application.expiryCountdown.minuteUnit"),
            ),
            action: actionLabel,
          })}
    </span>
  );
}
