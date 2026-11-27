import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
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

// Dữ liệu mẫu cho môi trường phát triển, không phải chữ giao diện nên không dịch.
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

/** Field BE trả về -> tên input trong form phẳng (address lồng nhau ở BE). */
export const REGISTER_ERROR_ALIASES: Record<string, string> = {
  "address.street": "street",
  "address.ward": "ward",
  "address.province": "province",
};

export const COMMON_REGISTER_FIELDS = [
  "fullName",
  "email",
  "verificationCode",
  "password",
  "confirmPassword",
  "phone",
  "gender",
  "dateOfBirth",
  "street",
  "ward",
  "province",
] as const;

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
  const { t } = useTranslation();
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
            label={t("auth.commonRegisterFields.verificationLabel")}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t("auth.commonRegisterFields.codePlaceholder")}
            hint={
              sent
                ? t("auth.commonRegisterFields.codeSent", { email: sentTo })
                : t("auth.commonRegisterFields.codePrompt")
            }
            error={errors.verificationCode?.message}
            {...register("verificationCode", {
              required: t("validation.verificationRequired"),
              pattern: {
                value: /^\d{6}$/,
                message: t("validation.verificationFormat"),
              },
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
            ? t("auth.commonRegisterFields.resendIn", { seconds: cooldown })
            : sent
              ? t("auth.commonRegisterFields.resend")
              : t("auth.commonRegisterFields.send")}
        </Button>
      </div>
      {emailChanged && (
        <p className="text-xs text-text-secondary">
          {t("auth.commonRegisterFields.emailChanged")}
        </p>
      )}
      {sendCode.isError && (
        <p role="alert" className="text-xs text-danger-text">
          {getErrorMessage(sendCode.error)}
        </p>
      )}
    </div>
  );
}

export function CommonRegisterFields() {
  const { t } = useTranslation();
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

  // Dựng lúc render để nhãn đổi theo ngôn ngữ.
  const genders = [
    { value: "MALE", label: t("profile.male") },
    { value: "FEMALE", label: t("profile.female") },
  ];

  return (
    <>
      <Input
        label={t("auth.fullName")}
        required
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName", {
          required: t("validation.fullNameRequired"),
          validate: (v) => v.trim().length >= 2 || t("validation.fullNameMin"),
        })}
      />
      <Input
        label={t("auth.email")}
        type="email"
        required
        autoComplete="email"
        error={errors.email?.message}
        {...register("email", rules.email)}
      />
      <EmailVerificationFields />
      <Input
        label={t("auth.password")}
        type="password"
        required
        autoComplete="new-password"
        hint={t("validation.passwordHint")}
        error={errors.password?.message}
        {...register("password", {
          ...rules.password,
          // đổi mật khẩu thì kiểm tra lại ô xác nhận
          deps: ["confirmPassword"],
        })}
      />
      <Input
        label={t("auth.confirmPassword")}
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword", {
          required: t("validation.confirmRequired"),
          validate: (v) =>
            v === getValues("password") || t("validation.confirmMismatch"),
        })}
      />
      <Input
        label={t("auth.phone")}
        type="tel"
        required
        autoComplete="tel"
        placeholder="09xx xxx xxx"
        error={errors.phone?.message}
        {...register("phone", rules.phone)}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label={t("profile.gender")}
          required
          options={genders}
          error={errors.gender?.message}
          {...register("gender", { required: t("validation.genderRequired") })}
        />
        <Input
          label={t("auth.dateOfBirth")}
          type="date"
          required
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth", {
            required: t("validation.dobRequired"),
            validate: (v) =>
              v <= new Date().toISOString().slice(0, 10) ||
              t("validation.dobFuture"),
          })}
        />
      </div>
      <Input
        label={t("auth.commonRegisterFields.street")}
        required
        autoComplete="street-address"
        error={errors.street?.message}
        {...register("street", {
          required: t("validation.streetRequired"),
          validate: (v) =>
            v.trim().length > 0 || t("validation.streetRequired"),
        })}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {manualEntry ? (
          // API địa chỉ lỗi: cho nhập tay để không chặn đăng ký
          <>
            <Input
              label={t("auth.commonRegisterFields.province")}
              required
              error={errors.province?.message}
              {...register("province", {
                required: t("validation.provinceEnter"),
              })}
            />
            <Input
              label={t("auth.commonRegisterFields.ward")}
              required
              error={errors.ward?.message}
              {...register("ward", { required: t("validation.wardEnter") })}
            />
          </>
        ) : (
          <>
            <Select
              label={t("auth.commonRegisterFields.province")}
              required
              disabled={isLoadingProvinces}
              options={provinceOptions}
              error={errors.province?.message}
              {...register("province", {
                required: t("validation.provinceSelect"),
                onChange: onProvinceChange,
              })}
            />
            <Select
              label={t("auth.commonRegisterFields.ward")}
              required
              disabled={wardDisabled}
              options={wardOptions}
              error={errors.ward?.message}
              {...register("ward", { required: t("validation.wardSelect") })}
            />
          </>
        )}
      </div>
    </>
  );
}
