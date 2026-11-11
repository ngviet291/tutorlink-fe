import { useEffect, useRef } from "react";
import { useForm, Controller, type Path } from "react-hook-form";
import { useTranslation } from "react-i18next";

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
import type { PostType } from "@/shared/types/common.types";

import { useAddressSelect } from "@/shared/hooks/useAddressSelect";
import { useAppSelector } from "@/shared/hooks/useAppStore";

// Dữ liệu điền sẵn để test theo vai trò (chỉ dùng khi dev, tạo mới).
const TEST_DEFAULTS: Record<PostType, Partial<PostPayload>> = {
  // Học viên đăng bài tìm gia sư
  FIND_TUTOR: {
    title: "Tìm gia sư Toán lớp 10 tại Quận 7",
    content:
      "Em đang học lớp 10, cần gia sư Toán củng cố kiến thức nền và ôn thi học kỳ. Ưu tiên gia sư có kinh nghiệm dạy cấp 3, kiên nhẫn.",
    educationLevel: "HIGH_SCHOOL",
    teachingMode: "BOTH",
    budgetUnit: "PER_SESSION",
    minBudget: 150000,
    maxBudget: 250000,
    sessionsPerWeek: 3,
    durationMinutes: 90,
  },
  // Gia sư đăng bài tìm học viên
  FIND_STUDENT: {
    title: "Gia sư Toán nhận học viên cấp 2, cấp 3",
    content:
      "Mình có 3 năm kinh nghiệm dạy Toán, phương pháp đi từ nền tảng đến nâng cao. Nhận dạy kèm 1-1, lịch linh hoạt buổi tối và cuối tuần.",
    educationLevel: "HIGH_SCHOOL",
    teachingMode: "ONLINE",
    budgetUnit: "PER_SESSION",
    minBudget: 200000,
    maxBudget: 300000,
    sessionsPerWeek: 2,
    durationMinutes: 120,
  },
};

