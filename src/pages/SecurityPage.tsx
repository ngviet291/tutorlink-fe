import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useToast } from "@/shared/hooks/useToast";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import { rules } from "@/features/auth/validation/auth.validation";
import { useChangePassword } from "@/features/user/hooks/useUser";

const NO_KNOWN_FIELDS = [] as const;

interface PwForm {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}

export default function SecurityPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const toast = useToast();
  const change = useChangePassword();
  const pw = useForm<PwForm>();

  // Khi đổi ngôn ngữ: validate lại các ô đang lỗi để chữ lỗi đổi theo.
  useServerFormErrors(pw, NO_KNOWN_FIELDS);

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={t("profile.security.title")}
        description={t("profile.security.description")}
      />

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-bold text-text">
          {t("profile.changePasswordTitle")}
        </h2>
        <p className="mb-4 mt-1 text-sm text-text-secondary">
          {t("profile.security.passwordHint")}
        </p>
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
            {...pw.register("newPassword", {
              ...rules.password,
              validate: (v) =>
                v !== pw.getValues("currentPassword") ||
                t("profile.passwordSameAsCurrent"),
            })}
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
