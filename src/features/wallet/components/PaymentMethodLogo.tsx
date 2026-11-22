import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface Props {
  /** Đường dẫn logo (đặt trong public/); lỗi hoặc chưa có thì dùng biểu tượng thay thế. */
  src?: string;
  alt: string;
  fallbackIcon: LucideIcon;
  active?: boolean;
}

/** Logo phương thức thanh toán, tự quay về biểu tượng khi không tải được ảnh. */
export function PaymentMethodLogo({
  src,
  alt,
  fallbackIcon: Icon,
  active = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-primary text-white"
            : "bg-surface-hover text-text-secondary",
        )}>
        <Icon className="size-5" />
      </span>
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-1">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </span>
  );
}
