import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import {
  EDUCATION_LEVELS,
  TEACHING_MODES,
  EDUCATION_LEVEL_LABEL,
  TEACHING_MODE_LABEL,
  POST_TYPE_LABEL,
} from "@/constants/enums";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";

import { useSubjects } from "@/features/subject/hooks/useSubjects";
import type { PostPayload, PostResponse } from "../types/post.types";
import type { EducationLevel, PostType } from "@/shared/types/common.types";

import { useAddressSelect } from "@/shared/hooks/useAddressSelect";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";

import {
  markPostFormCompleted,
  usePostFormAbandonTracking,
} from "@/features/tracking/hooks";
import { intlLocale } from "@/shared/utils/locale";
import { useTutorProfile } from "@/features/tutor/hooks/useTutors";

// Dữ liệu test khi DEV + tạo mới (tính theo ngôn ngữ hiện tại).
const getTestDefaults = (
  t: TFunction,
): Record<PostType, Partial<PostPayload>> => ({
  FIND_TUTOR: {
    title: t("post.postForm.dev.findTutorTitle"),
    content: t("post.postForm.dev.findTutorContent"),
    educationLevel: "HIGH_SCHOOL",
    teachingMode: "BOTH",
    budgetUnit: "PER_SESSION",
    minBudget: 150000,
    maxBudget: 250000,
    sessionsPerWeek: 3,
    durationMinutes: 90,
  },

  FIND_STUDENT: {
    title: t("post.postForm.dev.findStudentTitle"),
    content: t("post.postForm.dev.findStudentContent"),
    educationLevel: "HIGH_SCHOOL",
    teachingMode: "ONLINE",
    budgetUnit: "PER_SESSION",
    minBudget: 200000,
    maxBudget: 300000,
    sessionsPerWeek: 2,
    durationMinutes: 120,
  },
});

/** Khớp BudgetRangeValidator của BE. */
const BUDGET_MIN_EXCLUSIVE = 10000;
const BUDGET_MAX = 5000000;

/** Tên input trong form; field BE trả về ngoài danh sách này sẽ hiện ở root.server. */
const FORM_FIELDS = [
  "title",
  "content",
  "subjectId",
  "educationLevel",
  "teachingMode",
  "budgetUnit",
  "minBudget",
  "maxBudget",
  "sessionsPerWeek",
  "durationMinutes",
  "deadline",
  "address.street",
  "address.ward",
  "address.province",
] as const;

const TITLE_MAX = 255;
const CONTENT_MAX = 5000;

interface PostFormProps {
  defaultValues?: Partial<PostResponse>;

  onSubmit: (
    payload: PostPayload,
    asDraft?: boolean,
  ) => Promise<void | Record<string, string>>;

  isSubmitting?: boolean;
}

