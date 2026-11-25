import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { useToast } from "@/shared/hooks/useToast";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import { useRegister } from "@/features/auth/hooks/useAuth";
import { RegisterLayout } from "@/features/auth/components/RegisterLayout";
import {
  buildBasePayload,
  COMMON_DEFAULTS,
  COMMON_REGISTER_FIELDS,
  REGISTER_ERROR_ALIASES,
  CommonRegisterFields,
  type CommonRegisterValues,
} from "@/features/auth/components/CommonRegisterFields";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABEL } from "@/constants/enums";
import type { EducationLevel } from "@/shared/types/common.types";
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";

interface TutorFormValues extends CommonRegisterValues {
  experienceYears: number;
  education: string;
  teachingLevels: EducationLevel[];
  subjectIds: string[];
}

const KNOWN = [
  ...COMMON_REGISTER_FIELDS,
  "education",
  "experienceYears",
  "teachingLevels",
  "subjectIds",
] as const;

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const registerMutation = useRegister("TUTOR");
  const { data: subjects = [] } = useSubjects();
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [certErrors, setCertErrors] = useState<Record<string, boolean>>({});

  const methods = useForm<TutorFormValues>({
    defaultValues: {
      ...COMMON_DEFAULTS,
      experienceYears: 0,
      education: "",
      teachingLevels: [],
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
  const applyServer = useServerFormErrors(
    methods,
    KNOWN,
    REGISTER_ERROR_ALIASES,
  );
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
      setCertErrors(Object.fromEntries(missing.map((id) => [id, true])));
      toast.error(t("registerTutor.certMissingToast"));
      return;
    }
    setCertErrors({});
    registerMutation.mutate(
      {
        ...buildBasePayload(v),
        experienceYears: v.experienceYears,
        education: v.education,
        teachingLevels: v.teachingLevels,
        subjectIds: v.subjectIds,
        // File thứ i thuộc môn thứ i: BE ghép đúng cho cả 1 môn lẫn nhiều môn
        certificates: v.subjectIds.map((id) => files[id][0]),
        certificateSubjectIds: v.subjectIds,
      },
      {
        onSuccess: () => {
          toast.info(t("registerTutor.pendingToast"));
          navigate(ROUTES.TUTOR_PROFILE, { replace: true });
        },
        onError: applyServer,
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
          <Step no={1} title={t("registerTutor.step1Title")}>
            <CommonRegisterFields />
          </Step>

          <Step
            no={2}
            title={t("registerTutor.step2Title")}
            hint={t("registerTutor.step2Hint")}
          >
            <Input
              label={t("registerTutor.educationLabel")}
              required
              placeholder={t("registerTutor.educationPlaceholder")}
              error={errors.education?.message}
              {...register("education", {
                required: t("validation.educationRequired"),
                validate: (v) =>
                  v.trim().length > 0 || t("validation.educationRequired"),
              })}
            />
            <Input
              label={t("registerTutor.expLabel")}
              type="number"
              min={0}
              required
              placeholder={t("registerTutor.expPlaceholder")}
              error={errors.experienceYears?.message}
              {...register("experienceYears", {
                valueAsNumber: true,
                required: t("validation.expRequired"),
                min: { value: 0, message: t("validation.expMin") },
                max: { value: 50, message: t("validation.expMax") },
              })}
            />
            <Controller
              name="teachingLevels"
              control={control}
              rules={{
                validate: (v) =>
                  v.length > 0 || t("validation.teachingLevelsRequired"),
              }}
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-text">
                    {t("registerTutor.teachingLevelsLegend")}{" "}
                    <span className="text-danger-text">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {[...EDUCATION_LEVELS, "OTHER" as EducationLevel].map(
                      (lv) => {
                        const checked = field.value.includes(lv);
                        return (
                          <label
                            key={lv}
                            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              checked
                                ? "border-primary bg-primary-light text-primary"
                                : "border-border text-text-secondary hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((x) => x !== lv)
                                    : [...field.value, lv],
                                )
                              }
                              className="accent-primary"
                            />
                            {EDUCATION_LEVEL_LABEL[lv]}
                          </label>
                        );
                      },
                    )}
                  </div>
                  {errors.teachingLevels && (
                    <p role="alert" className="text-xs text-danger-text">
                      {errors.teachingLevels.message}
                    </p>
                  )}
                </fieldset>
              )}
            />
          </Step>

          <Step
            no={3}
            title={t("registerTutor.step3Title")}
            hint={t("registerTutor.step3Hint")}
          >
            <Controller
              name="subjectIds"
              control={control}
              rules={{
                validate: (v) =>
                  v.length > 0 || t("validation.subjectsRequired"),
              }}
              render={({ field }) => (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-text">
                    {t("registerTutor.subjectsLegend")}{" "}
                    <span className="text-danger-text">*</span>
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
                    <p role="alert" className="text-xs text-danger-text">
                      {errors.subjectIds.message}
                    </p>
                  )}
                </fieldset>
              )}
            />

            {selectedIds.length > 0 && (
              <>
                <p className="text-xs text-text-secondary">
                  {t("registerTutor.selectedSummary", {
                    selected: selectedIds.length,
                    withCert: withCertificate,
                  })}
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
                            {subject?.name ??
                              t("registerTutor.subjectFallback")}
                          </h3>
                          <Button
                            variant="ghost"
                            aria-label={t("registerTutor.removeSubject", {
                              name: subject?.name ?? "",
                            })}
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
                            setCertErrors(
                              ({ [id]: _cleared, ...rest }) => rest,
                            );
                          }}
                          maxFiles={1}
                          error={
                            certErrors[id]
                              ? t("registerTutor.certMissing")
                              : undefined
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Step>

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
            {t("registerTutor.submit")}
          </Button>
          <p className="text-center text-xs text-text-secondary">
            {t("registerTutor.footnote")}
          </p>
        </form>
      </FormProvider>
    </RegisterLayout>
  );
}
