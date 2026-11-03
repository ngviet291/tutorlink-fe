import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { useProvinces } from "@/shared/hooks/useAddress";
import type { TeachingMode } from "@/shared/types/common.types";
import type { EducationLevel } from "@/constants/enums";
import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABEL } from "@/constants/enums";

export interface FilterValues {
  subjectId: string;
  province: string;
  teachingMode: TeachingMode | "";
  educationLevels: EducationLevel[];
  min: number;
  max: number;
}

export function emptyFilter(rangeMax: number): FilterValues {
  return {
    subjectId: "",
    province: "",
    teachingMode: "",
    educationLevels: [],
    min: 0,
    max: rangeMax,
  };
}

interface FilterSidebarProps {
  value: FilterValues
  onChange: (v: FilterValues) => void
  rangeLabel?: string
  rangeMax?: number
  rangeStep?: number
  className?: string
  onSearchPerformed?: (resultCount: number) => void
}

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary";

export function FilterSidebar({
  value,
  onChange,
  rangeLabel = "Mức giá",
  rangeMax = 1_000_000,
  rangeStep = 10_000,
  className = "",
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const subjects = useSubjects();
  const provinces = useProvinces();

    const set = (patch: Partial<FilterValues>) => onChange({ ...value, ...patch })

  const toggleLevel = (lvl: EducationLevel) => {
    const next = value.educationLevels.includes(lvl)
      ? value.educationLevels.filter((x) => x !== lvl)
      : [...value.educationLevels, lvl];
    set({ educationLevels: next });
  };

  return (
    <aside
      className={`flex w-full flex-col gap-4 rounded-2xl border border-border bg-surface p-4 lg:w-64 lg:shrink-0 ${className}`}>
      {/* Môn học */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Môn học
        </label>
        <select
          className={fieldClass}
          value={value.subjectId}
          onChange={(e) => set({ subjectId: e.target.value })}>
          <option value="">Tất cả môn</option>

          {(subjects.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tỉnh/Thành: lấy từ API, API lỗi thì cho nhập tay để không chặn lọc */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Khu vực
        </label>
        {provinces.isError ? (
          <input
            className={fieldClass}
            placeholder="Nhập tỉnh/thành"
            value={value.province}
            onChange={(e) => set({ province: e.target.value })}
          />
        ) : (
          <select
            className={fieldClass}
            value={value.province}
            disabled={provinces.isLoading}
            onChange={(e) => set({ province: e.target.value })}>
            <option value="">
              {provinces.isLoading ? "Đang tải..." : "Tất cả tỉnh/thành"}
            </option>
            {(provinces.data ?? []).map((p) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Hình thức dạy
        </label>

        <select
          className={fieldClass}
          value={value.teachingMode}
          onChange={(e) =>
            set({ teachingMode: e.target.value as TeachingMode | "" })
          }>
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
                }`}>
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
        className="mt-1">
        {t("common.reset", { defaultValue: "Đặt lại bộ lọc" })}
      </Button>
    </aside>
  );
}