// Giá trị theo enum BudgetUnit của BE. Đổi cho khớp enum thật của bạn
// (hoặc dùng BUDGET_UNITS / BUDGET_UNIT_LABEL trong constants/enums nếu đã có).
const BUDGET_UNIT_OPTIONS = [
  { value: "PER_SESSION", label: "Theo buổi" },
  { value: "PER_MONTH", label: "Theo tháng" },
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
  const { data: subjects = [] } = useSubjects();

  // Loại bài do vai trò quyết định, không cho tự chọn:
  // học viên đăng "Tìm gia sư" (FIND_TUTOR), gia sư đăng "Tìm học viên" (FIND_STUDENT).
  const role = useAppSelector((s) => s.auth.user?.role);
  const postType: PostType =
    role === "TUTOR"
      ? "FIND_STUDENT"
      : role === "STUDENT"
        ? "FIND_TUTOR"
        : (defaultValues?.type ?? "FIND_TUTOR");

  // Chỉ điền dữ liệu test khi dev và đang tạo mới.
  const isCreate = !defaultValues;
  const testValues: Partial<PostPayload> =
    import.meta.env.DEV && isCreate ? TEST_DEFAULTS[postType] : {};

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    watch,
    formState: { errors },
  } = useForm<PostPayload>({
    defaultValues: {
      type: postType,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      subjectId: defaultValues?.subject?.id ?? "",
      educationLevel: defaultValues?.educationLevel ?? "HIGH_SCHOOL",
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
      ...testValues, // ghi đè bằng dữ liệu test (chỉ dev + tạo mới)
    },
  });

  const teachingMode = watch("teachingMode");
  const budgetUnit = watch("budgetUnit");
  const minBudget = watch("minBudget");

  // BE: địa chỉ bắt buộc khi dạy OFFLINE hoặc BOTH.
  const addressRequired = teachingMode === "OFFLINE" || teachingMode === "BOTH";

  const budgetUnitLabel =
    BUDGET_UNIT_OPTIONS.find(
      (o) => o.value === budgetUnit,
    )?.label.toLowerCase() ?? "";

  // Tỉnh/thành lấy từ API (BE cache).
  // Phường/xã và đường nhập tay nên không truyền wardField.
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
  const province = watch("address.province");

  // Chỉ reset ward khi người dùng đổi tỉnh, không reset lúc mount (giữ ward ban đầu khi edit).
  const prevProvince = useRef(province);
  useEffect(() => {
    if (prevProvince.current !== province) {
      setValue("address.ward", "");
      prevProvince.current = province;
    }
  }, [province, setValue]);

  // Dev + tạo mới: chọn sẵn môn học, tỉnh, phường, đường sau khi API tải xong.
  useEffect(() => {
    if (!import.meta.env.DEV || !isCreate) return;

    if (subjects.length > 0 && !getValues("subjectId")) {
      setValue("subjectId", subjects[0].id);
    }

    const firstProvince = provinceOptions.find((o) => o.value !== "");
    if (firstProvince && !getValues("address.province")) {
      setValue("address.province", firstProvince.value);
    }

    const firstWard = wardOptions.find((o) => o.value !== "");
    if (firstWard && !getValues("address.ward")) {
      setValue("address.ward", firstWard.value);
    }

    if (!getValues("address.street")) {
      setValue("address.street", "123 Nguyễn Văn Linh");
    }
  }, [subjects, provinceOptions, wardOptions, isCreate, getValues, setValue]);

  const submitAs = (asDraft: boolean) =>
    handleSubmit(async (data) => {
      const fieldErrors = await onSubmit(
        {
          ...data,
          type: postType,
          address: data.teachingMode === "ONLINE" ? undefined : data.address,
        } as PostPayload,
        asDraft,
      );
      // Gắn lỗi của BE vào đúng ô nhập (key BE trả về: "address.ward", "title"...)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([name, message]) =>
          setError(name as Path<PostPayload>, { type: "server", message }),
        );
      }
    })();

  const requiredIfOffline = {
    validate: (v?: string) =>
      !addressRequired || Boolean(v?.trim()) || t("validation.required"),
  };

  return (
    <form className="space-y-5" noValidate>
      {/* Loại bài đăng: cố định theo vai trò */}
      <div className="rounded-xl border border-border bg-primary-light px-4 py-3 text-sm text-text">
        <span className="text-text-secondary">Loại bài đăng: </span>
        <strong>{POST_TYPE_LABEL[postType]}</strong>
        <p className="mt-0.5 text-xs text-text-secondary">
          {postType === "FIND_TUTOR"
            ? "Bạn là học viên: bài đăng này dùng để tìm gia sư."
            : "Bạn là gia sư: bài đăng này dùng để tìm học viên."}
        </p>
      </div>

      {/* Title */}
      <Input
        label={t("post.title")}
        error={errors.title?.message}
        maxLength={TITLE_MAX}
        {...register("title", {
          required: t("validation.required"),
          validate: (v) => v.trim().length > 0 || t("validation.required"),
          maxLength: {
            value: TITLE_MAX,
            message: `Tiêu đề tối đa ${TITLE_MAX} ký tự`,
          },
        })}
      />

      {/* Content */}
      <Textarea
        label={t("post.description")}
        error={errors.content?.message}
        rows={4}
        maxLength={CONTENT_MAX}
        {...register("content", {
          required: t("validation.required"),
          validate: (v) => v.trim().length > 0 || t("validation.required"),
          maxLength: {
            value: CONTENT_MAX,
            message: `Nội dung tối đa ${CONTENT_MAX} ký tự`,
          },
        })}
      />

      {/* Subject */}
      <Controller
        name="subjectId"
        control={control}
        rules={{ required: t("validation.required") }}
        render={({ field }) => (
          <Select
            label={t("post.subject")}
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

      {/* Education level and teaching mode */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="educationLevel"
          control={control}
          rules={{ required: t("validation.required") }}
          render={({ field }) => (
            <Select
              label={t("post.educationLevel")}
              error={errors.educationLevel?.message}
              value={field.value}
              onChange={field.onChange}>
              {EDUCATION_LEVELS.map((level) => (
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
          rules={{ required: t("validation.required") }}
          render={({ field }) => (
            <Select
              label={t("post.teachingMode")}
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
            label="Đơn vị ngân sách"
            value={field.value ?? "PER_SESSION"}
            onChange={field.onChange}>
            {BUDGET_UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
      />

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`Ngân sách tối thiểu (${budgetUnitLabel})`}
          type="number"
          min={0}
          error={errors.minBudget?.message}
          {...register("minBudget", {
            valueAsNumber: true,
            min: { value: 0, message: t("validation.minZero") },
          })}
        />

        <Input
          label={`Ngân sách tối đa (${budgetUnitLabel})`}
          type="number"
          min={0}
          error={errors.maxBudget?.message}
          {...register("maxBudget", {
            valueAsNumber: true,
            min: { value: 0, message: t("validation.minZero") },
            validate: (max) =>
              Number.isNaN(max) ||
              Number.isNaN(minBudget) ||
              max >= minBudget ||
              "Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu",
          })}
        />
      </div>

      {/* Sessions and duration */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("post.sessionsPerWeek")}
          type="number"
          min={1}
          error={errors.sessionsPerWeek?.message}
          {...register("sessionsPerWeek", {
            valueAsNumber: true,
            min: { value: 1, message: "Tối thiểu 1 buổi mỗi tuần" },
          })}
        />

        <Input
          label={t("post.duration")}
          type="number"
          min={15}
          error={errors.durationMinutes?.message}
          {...register("durationMinutes", {
            valueAsNumber: true,
            min: { value: 15, message: "Mỗi buổi tối thiểu 15 phút" },
          })}
        />
      </div>

      {/* Deadline */}
      <Input
        label={t("post.deadline")}
        type="date"
        error={errors.deadline?.message}
        {...register("deadline", {
          required: t("validation.required"),
          validate: (v) =>
            new Date(`${v}T23:59:59`).getTime() > Date.now() ||
            "Hạn nhận hồ sơ phải ở tương lai",
        })}
      />

      {/* Address: chỉ cần khi dạy trực tiếp (OFFLINE / BOTH) */}
      {teachingMode !== "ONLINE" && (
        <>
          {manualEntry ? (
            // API địa chỉ lỗi: cho nhập tay để không chặn đăng bài.
            <Input
              label={t("common.province")}
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

          <div className="grid grid-cols-2 gap-4">
            {manualEntry ? (
              <Input
                label="Phường / Xã"
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
                    label="Phường / Xã"
                    error={errors.address?.ward?.message}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={!province || isLoadingWards}>
                    <option value="">
                      {province ? "Chọn phường / xã" : "Chọn tỉnh trước"}
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
              label="Số nhà, đường"
              error={errors.address?.street?.message}
              maxLength={255}
              {...register("address.street", requiredIfOffline)}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {isCreate ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => submitAs(true)}
              loading={isSubmitting}
              className="flex-1">
              {t("post.draftSaved")}
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
            {t("post.saveChanges", { defaultValue: "Lưu thay đổi" })}
          </Button>
        )}
      </div>
    </form>
  );
}
