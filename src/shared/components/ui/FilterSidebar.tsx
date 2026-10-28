import { useState } from 'react'
import { Filter, RotateCcw, X } from 'lucide-react'
import { CITIES, EDUCATION_LEVELS, EDUCATION_LEVEL_LABEL, TEACHING_MODES, TEACHING_MODE_LABEL } from '@/constants/enums'
import type { EducationLevel, TeachingMode } from '@/shared/types/common.types'
import { useSubjects } from '@/features/subject/hooks/useSubjects'
import { Button } from './Button'
import { Select } from './Select'

export interface FilterValues {
  subjectId: string
  city: string
  teachingMode: TeachingMode | ''
  educationLevels: EducationLevel[]
  min: number
  max: number
}

export const emptyFilter = (max: number): FilterValues => ({
  subjectId: '', city: '', teachingMode: '', educationLevels: [], min: 0, max,
})

interface Props {
  value: FilterValues
  onChange: (v: FilterValues) => void
  rangeLabel: string
  rangeMax: number
  rangeStep: number
}

function Panel({ value, onChange, rangeLabel, rangeMax, rangeStep }: Props) {
  const { data: subjects } = useSubjects()
  const set = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) => onChange({ ...value, [k]: v })
  const toggleLevel = (l: EducationLevel) =>
    set('educationLevels', value.educationLevels.includes(l) ? value.educationLevels.filter((x) => x !== l) : [...value.educationLevels, l])

  return (
    <div className="flex flex-col gap-5">
      <Select
        label="Môn học"
        placeholder="Tất cả môn"
        value={value.subjectId}
        onChange={(e) => set('subjectId', e.target.value)}
        options={(subjects ?? []).map((s) => ({ value: s.id, label: s.name }))}
      />
      <Select
        label="Khu vực"
        placeholder="Toàn quốc"
        value={value.city}
        onChange={(e) => set('city', e.target.value)}
        options={CITIES.map((c) => ({ value: c, label: c }))}
      />
      <Select
        label="Hình thức"
        placeholder="Tất cả"
        value={value.teachingMode}
        onChange={(e) => set('teachingMode', e.target.value as TeachingMode | '')}
        options={TEACHING_MODES.map((m) => ({ value: m, label: TEACHING_MODE_LABEL[m] }))}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">{rangeLabel}</legend>
        <p className="text-xs text-text-secondary">
          {value.min.toLocaleString('vi-VN')}đ – {value.max.toLocaleString('vi-VN')}đ
        </p>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          Từ
          <input
            type="range" min={0} max={rangeMax} step={rangeStep} value={value.min}
            onChange={(e) => set('min', Math.min(Number(e.target.value), value.max))}
            className="w-full accent-primary" aria-label={`${rangeLabel} tối thiểu`}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          Đến
          <input
            type="range" min={0} max={rangeMax} step={rangeStep} value={value.max}
            onChange={(e) => set('max', Math.max(Number(e.target.value), value.min))}
            className="w-full accent-primary" aria-label={`${rangeLabel} tối đa`}
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">Cấp học</legend>
        {EDUCATION_LEVELS.map((l) => (
          <label key={l} className="flex cursor-pointer items-center gap-2 text-sm text-text">
            <input
              type="checkbox" checked={value.educationLevels.includes(l)} onChange={() => toggleLevel(l)}
              className="size-4 accent-primary"
            />
            {EDUCATION_LEVEL_LABEL[l]}
          </label>
        ))}
      </fieldset>

      <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilter(rangeMax))}>
        <RotateCcw className="size-4" /> Xóa bộ lọc
      </Button>
    </div>
  )
}

/** Desktop: cột bên; mobile: nút mở ngăn kéo. */
export function FilterSidebar(props: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <aside className="sticky top-20 hidden h-fit w-64 shrink-0 rounded-2xl border border-border bg-surface p-4 lg:block">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
          <Filter className="size-4" /> Bộ lọc
        </h2>
        <Panel {...props} />
      </aside>

      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Filter className="size-4" /> Bộ lọc
        </Button>
        {open && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
            <div role="dialog" aria-modal="true" aria-label="Bộ lọc" className="relative flex h-full w-80 max-w-[90vw] animate-slide-in flex-col bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="font-bold text-text">Bộ lọc</h2>
                <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-surface-hover">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4"><Panel {...props} /></div>
              <div className="border-t border-border p-4">
                <Button fullWidth onClick={() => setOpen(false)}>Áp dụng</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