export function PostForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: PostFormProps) {
  const { t } = useTranslation();

  const { data: allSubjects = [] } = useSubjects();

  const profile = useTutorProfile();

  // Role quyết định loại bài đăng.
  const role = useAppSelector((s) => s.auth.user?.role);
  const isTutor = role === "TUTOR";

  // Gia sư chỉ được đăng theo môn / cấp học trong hồ sơ của mình (lấy từ Redux);
  // chưa có hồ sơ (tải lỗi) hoặc không phải gia sư thì dùng danh sách đầy đủ.
  const tutorSubjects = isTutor ? profile?.subjects : undefined;
  const tutorLevels = isTutor ? profile?.educationLevels : undefined;

  const subjects = useMemo(() => {
    const base: { id: string; name: string }[] = tutorSubjects?.length
      ? tutorSubjects
      : allSubjects;
    const current = defaultValues?.subject;
    // Khi sửa bài: giữ môn hiện tại trong danh sách dù hồ sơ đã đổi
    return current && !base.some((s) => s.id === current.id)
      ? [current, ...base]
      : base;
  }, [tutorSubjects, allSubjects, defaultValues?.subject]);

  const educationLevels = useMemo(() => {
    const base: readonly EducationLevel[] = tutorLevels?.length
      ? tutorLevels
      : EDUCATION_LEVELS;
    const current = defaultValues?.educationLevel;
    return current && !base.includes(current) ? [current, ...base] : base;
  }, [tutorLevels, defaultValues?.educationLevel]);

  const postType: PostType = isTutor
    ? "FIND_STUDENT"
    : role === "STUDENT"
      ? "FIND_TUTOR"
      : (defaultValues?.type ?? "FIND_TUTOR");

  const isCreate = !defaultValues;

  const testValues: Partial<PostPayload> =
    import.meta.env.DEV && isCreate ? getTestDefaults(t)[postType] : {};

  // Cấp học mặc định phải nằm trong danh sách được phép
  const preferredLevel =
    testValues.educationLevel ?? defaultValues?.educationLevel ?? "HIGH_SCHOOL";
  const initialLevel = educationLevels.includes(preferredLevel)
    ? preferredLevel
    : educationLevels[0];

  const form = useForm<PostPayload>({
    defaultValues: {
      type: postType,

      title: defaultValues?.title ?? "",

      content: defaultValues?.content ?? "",

      subjectId: defaultValues?.subject?.id ?? "",

      teachingMode: defaultValues?.teachingMode ?? "BOTH",

      budgetUnit: defaultValues?.budgetUnit ?? "PER_SESSION",

      address: {
        street: defaultValues?.address?.street ?? "",

        ward: defaultValues?.address?.ward ?? "",

        province: defaultValues?.address?.province ?? "",
      },

      minBudget: defaultValues?.minBudget ?? 0,

      maxBudget: defaultValues?.maxBudget ?? 0,

      sessionsPerWeek: defaultValues?.sessionsPerWeek ?? 2,

      durationMinutes: defaultValues?.durationMinutes ?? 90,

      deadline: defaultValues?.deadline
        ? defaultValues.deadline.slice(0, 10)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),

      // Chỉ DEV + create.
      ...testValues,

      educationLevel: initialLevel,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    clearErrors,
    watch,
    formState: { errors, isDirty },
  } = form;

  // Gắn lỗi BE vào form, nhớ lỗi gốc để dịch lại khi đổi ngôn ngữ.
  const applyServer = useServerFormErrors(form, FORM_FIELDS);

  const teachingMode = watch("teachingMode");

  const budgetUnit = watch("budgetUnit");

  const budgetFmt = (n: number) => n.toLocaleString(intlLocale());

  const province = watch("address.province");

  const today = new Date().toISOString().slice(0, 10);

  // Địa chỉ bắt buộc với OFFLINE/BOTH.
  const addressRequired = teachingMode === "OFFLINE" || teachingMode === "BOTH";

  // Nhãn tính trong component để đổi theo ngôn ngữ hiện tại.
  const budgetUnitOptions = [
    { value: "PER_SESSION", label: t("post.postForm.budgetPerSession") },
    { value: "PER_MONTH", label: t("post.postForm.budgetPerMonth") },
  ] as const;

  const budgetUnitLabel =
    budgetUnitOptions
      .find((item) => item.value === budgetUnit)
      ?.label.toLowerCase() ?? "";

  // ─────────────────────────────────────
  // ADDRESS
  // ─────────────────────────────────────

  const {
    provinceOptions,
    wardOptions,
    isLoadingProvinces,
    isLoadingWards,
    manualEntry,
  } = useAddressSelect({
    control,
    setValue,
    provinceField: "address.province",
    wardField: "address.ward",
  });

  /*
   * Chỉ reset ward khi user thực sự đổi tỉnh.
   * Không reset lúc edit/mount để giữ dữ liệu cũ.
   */
  const prevProvince = useRef(province);

  useEffect(() => {
    if (prevProvince.current !== province) {
      setValue("address.ward", "");

      prevProvince.current = province;
    }
  }, [province, setValue]);

  /*
   * DEV + CREATE:
   * tự chọn môn, tỉnh, phường và đường
   * để tiện test.
   */
  useEffect(() => {
    if (!import.meta.env.DEV || !isCreate) {
      return;
    }

    if (subjects.length > 0 && !getValues("subjectId")) {
      setValue("subjectId", subjects[0].id);
    }

    const firstProvince = provinceOptions.find((option) => option.value !== "");

    if (firstProvince && !getValues("address.province")) {
      setValue("address.province", firstProvince.value);
    }

    const firstWard = wardOptions.find((option) => option.value !== "");

    if (firstWard && !getValues("address.ward")) {
      setValue("address.ward", firstWard.value);
    }

    if (!getValues("address.street")) {
      setValue("address.street", t("post.postForm.dev.street"));
    }
  }, [
    subjects,
    provinceOptions,
    wardOptions,
    isCreate,
    getValues,
    setValue,
    t,
  ]);

  // ─────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────

  const submitAs = (asDraft: boolean) => {
    // Lỗi từ BE lần trước không tự mất nếu field không có rule FE -> xóa để submit lại được.
    clearErrors();
    return handleSubmit(async (data) => {
      const fieldErrors = await onSubmit(
        {
          ...data,

          type: postType,

          address: data.teachingMode === "ONLINE" ? undefined : data.address,
        } as PostPayload,

        asDraft,
      );

      // Gắn lỗi BE vào đúng field (hook tự dịch lại khi đổi ngôn ngữ).
      if (fieldErrors) {
        applyServer(fieldErrors);
      } else if (!asDraft) {
        // Track: form submission completed successfully
        markPostFormCompleted();
      }
    })();
  };

  // Track: form abandoned when leaving with unsaved changes
  usePostFormAbandonTracking(isDirty);

  const requiredIfOffline = {
    validate: (value?: string) =>
      !addressRequired ||
      Boolean(value?.trim()) ||
      t("validation.addressRequired"),
  };

  return (
    <form className="space-y-5" noValidate>
      {/* Loại bài đăng */}
      <div className="rounded-xl border border-border bg-primary-light px-4 py-3 text-sm text-text">
        <span className="text-text-secondary">
          {t("post.postForm.postTypeLabel")}:{" "}
        </span>

        <strong>{POST_TYPE_LABEL[postType]}</strong>

        <p className="mt-0.5 text-xs text-text-secondary">
          {postType === "FIND_TUTOR"
            ? t("post.postForm.studentHint")
            : t("post.postForm.tutorHint")}
        </p>
      </div>

      {/* Title */}
      <Input
        label={t("post.title")}
        required
        error={errors.title?.message}
        maxLength={TITLE_MAX}
        {...register("title", {
          required: t("validation.titleRequired"),

          validate: (value) =>
            value.trim().length > 0 || t("validation.titleRequired"),

          maxLength: {
            value: TITLE_MAX,
            message: t("validation.titleMax", { max: TITLE_MAX }),
          },
        })}
      />

      {/* Content */}
      <Textarea
        label={t("post.description")}
        required
        error={errors.content?.message}
        hint={t("post.postForm.contentHint", { max: CONTENT_MAX })}
        rows={5}
        maxLength={CONTENT_MAX}
        {...register("content", {
          required: t("validation.contentRequired"),

          validate: (value) =>
            value.trim().length > 0 || t("validation.contentRequired"),

          maxLength: {
            value: CONTENT_MAX,
            message: t("validation.contentMax", { max: CONTENT_MAX }),
          },
        })}
      />

      {/* Subject */}
      <Controller
        name="subjectId"
        control={control}
        rules={{
          required: t("validation.subjectRequired"),
        }}
        render={({ field }) => (
          <Select
            label={t("post.subject")}
            required
            error={errors.subjectId?.message}
            value={field.value}
            onChange={field.onChange}>
            <option value="">{t("tutor.selectSubject")}</option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        )}
      />

      {/* Education level + teaching mode */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="educationLevel"
          control={control}
          rules={{
            required: t("validation.levelRequired"),
          }}
          render={({ field }) => (
            <Select
              label={t("post.educationLevel")}
              required
              error={errors.educationLevel?.message}
              value={field.value}
              onChange={field.onChange}>
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {EDUCATION_LEVEL_LABEL[level]}
                </option>
              ))}
            </Select>
          )}
        />

        <Controller
          name="teachingMode"
          control={control}
          rules={{
            required: t("validation.modeRequired"),
          }}
          render={({ field }) => (
            <Select
              label={t("post.teachingMode")}
              required
              error={errors.teachingMode?.message}
              value={field.value}
              onChange={field.onChange}>
              {TEACHING_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {TEACHING_MODE_LABEL[mode]}
                </option>
              ))}
            </Select>
          )}
        />
      </div>

      {/* Budget unit */}
      <Controller
        name="budgetUnit"
        control={control}
        render={({ field }) => (
          <Select
            label={t("post.postForm.budgetUnitLabel")}
            value={field.value ?? "PER_SESSION"}
            onChange={field.onChange}>
            {budgetUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      />

      {/* Budget */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("post.postForm.minBudgetLabel", { unit: budgetUnitLabel })}
          type="number"
          min={BUDGET_MIN_EXCLUSIVE + 1}
          error={errors.minBudget?.message}
          {...register("minBudget", {
            valueAsNumber: true,

            validate: (min) =>
              (!Number.isNaN(min) && min > BUDGET_MIN_EXCLUSIVE) ||
              t("validation.minBudget", {
                min: budgetFmt(BUDGET_MIN_EXCLUSIVE),
              }),

            // đổi min thì kiểm tra lại max
            deps: ["maxBudget"],
          })}
        />

        <Input
          label={t("post.postForm.maxBudgetLabel", { unit: budgetUnitLabel })}
          type="number"
          min={BUDGET_MIN_EXCLUSIVE + 1}
          max={BUDGET_MAX}
          error={errors.maxBudget?.message}
          {...register("maxBudget", {
            valueAsNumber: true,

            validate: (max) => {
              if (Number.isNaN(max) || max <= BUDGET_MIN_EXCLUSIVE) {
                return t("validation.maxBudgetMin", {
                  min: budgetFmt(BUDGET_MIN_EXCLUSIVE),
                });
              }
              if (max > BUDGET_MAX) {
                return t("validation.maxBudgetMax", {
                  max: budgetFmt(BUDGET_MAX),
                });
              }
              // getValues: luôn là giá trị min mới nhất, kể cả khi validate chạy do deps
              const min = getValues("minBudget");
              if (!Number.isNaN(min) && max <= min) {
                return t("validation.maxBudgetOrder");
              }
              return true;
            },
          })}
        />
      </div>

      {/* Sessions + duration */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("post.sessionsPerWeek")}
          type="number"
          min={1}
          error={errors.sessionsPerWeek?.message}
          {...register("sessionsPerWeek", {
            valueAsNumber: true,

            min: {
              value: 1,
              message: t("validation.sessionsMin"),
            },
          })}
        />

        <Input
          label={t("post.duration")}
          type="number"
          min={15}
          error={errors.durationMinutes?.message}
          {...register("durationMinutes", {
            valueAsNumber: true,

            min: {
              value: 15,
              message: t("validation.durationMin"),
            },
          })}
        />
      </div>

      {/* Deadline */}
      <Input
        label={t("post.deadline")}
        required
        type="date"
        error={errors.deadline?.message}
        min={today}
        {...register("deadline", {
          required: t("validation.deadlineRequired"),

          validate: (value) => value >= today || t("validation.deadlinePast"),
        })}
      />

      {/* ADDRESS */}
      {teachingMode !== "ONLINE" && (
        <>
          {manualEntry ? (
            // API địa chỉ lỗi -> cho nhập tay
            <Input
              label={t("common.province")}
              required={addressRequired}
              error={errors.address?.province?.message}
              {...register("address.province", requiredIfOffline)}
            />
          ) : (
            <Controller
              name="address.province"
              control={control}
              rules={requiredIfOffline}
              render={({ field }) => (
                <Select
                  label={t("common.province")}
                  required={addressRequired}
                  error={errors.address?.province?.message}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isLoadingProvinces}>
                  <option value="">{t("common.selectProvince")}</option>

                  {provinceOptions
                    .filter((option) => option.value !== "")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </Select>
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {manualEntry ? (
              <Input
                label={t("post.postForm.ward")}
                required={addressRequired}
                error={errors.address?.ward?.message}
                maxLength={100}
                {...register("address.ward", requiredIfOffline)}
              />
            ) : (
              <Controller
                name="address.ward"
                control={control}
                rules={requiredIfOffline}
                render={({ field }) => (
                  <Select
                    label={t("post.postForm.ward")}
                    required={addressRequired}
                    error={errors.address?.ward?.message}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={!province || isLoadingWards}>
                    <option value="">
                      {province
                        ? t("post.postForm.selectWard")
                        : t("post.postForm.selectProvinceFirst")}
                    </option>

                    {wardOptions
                      .filter((option) => option.value !== "")
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </Select>
                )}
              />
            )}

            <Input
              label={t("post.postForm.street")}
              required={addressRequired}
              error={errors.address?.street?.message}
              maxLength={255}
              {...register("address.street", requiredIfOffline)}
            />
          </div>
        </>
      )}

      {errors.root?.server && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-text">
          {errors.root.server.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        {isCreate ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => submitAs(true)}
              loading={isSubmitting}
              className="sm:flex-1">
              {t("post.postForm.saveDraft")}
            </Button>

            <Button
              type="button"
              onClick={() => submitAs(false)}
              loading={isSubmitting}
              className="flex-1">
              {t("post.publishPost")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => submitAs(false)}
            loading={isSubmitting}
            className="w-full">
            {t("post.postForm.saveChanges")}
          </Button>
        )}
      </div>
    </form>
  );
}
