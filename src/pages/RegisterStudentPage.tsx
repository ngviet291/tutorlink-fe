import { useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { useRegister } from "@/features/auth/hooks/useAuth";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import {
  COMMON_DEFAULTS,
  COMMON_REGISTER_FIELDS,
  REGISTER_ERROR_ALIASES,
  CommonRegisterFields,
  buildBasePayload,
  type CommonRegisterValues,
} from "@/features/auth/components/CommonRegisterFields";
import { RegisterLayout } from "@/features/auth/components/RegisterLayout";

interface StudentFormValues extends CommonRegisterValues {
  grade: string;
  learningGoal: string;
}

const KNOWN = [...COMMON_REGISTER_FIELDS, "grade", "learningGoal"] as const;

export default function RegisterStudentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister("STUDENT");

  const methods = useForm<StudentFormValues>({
    defaultValues: {
      ...COMMON_DEFAULTS,
      grade: "12",
      learningGoal: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const applyServer = useServerFormErrors(
    methods,
    KNOWN,
    REGISTER_ERROR_ALIASES,
  );
  const gradeOptions = [
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: t("registerStudent.grade", { n: i + 1 }),
    })),
    { value: "UNIVERSITY", label: t("registerStudent.university") },
    { value: "OTHER", label: t("registerStudent.other") },
  ];

  const onSubmit = handleSubmit((v) => {
    registerMutation.mutate(
      {
        ...buildBasePayload(v),
        grade: v.grade,
        learningGoal: v.learningGoal,
      },
      {
        onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
        onError: applyServer,
      },
    );
  });

  return (
    <RegisterLayout>
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <CommonRegisterFields />

          <Select
            label={t("registerStudent.gradeLabel")}
            required
            options={gradeOptions}
            error={errors.grade?.message}
            {...register("grade", {
              required: t("validation.gradeRequired"),
            })}
          />

          <Input
            label={t("registerStudent.learningGoalLabel")}
            required
            placeholder={t("registerStudent.learningGoalPlaceholder")}
            error={errors.learningGoal?.message}
            {...register("learningGoal", {
              required: t("validation.goalRequired"),
              validate: (v) =>
                v.trim().length > 0 || t("validation.goalRequired"),
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

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={registerMutation.isPending}
          >
            {t("registerStudent.submit")}
          </Button>
        </form>
      </FormProvider>
    </RegisterLayout>
  );
}
