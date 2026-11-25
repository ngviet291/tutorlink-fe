import { useEffect, useRef, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Select } from "@/shared/components/ui/Select";
import { Avatar } from "@/shared/components/ui/Avatar";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useAddressSelect } from "@/shared/hooks/useAddressSelect";
import { useToast } from "@/shared/hooks/useToast";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import { rules } from "@/features/auth/validation/auth.validation";
import {
  useChangePassword,
  useUpdateProfile,
  useUploadAvatar,
} from "@/features/user/hooks/useUser";
import type { UpdateProfilePayload } from "@/features/user/types/user.types";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const NO_KNOWN_FIELDS = [] as const;

interface PwForm {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const toast = useToast();
  const update = useUpdateProfile();
  const change = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.chooseImage"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(
        t("profile.avatarTooLarge", { max: AVATAR_MAX_BYTES / 1024 / 1024 }),
      );
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success(t("profile.avatarUpdated")),
      onError: (er) => toast.apiError(er),
    });
  };

  const info = useForm<UpdateProfilePayload>({
    defaultValues: {
      fullName: user?.fullName,
      phone: user?.phone,
      address: {
        province: user?.address?.province ?? "",
        ward: user?.address?.ward ?? "",
      },
    },
  });
  const pw = useForm<PwForm>();

  // Khi đổi ngôn ngữ: validate lại các ô đang lỗi để chữ lỗi đổi theo.
  useServerFormErrors(info, NO_KNOWN_FIELDS);
  useServerFormErrors(pw, NO_KNOWN_FIELDS);

  // Phải gọi trước `return null` (quy tắc hooks)
  const {
    provinceOptions,
    wardOptions,
    onProvinceChange,
    isLoadingProvinces,
    isLoadingWards,
    wardDisabled,
    manualEntry,
  } = useAddressSelect<UpdateProfilePayload>({
    control: info.control,
    setValue: info.setValue,
    provinceField: "address.province",
    wardField: "address.ward",
  });

  // <select> dùng register là uncontrolled: lúc mount chưa có option nên giá trị đã lưu
  // không hiển thị. Set lại đúng một lần khi danh sách tỉnh / phường-xã đã tải xong.
  const savedProvince = user?.address?.province ?? "";
  const savedWard = user?.address?.ward ?? "";
  const provinceSynced = useRef(false);
  const wardSynced = useRef(false);

  useEffect(() => {
    if (
      provinceSynced.current ||
      isLoadingProvinces ||
      provinceOptions.length <= 1
    )
      return;
    provinceSynced.current = true;
    info.setValue("address.province", savedProvince);
  }, [isLoadingProvinces, provinceOptions, savedProvince, info]);

  useEffect(() => {
    if (wardSynced.current || isLoadingWards || wardOptions.length <= 1) return;
    wardSynced.current = true;
    info.setValue("address.ward", savedWard);
  }, [isLoadingWards, wardOptions, savedWard, info]);

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={t("profile.title")} />

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            aria-label={t("profile.changeAvatar")}
            disabled={uploadAvatar.isPending}
            onClick={() => fileRef.current?.click()}
            className="group relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            <Avatar name={user.fullName} src={user.avatarUrl} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-5" aria-hidden="true" />
            </span>
            {/* Huy hiệu luôn hiện để người dùng cảm ứng (không có hover) biết ảnh bấm đổi được */}
            <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-white">
              <Camera className="size-3.5" aria-hidden="true" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
          <div>
            <p className="font-bold text-text">{user.fullName}</p>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) =>
            void info.handleSubmit((v) =>
              update.mutate(v, {
                onSuccess: () => toast.success(t("profile.infoUpdated")),
                onError: (er) => toast.apiError(er),
              }),
            )(e)
          }
        >
          <Input
            label={t("profile.fullName")}
            required
            error={info.formState.errors.fullName?.message}
            {...info.register("fullName", {
              required: t("profile.fullNameRequired"),
            })}
          />
          <Input
            label="Email"
            value={user.email}
            disabled
            readOnly
            hint={t("profile.emailHint")}
          />
          <Input
            label={t("profile.phone")}
            required
            error={info.formState.errors.phone?.message}
            {...info.register("phone", rules.phone)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {/* API địa chỉ lỗi: cho nhập tay để không chặn cập nhật hồ sơ */}
            {manualEntry ? (
              <>
                <Input
                  label={t("common.province")}
                  {...info.register("address.province")}
                />
                <Input
                  label={t("profile.ward")}
                  {...info.register("address.ward")}
                />
              </>
            ) : (
              <>
                <Select
                  label={t("common.province")}
                  options={provinceOptions}
                  disabled={isLoadingProvinces}
                  {...info.register("address.province", {
                    onChange: onProvinceChange,
                  })}
                />
                <Select
                  label={t("profile.ward")}
                  options={wardOptions}
                  disabled={wardDisabled}
                  {...info.register("address.ward")}
                />
              </>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={update.isPending}>
              {t("profile.save")}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-text">
          {t("profile.changePasswordTitle")}
        </h2>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) =>
            void pw.handleSubmit((v) =>
              change.mutate(
                {
                  currentPassword: v.currentPassword,
                  newPassword: v.newPassword,
                },
                {
                  onSuccess: () => {
                    toast.success(t("profile.passwordChanged"));
                    pw.reset();
                  },
                  onError: (er) => toast.apiError(er),
                },
              ),
            )(e)
          }
        >
          <Input
            label={t("profile.currentPassword")}
            type="password"
            autoComplete="current-password"
            required
            error={pw.formState.errors.currentPassword?.message}
            {...pw.register("currentPassword", {
              required: t("profile.currentPasswordRequired"),
            })}
          />
          <Input
            label={t("profile.newPassword")}
            type="password"
            autoComplete="new-password"
            required
            error={pw.formState.errors.newPassword?.message}
            {...pw.register("newPassword", rules.password)}
          />
          <Input
            label={t("profile.confirmPassword")}
            type="password"
            autoComplete="new-password"
            required
            error={pw.formState.errors.confirm?.message}
            {...pw.register("confirm", {
              required: t("profile.confirmRequired"),
              validate: (v) =>
                v === pw.getValues("newPassword") ||
                t("profile.passwordMismatch"),
            })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={change.isPending}>
              {t("profile.changePasswordButton")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
