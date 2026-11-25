import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import { useLogin } from "@/features/auth/hooks/useAuth";
import { rules } from "@/features/auth/validation/auth.validation";
import { AuthShell } from "@/shared/components/layout/AuthShell";

interface FormValues {
  email: string;
  password: string;
}
const LOGIN_KNOWN = ["email"] as const;
export default function LoginPage() {
  const { t } = useTranslation();
  const login = useLogin();
  const form = useForm<FormValues>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;
  const applyServer = useServerFormErrors(form, LOGIN_KNOWN);
  return (
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      <form
        onSubmit={(e) =>
          void handleSubmit((v) =>
            login.mutate(v, {
              onError: applyServer,
            }),
          )(e)
        }
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register("email", rules.email)}
        />
        <Input
          label={t("login.passwordLabel")}
          type="password"
          autoComplete="current-password"
          leftIcon={<Lock className="size-4" />}
          error={errors.password?.message}
          {...register("password", {
            required: t("validation.passwordRequired"),
          })}
        />
        {errors.root?.server && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-text"
          >
            {errors.root.server.message}
          </p>
        )}
        <div className="-mt-2 text-right">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth loading={login.isPending}>
          {t("login.submit")}
        </Button>
        <p className="text-center text-sm text-text-secondary">
          {t("login.noAccount")}{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-primary hover:underline"
          >
            {t("login.registerNow")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
