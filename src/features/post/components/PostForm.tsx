import { useForm, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  EDUCATION_LEVELS,
  TEACHING_MODES,
  EDUCATION_LEVEL_LABEL,
  TEACHING_MODE_LABEL,
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
import { POST_TYPE_LABEL } from "@/constants/enums";

interface PostFormProps {
  defaultValues?: Partial<PostResponse>;
  onSubmit: (payload: PostPayload, asDraft?: boolean) => Promise<void>;
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PostPayload>({
    defaultValues: {
      type: postType,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      subjectId: defaultValues?.subject?.id ?? "",
      educationLevel: defaultValues?.educationLevel ?? "HIGH_SCHOOL",
      teachingMode: defaultValues?.teachingMode ?? "BOTH",
      address: defaultValues?.address ?? {},
      minBudget: defaultValues?.minBudget ?? 0,
      maxBudget: defaultValues?.maxBudget ?? 0,
      sessionsPerWeek: defaultValues?.sessionsPerWeek ?? 2,
      durationMinutes: defaultValues?.durationMinutes ?? 90,
      deadline: defaultValues?.deadline
        ? defaultValues.deadline.slice(0, 10)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
    },
  });

  // Tỉnh/thành lấy từ API (BE cache).
  // Form này chỉ có tỉnh nên không truyền wardField.
  const {
    provinceOptions,
    wardOptions,
    onProvinceChange,
    wardDisabled,
    isLoadingProvinces,
    manualEntry,
  } = useAddressSelect({
    control,
    setValue,
    provinceField: "address.province",
    wardField: "address.ward",
  });

  // BE: địa chỉ (đường + phường/xã + tỉnh) bắt buộc đủ khi dạy OFFLINE/BOTH.
  const teachingMode = useWatch({ control, name: "teachingMode" });
  const needAddress = teachingMode !== "ONLINE";
  const today = new Date().toISOString().slice(0, 10);

  // Submit bài đăng dưới dạng nháp hoặc đăng công khai.
  const submitAs = (asDraft: boolean) => {
    return handleSubmit(async (data) => {
      await onSubmit({ ...data, type: postType }, asDraft);
    })();
  };

  return (
    <form className="space-y-5">
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
        {...register("title", {
          required: t("validation.required"),
        })}
      />

      {/* Content */}
      <Textarea
        label={t("post.description")}
        error={errors.content?.message}
        rows={4}
        {...register("content", {
          required: t("validation.required"),
        })}
      />

      {/* Subject */}
      <Controller
        name="subjectId"
        control={control}
        rules={{
          required: t("validation.required"),
        }}
        render={({ field }) => (
          <Select
            label={t("post.subject")}
            error={errors.subjectId?.message}
            value={field.value}
            onChange={field.onChange}
          >
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
          render={({ field }) => (
            <Select
              label={t("post.educationLevel")}
              value={field.value}
              onChange={field.onChange}
            >
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
          render={({ field }) => (
            <Select
              label={t("post.teachingMode")}
              value={field.value}
              onChange={field.onChange}
            >
              {TEACHING_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {TEACHING_MODE_LABEL[mode]}
                </option>
              ))}
            </Select>
          )}
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${t("post.budgetPerMonth")} min`}
          type="number"
          error={errors.minBudget?.message}
          {...register("minBudget", {
            valueAsNumber: true,
            min: {
              value: 0,
              message: t("validation.minZero"),
            },
          })}
        />

        <Input
          label={`${t("post.budgetPerMonth")} max`}
          type="number"
          error={errors.maxBudget?.message}
          {...register("maxBudget", {
            valueAsNumber: true,
            min: {
              value: 0,
              message: t("validation.minZero"),
            },
          })}
        />
      </div>

      {/* Sessions and duration */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("post.sessionsPerWeek")}
          type="number"
          {...register("sessionsPerWeek", {
            valueAsNumber: true,
          })}
        />

        <Input
          label={t("post.duration")}
          type="number"
          {...register("durationMinutes", {
            valueAsNumber: true,
          })}
        />
      </div>

      {/* Deadline */}
      <Input
        label={t("post.deadline")}
        type="date"
        error={errors.deadline?.message}
        min={today}
        {...register("deadline", {
          required: t("validation.required"),
          validate: (v) => v >= today || "Hạn chót phải từ hôm nay trở đi",
        })}
      />

      {/* Địa chỉ: tỉnh → phường/xã → số nhà, tên đường */}
      {needAddress && (
        <div className="space-y-4">
          {manualEntry ? (
            // API địa chỉ lỗi: cho nhập tay để không chặn đăng bài.
            <>
              <Input
                label={t("common.province")}
                error={errors.address?.province?.message}
                {...register("address.province", {
                  required: t("validation.required"),
                })}
              />
              <Input
                label="Phường / Xã"
                error={errors.address?.ward?.message}
                {...register("address.ward", {
                  required: t("validation.required"),
                })}
              />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="address.province"
                control={control}
                rules={{ required: t("validation.required") }}
                render={({ field }) => (
                  <Select
                    label={t("common.province")}
                    error={errors.address?.province?.message}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e);
                      onProvinceChange();
                    }}
                    disabled={isLoadingProvinces}
                  >
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
              <Select
                label="Phường / Xã"
                disabled={wardDisabled}
                options={wardOptions}
                error={errors.address?.ward?.message}
                {...register("address.ward", {
                  required: t("validation.required"),
                })}
              />
            </div>
          )}
          <Input
            label="Số nhà, tên đường"
            error={errors.address?.street?.message}
            {...register("address.street", {
              required: t("validation.required"),
            })}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => submitAs(true)}
          loading={isSubmitting}
          className="flex-1"
        >
          {t("post.draftSaved")}
        </Button>

        <Button
          type="button"
          onClick={() => submitAs(false)}
          loading={isSubmitting}
          className="flex-1"
        >
          {t("post.publishPost")}
        </Button>
      </div>
    </form>
  );
}
