import { useMemo } from "react";
import {
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
} from "react-hook-form";
import { useProvinces, useWards } from "./useAddress";

export interface SelectOption {
  value: string;
  label: string;
}

interface Params<T extends FieldValues> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  /** Tên field chứa tỉnh, vd "province" hoặc "address.province". */
  provinceField: Path<T>;
  /** Tên field chứa phường/xã. Bỏ trống nếu form không có ô phường/xã (sẽ không gọi API phường/xã). */
  wardField?: Path<T>;
}

/**
 * Logic chọn tỉnh → phường/xã cho form react-hook-form.
 * - Form lưu TÊN (string) của tỉnh/phường, khớp payload address của BE.
 * - Đổi tỉnh thì xoá phường/xã đã chọn và tải phường/xã của tỉnh mới.
 * - API ngoài lỗi thì `manualEntry = true` để UI cho nhập tay, không chặn người dùng.
 */
export function useAddressSelect<T extends FieldValues>({
  control,
  setValue,
  provinceField,
  wardField,
}: Params<T>) {
  const selectedProvince =
    (useWatch({ control, name: provinceField }) as unknown as
      | string
      | undefined) ?? "";

  const provincesQuery = useProvinces();

  const provinceCode = useMemo(
    () => provincesQuery.data?.find((p) => p.name === selectedProvince)?.code,
    [provincesQuery.data, selectedProvince],
  );

  const wardsQuery = useWards(wardField ? provinceCode : undefined);

  const provinceOptions = useMemo<SelectOption[]>(() => {
    const list = provincesQuery.data ?? [];
    // Giá trị cũ đã lưu (vd "Hà Nội" từ danh sách cũ) không có trong API:
    // vẫn thêm vào để select hiển thị được thay vì để trống.
    const legacy =
      selectedProvince &&
      provincesQuery.data &&
      !list.some((p) => p.name === selectedProvince)
        ? [{ value: selectedProvince, label: selectedProvince }]
        : [];
    return [
      { value: "", label: "Chọn tỉnh / thành phố" },
      ...legacy,
      ...list.map((p) => ({ value: p.name, label: p.name })),
    ];
  }, [provincesQuery.data, selectedProvince]);

  const wardOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: "",
        label: !provinceCode
          ? "Chọn tỉnh trước"
          : wardsQuery.isFetching
            ? "Đang tải..."
            : "Chọn phường / xã",
      },
      ...(wardsQuery.data ?? []).map((w) => ({
        value: w.name,
        label: w.name,
      })),
    ],
    [provinceCode, wardsQuery.data, wardsQuery.isFetching],
  );

  /** Gắn vào `register(provinceField, { onChange })`. */
  const onProvinceChange = () => {
    if (wardField) {
      setValue(wardField, "" as PathValue<T, Path<T>>, {
        shouldValidate: false,
      });
    }
  };

  return {
    provinceOptions,
    wardOptions,
    onProvinceChange,
    isLoadingProvinces: provincesQuery.isLoading,
    isLoadingWards: wardsQuery.isFetching,
    wardDisabled: !provinceCode || wardsQuery.isFetching,
    manualEntry: provincesQuery.isError || wardsQuery.isError,
  };
}
