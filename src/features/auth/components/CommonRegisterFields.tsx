import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { rules } from "@/features/auth/validation/auth.validation";
import { useAddressSelect } from "@/shared/hooks/useAddressSelect";
import { useSendVerificationCode } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/utils/errors";

/** Khớp app.verification.resend-cooldown-seconds của BE */
const RESEND_SECONDS = 60;

export interface CommonRegisterValues {
  fullName: string;
  email: string;
  verificationCode: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  street: string;
  ward: string;
  province: string;
}

export const COMMON_DEFAULTS: CommonRegisterValues = {
  fullName: "Nguyễn Phước Thịnh",
  email: "nguyenphuocthinh020@gmail.com",
  verificationCode: "",
  password: "Admin@123",
  confirmPassword: "Admin@123",
  phone: "0338687106",
  gender: "MALE",
  dateOfBirth: "2005-10-07",
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
    verificationCode: v.verificationCode.trim(),
    password: v.password,
    phone: v.phone,
    gender: v.gender,
    dateOfBirth: v.dateOfBirth,
    address: { street: v.street, ward: v.ward, province: v.province },
  };
}

/** Nhập email, bấm "Gửi mã", nhập mã 6 số nhận qua mail. Mã lưu ở Redis phía BE. */
function EmailVerificationFields() {
  const {
    register,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<CommonRegisterValues>();
  const sendCode = useSendVerificationCode();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const email = watch("email");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = async () => {
    if (!(await trigger("email"))) return;
    const target = getValues("email").trim();
    sendCode.mutate(
      { email: target },
      {
        onSuccess: () => {
          setSentTo(target);
          setCooldown(RESEND_SECONDS);
        },
      },
    );
  };

  const emailChanged = sentTo !== null && sentTo !== email.trim();
  const sent = sentTo !== null && !emailChanged;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            label="Mã xác minh email"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6 chữ số"
            hint={
              sent
                ? `Đã gửi mã tới ${sentTo}. Mã có hiệu lực 10 phút, nhớ kiểm tra cả thư rác.`
                : "Nhập email rồi bấm Gửi mã để nhận mã xác minh."
            }
            error={errors.verificationCode?.message}
            {...register("verificationCode", {
              required: "Nhập mã xác minh",
              pattern: { value: /^\d{6}$/, message: "Mã gồm 6 chữ số" },
            })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-[1.625rem] shrink-0"
          loading={sendCode.isPending}
          disabled={cooldown > 0}
          onClick={() => void send()}
        >
          {cooldown > 0
            ? `Gửi lại (${cooldown}s)`
            : sent
              ? "Gửi lại mã"
              : "Gửi mã"}
        </Button>
      </div>
      {emailChanged && (
        <p className="text-xs text-text-secondary">
          Bạn đã đổi email, hãy gửi lại mã cho email mới.
        </p>
      )}
      {sendCode.isError && (
        <p role="alert" className="text-xs text-danger">
          {getErrorMessage(sendCode.error)}
        </p>
      )}
    </div>
  );
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
      <EmailVerificationFields />
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
