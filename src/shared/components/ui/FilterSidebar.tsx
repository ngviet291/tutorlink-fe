import { useProvinces, useWards } from "@/shared/hooks/useAddress";

export interface FilterValue {
  provinceCode?: number;
  wardCode?: number;
}

interface FilterSidebarProps {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  className?: string;
}

const selectClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 " +
  "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400";

export function FilterSidebar({
  value,
  onChange,
  className,
}: FilterSidebarProps) {
  const { provinceCode, wardCode } = value;

  const {
    data: provinces = [],
    isLoading: loadingProvinces,
    isError: provincesError,
  } = useProvinces();

  const {
    data: wards = [],
    isLoading: loadingWards,
    isError: wardsError,
  } = useWards(provinceCode);

  const hasFilter = provinceCode !== undefined || wardCode !== undefined;

  return (
    <aside className={`flex w-full flex-col gap-5 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Bộ lọc</h2>
        {hasFilter && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-sm text-neutral-600 underline-offset-2 hover:underline">
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-province" className="text-sm font-medium">
          Tỉnh/thành phố
        </label>
        <select
          id="filter-province"
          className={selectClass}
          value={provinceCode ?? ""}
          disabled={loadingProvinces}
          onChange={(e) =>
            onChange({
              provinceCode: e.target.value ? Number(e.target.value) : undefined,
              wardCode: undefined, // đổi tỉnh thì reset phường/xã
            })
          }>
          <option value="">Tất cả</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        {provincesError && (
          <p className="text-xs text-red-600">Không tải được danh sách tỉnh.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-ward" className="text-sm font-medium">
          Phường/xã
        </label>
        <select
          id="filter-ward"
          className={selectClass}
          value={wardCode ?? ""}
          disabled={provinceCode === undefined || loadingWards}
          onChange={(e) =>
            onChange({
              provinceCode,
              wardCode: e.target.value ? Number(e.target.value) : undefined,
            })
          }>
          <option value="">
            {provinceCode === undefined ? "Chọn tỉnh trước" : "Tất cả"}
          </option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
        {wardsError && (
          <p className="text-xs text-red-600">
            Không tải được danh sách phường/xã.
          </p>
        )}
      </div>
    </aside>
  );
}
