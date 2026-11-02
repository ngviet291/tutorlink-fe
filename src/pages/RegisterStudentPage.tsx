import { useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { getErrorMessage } from "@/shared/utils/errors";
import { useRegister } from "@/features/auth/hooks/useAuth";
import {
  COMMON_DEFAULTS,
  CommonRegisterFields,
  buildBasePayload,
  type CommonRegisterValues,
} from "@/features/auth/components/CommonRegisterFields";
import { RegisterLayout } from "@/features/auth/components/RegisterLayout";

interface StudentFormValues extends CommonRegisterValues {
  grade: string;
  learningGoal: string;
}

const GRADES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Lớp ${i + 1}`,
}));

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister("STUDENT");
  const methods = useForm<StudentFormValues>({
    defaultValues: { ...COMMON_DEFAULTS, grade: "12", learningGoal: "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit((v) => {
    registerMutation.mutate(
      {
        ...buildBasePayload(v),
        grade: v.grade,
        learningGoal: v.learningGoal,
      },
      { onSuccess: () => navigate(ROUTES.DASHBOARD, { replace: true }) },
    );
  });

  return (
    <RegisterLayout>
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-4"
          noValidate>
          <CommonRegisterFields />

          <Select
            label="Lớp"
            required
            options={GRADES}
            error={errors.grade?.message}
            {...register("grade", { required: "Chọn lớp" })}
          />
          <Input
            label="Mục tiêu học tập"
            required
            placeholder="VD: Cải thiện kỹ năng lập trình"
            error={errors.learningGoal?.message}
            {...register("learningGoal", {
              required: "Nhập mục tiêu học tập",
            })}
          />

          {registerMutation.isError && (
            <p
              role="alert"
              className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300">
              {getErrorMessage(registerMutation.error)}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={registerMutation.isPending}>
            Đăng ký học viên
          </Button>
        </form>
      </FormProvider>
    </RegisterLayout>
  );
}
