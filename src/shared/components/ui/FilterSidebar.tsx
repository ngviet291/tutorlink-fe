import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./Button";
import { RangeSlider } from "./RangeSlider";
import { useSubjects } from "@/features/subject/hooks/useSubjects";

import type { BudgetUnit, TeachingMode } from "@/shared/types/common.types";
import type { EducationLevel } from "@/constants/enums";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  BUDGET_UNIT_LABEL,
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABEL,
} from "@/constants/enums";
import { useProvinces, useWards } from "@/shared/hooks/useAddress";
import { useDebounce } from "@/shared/hooks/useDebounce";

export interface FilterValues {
  subjectId: string;
  province: string;
  ward?: string;
  teachingMode: TeachingMode | "";
  educationLevels: EducationLevel[];
  min: number;
  max: number;
  /** Đơn vị học phí khi lọc bài đăng; "" = không lọc theo giá. */
  budgetUnit: BudgetUnit | "";
}

/** Khoảng giá hợp lý cho từng đơn vị học phí. */
export const BUDGET_RANGE_BY_UNIT: Record<
  BudgetUnit,
  { max: number; step: number }
> = {
  PER_SESSION: { max: 1_000_000, step: 50_000 },
  PER_MONTH: { max: 10_000_000, step: 100_000 },
  PER_HOUR: { max: 500_000, step: 10_000 },
};
const UNIT_ORDER: BudgetUnit[] = ["PER_SESSION", "PER_MONTH", "PER_HOUR"];

/** Tham số lọc giá gửi lên BE: chỉ lọc khi đã chọn đơn vị. */
export function budgetQuery(f: FilterValues) {
  if (!f.budgetUnit) return {};
  const { max } = BUDGET_RANGE_BY_UNIT[f.budgetUnit];
  return {
    budgetUnit: f.budgetUnit,
    minBudget: f.min > 0 ? f.min : undefined,
    maxBudget: f.max < max ? f.max : undefined,
  };
}

export function emptyFilter(rangeMax: number): FilterValues {
  return {
    subjectId: "",
    province: "",
    ward: "",
    teachingMode: "",
    educationLevels: [],
    min: 0,
    max: rangeMax,
    budgetUnit: "",
  };
}

interface FilterSidebarProps {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
  /** Nếu không truyền, dùng nhãn mặc định "Mức giá" theo ngôn ngữ hiện tại. */
  rangeLabel?: string;
  rangeMax?: number;
  rangeStep?: number;
  /** Bật chọn đơn vị học phí (buổi/tháng/giờ) và khoảng giá theo đơn vị đó. */
  budgetUnitMode?: boolean;
  className?: string;
  onSearchPerformed?: (resultCount: number) => void;
  hideProvince?: boolean;
  /** Ẩn bộ lọc mà trang không dùng (tránh hiện ô lọc nhưng không có tác dụng) */
  hideWard?: boolean;
  hideTeachingMode?: boolean;
  hideEducationLevels?: boolean;
}

