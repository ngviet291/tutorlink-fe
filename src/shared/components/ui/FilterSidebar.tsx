import { useTranslation } from "react-i18next";

import { Button } from "./Button";
import { useSubjects } from "@/features/subject/hooks/useSubjects";

import type { TeachingMode } from "@/shared/types/common.types";
import type { EducationLevel } from "@/constants/enums";

import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABEL } from "@/constants/enums";
import { useProvinces, useWards } from "@/shared/hooks/useAddress";

export interface FilterValues {
  subjectId: string;
  province: string;
  ward?: string;
  teachingMode: TeachingMode | "";
  educationLevels: EducationLevel[];
  min: number;
  max: number;
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
  };
}

interface FilterSidebarProps {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
  rangeLabel?: string;
  rangeMax?: number;
  rangeStep?: number;
  className?: string;
  onSearchPerformed?: (resultCount: number) => void;
  hideProvince?: boolean;
}

export function FilterSidebar({
  value,
  onChange,
  rangeLabel = "Mức giá",
  rangeMax = 1_000_000,
  rangeStep = 10_000,
  className = "",
  // onSearchPerformed,
  hideProvince = false,
}: FilterSidebarProps) {
  const { t } = useTranslation();

  const subjects = useSubjects();

  const { data: provinces = [] } = useProvinces();
  const provinceCode = provinces.find((p) => p.name === value.province)?.code;
  const { data: wards = [], isFetching: wardsLoading } = useWards(provinceCode);
  const set = (patch: Partial<FilterValues>) =>
    onChange({ ...value, ...patch });

  const toggleLevel = (lvl: EducationLevel) => {
    const next = value.educationLevels.includes(lvl)
      ? value.educationLevels.filter((x) => x !== lvl)
      : [...value.educationLevels, lvl];

    set({ educationLevels: next });
  };

  return (
    <aside
      className={`flex w-full flex-col gap-4 rounded-2xl border border-border bg-surface p-4 lg:w-64 lg:shrink-0 ${className}`}
    >
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Môn học
        </label>

        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          value={value.subjectId}
          onChange={(e) => set({ subjectId: e.target.value })}
        >
          <option value="">Tất cả môn</option>

          {(subjects.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {!hideProvince && value.province && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            Phường / Xã
          </label>

          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            value={value.ward ?? ""}
            disabled={wardsLoading}
            onChange={(e) => set({ ward: e.target.value })}
          >
            <option value="">
              {wardsLoading ? "Đang tải..." : "Tất cả phường/xã"}
            </option>

            {wards.map((w) => (
              <option key={w.code} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Hình thức dạy
        </label>

        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          value={value.teachingMode}
          onChange={(e) =>
            set({
              teachingMode: e.target.value as TeachingMode | "",
            })
          }
        >
          <option value="">Tất cả</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="BOTH">Cả hai</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-text-secondary">
          Cấp học
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

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          {rangeLabel}
        </label>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{(value.min / 1000).toFixed(0)}k</span>
          <span className="flex-1 text-center">—</span>
          <span>
            {value.max >= rangeMax
              ? "Max"
              : `${(value.max / 1000).toFixed(0)}k`}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={rangeMax}
          step={rangeStep}
          value={value.min}
          onChange={(e) =>
            set({
              min: Math.min(Number(e.target.value), value.max - rangeStep),
            })
          }
          className="mt-1 w-full accent-primary"
        />

        <input
          type="range"
          min={0}
          max={rangeMax}
          step={rangeStep}
          value={value.max}
          onChange={(e) =>
            set({
              max: Math.max(Number(e.target.value), value.min + rangeStep),
            })
          }
          className="w-full accent-primary"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(emptyFilter(rangeMax))}
        className="mt-1"
      >
        {t("common.reset", {
          defaultValue: "Đặt lại bộ lọc",
        })}
      </Button>
    </aside>
  );
}
