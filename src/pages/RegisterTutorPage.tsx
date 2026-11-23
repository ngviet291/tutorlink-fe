import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
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
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";

interface TutorFormValues extends CommonRegisterValues {
  experienceYears: number;
  education: string;
  subjectIds: string[];
}

/** Khối có đánh số bước, cùng kiểu thẻ với trang Hồ sơ giảng dạy. */
function Step({
  no,
  title,
  hint,
  children,
}: {
  no: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {no}
        </span>
        <div>
          <h2 className="text-lg font-bold text-text">{title}</h2>
          {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function RegisterTutorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const registerMutation = useRegister("TUTOR");
  const { data: subjects = [] } = useSubjects();
  // Mỗi môn đúng 1 ảnh chứng chỉ, giống trang Hồ sơ giảng dạy
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [certErrors, setCertErrors] = useState<Record<string, string>>({});

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
    watch,
    formState: { errors },
  } = methods;
  const selectedIds = watch("subjectIds");
  const withCertificate = selectedIds.filter(
    (id) => (files[id]?.length ?? 0) > 0,
  ).length;

  const removeFiles = (id: string) => {
    setFiles(({ [id]: _removed, ...rest }) => rest);
    setCertErrors(({ [id]: _removed, ...rest }) => rest);
  };

  const onSubmit = handleSubmit((v) => {
    // Mỗi môn đã chọn phải có đúng 1 ảnh chứng chỉ
    const missing = v.subjectIds.filter((id) => !files[id]?.length);
    if (missing.length > 0) {
      setCertErrors(
        Object.fromEntries(missing.map((id) => [id, "Môn này cần 1 ảnh chứng chỉ"])),
      );
      toast.error("Mỗi môn học cần có 1 ảnh chứng chỉ / bằng cấp");
      return;
    }
    setCertErrors({});
    registerMutation.mutate(
      {
        ...buildBasePayload(v),
        experienceYears: v.experienceYears,
        education: v.education,
        subjectIds: v.subjectIds,
        // File thứ i thuộc môn thứ i: BE ghép đúng cho cả 1 môn lẫn nhiều môn
        certificates: v.subjectIds.map((id) => files[id][0]),
        certificateSubjectIds: v.subjectIds,
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
          className="flex flex-col gap-5"
          noValidate
        >
          <Step no={1} title="Thông tin tài khoản">
            <CommonRegisterFields />
          </Step>

          <Step
            no={2}
            title="Học vấn và kinh nghiệm"
            hint="Kinh nghiệm riêng từng môn, giá và lịch dạy bạn sẽ bổ sung ở Hồ sơ giảng dạy sau khi đăng ký."
          >
            <Input
              label="Trường / Học vấn"
              required
              placeholder="VD: Cử nhân Sư phạm Toán, ĐH Sư phạm TP.HCM"
              error={errors.education?.message}
              {...register("education", { required: "Nhập học vấn" })}
            />
            <Input
              label="Tổng số năm kinh nghiệm"
              type="number"
              min={0}
              required
              placeholder="Ví dụ: 3"
              error={errors.experienceYears?.message}
              {...register("experienceYears", {
                valueAsNumber: true,
                required: "Nhập số năm kinh nghiệm",
                min: { value: 0, message: "Không được âm" },
                max: { value: 50, message: "Tối đa 50" },
              })}
            />
          </Step>

          <Step
            no={3}
            title="Môn giảng dạy và chứng chỉ"
            hint="Chọn môn bạn dạy, mỗi môn cần 1 ảnh chứng chỉ / bằng cấp. Hệ thống sẽ tự kiểm tra; chứng chỉ nào chưa xác thực được sẽ do Admin duyệt."
          >
            <Controller
              name="subjectIds"
              control={control}
              rules={{
                validate: (v) => v.length > 0 || "Chọn ít nhất một môn dạy",
              }}
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-text">
                    Môn giảng dạy <span className="text-danger">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {subjects.map((s) => {
                      const checked = field.value.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                            checked
                              ? "border-primary bg-primary-light text-primary"
                              : "border-border text-text-secondary hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) removeFiles(s.id);
                              field.onChange(
                                checked
                                  ? field.value.filter((id) => id !== s.id)
                                  : [...field.value, s.id],
                              );
                            }}
                            className="accent-primary"
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.subjectIds && (
                    <p role="alert" className="text-xs text-danger">
                      {errors.subjectIds.message}
                    </p>
                  )}
                </fieldset>
              )}
            />

            {selectedIds.length > 0 && (
              <>
                <p className="text-xs text-text-secondary">
                  Đã chọn {selectedIds.length} môn · {withCertificate}/
                  {selectedIds.length} môn đã có chứng chỉ
                </p>
                <ul className="flex flex-col gap-3">
                  {selectedIds.map((id) => {
                    const subject = subjects.find((s) => s.id === id);
                    return (
                      <li
                        key={id}
                        className="flex flex-col gap-3 rounded-2xl border border-border p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-text">
                            {subject?.name ?? "Môn học"}
                          </h3>
                          <Button
                            variant="ghost"
                            aria-label={`Bỏ môn ${subject?.name ?? ""}`}
                            onClick={() => {
                              removeFiles(id);
                              methods.setValue(
                                "subjectIds",
                                selectedIds.filter((x) => x !== id),
                              );
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <CertificateUpload
                          value={files[id] ?? []}
                          onChange={(next) => {
                            setFiles((prev) => ({ ...prev, [id]: next }));
                            setCertErrors(({ [id]: _cleared, ...rest }) => rest);
                          }}
                          maxFiles={1}
                          error={certErrors[id]}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Step>

          {registerMutation.isError && (
            <p
              role="alert"
              className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-300"
            >
              {getErrorMessage(registerMutation.error)}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={registerMutation.isPending}
          >
            Đăng ký gia sư
          </Button>
          <p className="text-center text-xs text-text-secondary">
            Sau khi đăng ký, bạn sẽ được chuyển tới Hồ sơ giảng dạy để bổ sung
            giới thiệu, khu vực, lịch rảnh và thông tin riêng từng môn.
          </p>
        </form>
      </FormProvider>
    </RegisterLayout>
  );
}
