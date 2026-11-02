import { useNavigate } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { useRegister } from "@/features/auth/hooks/useAuth";
import { RegisterLayout } from "@/features/auth/components/RegisterLayout";
import {
  buildBasePayload,
  COMMON_DEFAULTS,
  CommonRegisterFields,
  type CommonRegisterValues,
} from "@/features/auth/components/CommonRegisterFields";
import { useSubjects } from "@/features/subject/hooks/useSubjects";

interface TutorFormValues extends CommonRegisterValues {
  experienceYears: number;
  education: string;
  subjectIds: string[];
}

export default function RegisterTutorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const registerMutation = useRegister("TUTOR");
  const { data: subjects = [] } = useSubjects();
  const methods = useForm<TutorFormValues>({
    defaultValues: {
      ...COMMON_DEFAULTS,
      experienceYears: 0,
      education: "",
      subjectIds: [],
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit((v) => {
    registerMutation.mutate(
      {
        ...buildBasePayload(v),
        experienceYears: v.experienceYears,
        education: v.education,
        subjectIds: v.subjectIds,
      },
      {
        onSuccess: () => {
          toast.info(
            "Hồ sơ đang chờ Admin duyệt. Hãy hoàn thiện hồ sơ giảng dạy của bạn.",
          );
          navigate(ROUTES.TUTOR_PROFILE, { replace: true });
        },
      },
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

          <Input
            label="Trường / Học vấn"
            required
            placeholder="VD: Đại học Bách Khoa TP.HCM"
            error={errors.education?.message}
            {...register("education", { required: "Nhập học vấn" })}
          />
          <div className="flex flex-col gap-4">
            <Input
              label="Số năm kinh nghiệm"
              type="number"
              min={0}
              required
              placeholder="Ví dụ: 3"
              error={errors.experienceYears?.message}
              {...register("experienceYears", {
                valueAsNumber: true,
                required: "Nhập số năm kinh nghiệm",
                min: { value: 0, message: "Không được âm" },
              })}
            />

            <Controller
              name="subjectIds"
              control={control}
              rules={{
                validate: (v) => v.length > 0 || "Chọn ít nhất một môn dạy",
              }}
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-text">
                    Môn giảng dạy <span className="text-red-500">*</span>
                  </legend>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subjects.map((s) => {
                      const checked = field.value.includes(s.id);

                      return (
                        <label
                          key={s.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                            checked
                              ? "border-primary bg-primary-light text-primary"
                              : "border-border text-text-secondary hover:border-primary/50"
                          }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              field.onChange(
                                checked
                                  ? field.value.filter((id) => id !== s.id)
                                  : [...field.value, s.id],
                              )
                            }
                            className="accent-primary"
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  {field.value.length > 0 && (
                    <p className="text-xs text-text-secondary">
                      Đã chọn {field.value.length} môn học
                    </p>
                  )}

                  {errors.subjectIds && (
                    <p role="alert" className="text-xs text-red-600">
                      {errors.subjectIds.message}
                    </p>
                  )}
                </fieldset>
              )}
            />
          </div>

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
            Đăng ký gia sư
          </Button>
        </form>
      </FormProvider>
    </RegisterLayout>
  );
}