export function FilterSidebar({
  value,
  onChange,
  rangeLabel,
  rangeMax = 1_000_000,
  rangeStep = 10_000,
  budgetUnitMode = false,
  className = "",
  // onSearchPerformed,
  hideProvince = false,
  hideWard = false,
  hideTeachingMode = false,
  hideEducationLevels = false,
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Giá trị mặc định phải tính lúc render để đổi VI/EN có hiệu lực ngay
  const priceLabel = rangeLabel ?? t("shared.filterSidebar.priceRange");

  const subjects = useSubjects();

  const { data: provinces = [] } = useProvinces();
  const provinceCode = provinces.find((p) => p.name === value.province)?.code;
  const { data: wards = [], isFetching: wardsLoading } = useWards(provinceCode);
  const set = (patch: Partial<FilterValues>) =>
    onChange({ ...value, ...patch });

  // Kéo thanh giá: cập nhật UI ngay (range), chỉ báo lên cha sau khi dừng kéo 400ms
  // để không gọi API/refetch liên tục.
  const [range, setRange] = useState({ min: value.min, max: value.max });
  const debouncedRange = useDebounce(range, 400);

  // Đồng bộ ngược khi cha đổi (bấm Đặt lại, đổi đơn vị học phí...)
  useEffect(() => {
    setRange((r) =>
      r.min === value.min && r.max === value.max
        ? r
        : { min: value.min, max: value.max },
    );
  }, [value.min, value.max]);

  // Đẩy giá trị đã debounce lên cha (chỉ khi thực sự khác)
  useEffect(() => {
    if (debouncedRange.min !== value.min || debouncedRange.max !== value.max) {
      onChange({ ...value, min: debouncedRange.min, max: debouncedRange.max });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRange]);

  const toggleLevel = (lvl: EducationLevel) => {
    const isActive = value.educationLevels.includes(lvl);
    set({ educationLevels: isActive ? [] : [lvl] });
  };

  return (
    <aside
      className={`w-full rounded-2xl border border-border bg-surface p-4 lg:w-64 lg:shrink-0 ${className}`}
    >
      <button
        type="button"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-text lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("shared.filterSidebar.toggle")}
        </span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            mobileOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "flex-col gap-4 lg:mt-0 lg:flex",
          mobileOpen ? "mt-4 flex" : "hidden",
        )}
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            {t("shared.filterSidebar.subject")}
          </label>

          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            value={value.subjectId}
            onChange={(e) => set({ subjectId: e.target.value })}
          >
            <option value="">{t("shared.filterSidebar.allSubjects")}</option>

            {(subjects.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {!hideProvince && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              {t("shared.filterSidebar.province")}
            </label>

            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={value.province}
              onChange={(e) => set({ province: e.target.value, ward: "" })}
            >
              <option value="">{t("shared.filterSidebar.allProvinces")}</option>

              {provinces.map((p) => (
                <option key={p.code} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {!hideProvince && !hideWard && value.province && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              {t("shared.filterSidebar.ward")}
            </label>

            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={value.ward ?? ""}
              disabled={wardsLoading}
              onChange={(e) => set({ ward: e.target.value })}
            >
              <option value="">
                {wardsLoading
                  ? t("common.loading")
                  : t("shared.filterSidebar.allWards")}
              </option>

              {wards.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {!hideTeachingMode && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              {t("shared.filterSidebar.teachingMode")}
            </label>

            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={value.teachingMode}
              onChange={(e) =>
                set({
                  teachingMode: e.target.value as TeachingMode | "",
                })
              }
            >
              <option value="">{t("shared.filterSidebar.all")}</option>
              <option value="ONLINE">{t("common.teachingMode.ONLINE")}</option>
              <option value="OFFLINE">
                {t("common.teachingMode.OFFLINE")}
              </option>
              <option value="BOTH">{t("shared.filterSidebar.both")}</option>
            </select>
          </div>
        )}

        {!hideEducationLevels && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text-secondary">
              {t("shared.filterSidebar.educationLevel")}
            </p>

            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((lvl) => {
                const active = value.educationLevels.includes(lvl);

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-text-secondary hover:border-primary hover:text-primary"
                    }`}
                  >
                    {EDUCATION_LEVEL_LABEL[lvl]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {budgetUnitMode ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-text-secondary">
              {priceLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {UNIT_ORDER.map((u) => {
                const active = value.budgetUnit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set(
                        active
                          ? { budgetUnit: "", min: 0, max: rangeMax }
                          : {
                              budgetUnit: u,
                              min: 0,
                              max: BUDGET_RANGE_BY_UNIT[u].max,
                            },
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-text-secondary hover:border-primary hover:text-primary"
                    }`}
                  >
                    {BUDGET_UNIT_LABEL[u]}
                  </button>
                );
              })}
            </div>
            {value.budgetUnit ? (
              <RangeSlider
                min={range.min}
                max={range.max}
                rangeMax={BUDGET_RANGE_BY_UNIT[value.budgetUnit].max}
                step={BUDGET_RANGE_BY_UNIT[value.budgetUnit].step}
                onChange={(mn, mx) => setRange({ min: mn, max: mx })}
                className="mt-4"
              />
            ) : (
              <p className="mt-2 text-xs text-text-secondary">
                {t("shared.filterSidebar.pickUnitHint")}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              {priceLabel}
            </label>
            <RangeSlider
              min={range.min}
              max={range.max}
              rangeMax={rangeMax}
              step={rangeStep}
              onChange={(mn, mx) => setRange({ min: mn, max: mx })}
              className="mt-2"
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(emptyFilter(rangeMax))}
          className="mt-1 !bg-[#F97316] !text-white !opacity-100 hover:!bg-[#EA580C] disabled:!opacity-100"
        >
          {t("shared.filterSidebar.reset")}
        </Button>
      </div>
    </aside>
  );
}
