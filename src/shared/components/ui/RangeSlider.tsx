import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";

interface RangeSliderProps {
  min: number;
  max: number;
  /** Giới hạn dưới/trên của thanh trượt. */
  rangeMax: number;
  step: number;
  onChange: (min: number, max: number) => void;
  format?: (v: number) => string;
  className?: string;
}

/** Hiển thị gọn: 500k, 1,5tr, 10tr. */
export function formatShortVnd(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1).replace(".", ",")}tr`;
  }
  return `${Math.round(v / 1000)}k`;
}

/** Thanh trượt hai đầu trên cùng một đường ray. */
export function RangeSlider({
  min,
  max,
  rangeMax,
  step,
  onChange,
  format = formatShortVnd,
  className,
}: RangeSliderProps) {
  const { t } = useTranslation();
  const pct = (v: number) => (rangeMax === 0 ? 0 : (v / rangeMax) * 100);
  const thumb =
    "pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 " +
    "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 " +
    "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary " +
    "[&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
    "[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="rounded-lg bg-primary-light px-2 py-1 text-primary">
          {format(min)}
        </span>
        <span className="text-text-secondary">
          {t("shared.rangeSlider.to")}
        </span>
        <span className="rounded-lg bg-primary-light px-2 py-1 text-primary">
          {max >= rangeMax ? `${format(rangeMax)}+` : format(max)}
        </span>
      </div>
      <div className="relative h-5">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        <input
          type="range"
          aria-label={t("shared.rangeSlider.minAria")}
          min={0}
          max={rangeMax}
          step={step}
          value={min}
          onChange={(e) =>
            onChange(Math.min(Number(e.target.value), max - step), max)
          }
          className={thumb}
          style={{ zIndex: min > rangeMax - step * 2 ? 5 : 3 }}
        />
        <input
          type="range"
          aria-label={t("shared.rangeSlider.maxAria")}
          min={0}
          max={rangeMax}
          step={step}
          value={max}
          onChange={(e) =>
            onChange(min, Math.max(Number(e.target.value), min + step))
          }
          className={thumb}
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
