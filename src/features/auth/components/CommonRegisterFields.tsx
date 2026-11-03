import { useFormContext } from "react-hook-form";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { rules } from "@/features/auth/validation/auth.validation";
import { useAddressSelect } from "@/shared/hooks/useAddressSelect";

export interface CommonRegisterValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  street: string;
  ward: string;
  province: string;
}

export const COMMON_DEFAULTS: CommonRegisterValues = {
  fullName: "Nguyễn Phước Thịnh",
  email: "nguyenphuocthinh020@gmail.com",
  password: "Admin@123",
  confirmPassword: "Admin@123",
  phone: "0338687106",
  gender: "MALE",
  dateOfBirth: "10/07/2005",
  street: "Tân Hiệp",
  ward: "Xã Tân Thới",
  province: "Tỉnh Đồng Tháp",
};

const GENDERS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
];

/** Chuyển giá trị form phẳng thành payload chung (address lồng nhau). */
export function buildBasePayload(v: CommonRegisterValues) {
  return {
    fullName: v.fullName,
    email: v.email,
    password: v.password,
    phone: v.phone,
    gender: v.gender,
    dateOfBirth: v.dateOfBirth,
    address: { street: v.street, ward: v.ward, province: v.province },
  };
}

export function CommonRegisterFields() {
  const {
    register,
    getValues,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CommonRegisterValues>();

  const {
    provinceOptions,
    wardOptions,
    onProvinceChange,
    wardDisabled,
    isLoadingProvinces,
    manualEntry,
  } = useAddressSelect({
    control,
    setValue,
    provinceField: "province",
    wardField: "ward",
  });

  return (
    <>
      <Input
        label="Họ và tên"
        required
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName", {
          required: "Họ tên là bắt buộc",
          minLength: { value: 2, message: "Họ tên quá ngắn" },
        })}
      />
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        error={errors.email?.message}
        {...register("email", rules.email)}
      />
      <Input
        label="Mật khẩu"
        type="password"
        required
        autoComplete="new-password"
        hint="Tối thiểu 8 ký tự"
        error={errors.password?.message}
        {...register("password", rules.password)}
      />
      <Input
        label="Xác nhận mật khẩu"
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword", {
          required: "Vui lòng nhập lại mật khẩu",
          validate: (v) =>
            v === getValues("password") || "Mật khẩu xác nhận không khớp",
        })}
      />
      <Input
        label="Số điện thoại"
        type="tel"
        required
        autoComplete="tel"
        placeholder="09xx xxx xxx"
        error={errors.phone?.message}
        {...register("phone", rules.phone)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Giới tính"
          required
          options={GENDERS}
          error={errors.gender?.message}
          {...register("gender", { required: "Chọn giới tính" })}
        />
        <Input
          label="Ngày sinh"
          type="date"
          required
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth", { required: "Chọn ngày sinh" })}
        />
      </div>
      <Input
        label="Số nhà, tên đường"
        required
        autoComplete="street-address"
        error={errors.street?.message}
        {...register("street", { required: "Nhập địa chỉ" })}
      />
      <div className="grid grid-cols-2 gap-3">
        {manualEntry ? (
          // API địa chỉ lỗi: cho nhập tay để không chặn đăng ký
          <>
            <Input
              label="Tỉnh / Thành phố"
              required
              error={errors.province?.message}
              {...register("province", { required: "Nhập tỉnh/thành" })}
            />
            <Input
              label="Phường / Xã"
              required
              error={errors.ward?.message}
              {...register("ward", { required: "Nhập phường/xã" })}
            />
          </>
        ) : (
          <>
            <Select
              label="Tỉnh / Thành phố"
              required
              disabled={isLoadingProvinces}
              options={provinceOptions}
              error={errors.province?.message}
              {...register("province", {
                required: "Chọn tỉnh/thành",
                onChange: onProvinceChange,
              })}
            />
            <Select
              label="Phường / Xã"
              required
              disabled={wardDisabled}
              options={wardOptions}
              error={errors.ward?.message}
              {...register("ward", { required: "Chọn phường/xã" })}
            />
          </>
        )}
      </div>
    </>
  );
}
