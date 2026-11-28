import { useEffect, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Clock, Plus, Trash2 } from "lucide-react";
import { CertificateUpload } from "@/features/auth/components/CertificateUpload";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import {
  DAY_LABEL,
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABEL,
  TEACHING_MODES,
  TEACHING_MODE_LABEL,
} from "@/constants/enums";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { useServerFormErrors } from "@/shared/hooks/useServerFormErrors";
import type {
  DayOfWeek,
  EducationLevel,
  TeachingMode,
} from "@/shared/types/common.types";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import type {
  ScheduleSlot,
  SubjectProfile,
  TutorResponse,
} from "../types/tutor.types";
import {
  useDeleteCertificate,
  useMyCertificates,
  useSaveTutorProfile,
  useUploadCertificates,
} from "../hooks/useTutors";

const TEACHING_LEVELS: EducationLevel[] = [...EDUCATION_LEVELS, "OTHER"];
const DAYS = Object.keys(DAY_LABEL) as DayOfWeek[];
const NO_KNOWN_FIELDS = [] as const;
interface SubjectFormValues {
  subjectId: string;
  subjectName: string;
  experienceYears: number;
  hourlyRate: number;
  teachingMode: TeachingMode;
}

interface FormValues {
  // Thông tin chung
  education: string;
  bio: string;
  teachingAreasText: string;
  educationLevels: EducationLevel[];
  schedule: ScheduleSlot[];
  // Thông tin riêng từng môn
  subjects: SubjectFormValues[];
}

type Form = UseFormReturn<FormValues>;

function parseAreas(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[,\n]/)
    .map((a) => a.trim())
    .filter((a) => {
      const key = a.toLowerCase();
      if (!a || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function hasOverlappingSchedule(schedule: ScheduleSlot[]): boolean {
  return schedule.some((slot, index) =>
    schedule.slice(index + 1).some(
      (other) =>
        slot.day === other.day &&
        slot.from &&
        slot.to &&
        other.from &&
        other.to &&
        slot.from < other.to &&
        other.from < slot.to,
    ),
  );
}

/** Môn chưa có dữ liệu riêng (hồ sơ cũ) lấy giá trị chung của gia sư làm mặc định. */
function toSubjectValues(data: TutorResponse): SubjectFormValues[] {
  const profiles = new Map<string, SubjectProfile>(
    (data.subjectProfiles ?? []).map((p) => [p.subjectId, p]),
  );
  const names = new Map<string, string>();
  (data.subjects ?? []).forEach((s) => names.set(s.id, s.name));
  profiles.forEach((p) => names.set(p.subjectId, p.subjectName));

  return [...names].map(([subjectId, subjectName]) => {
    const p = profiles.get(subjectId);
    return {
      subjectId,
      subjectName,
      experienceYears: p?.experienceYears ?? data.experienceYears ?? 0,
      hourlyRate: p?.hourlyRate ?? (data.hourlyRate || 100000),
      teachingMode: p?.teachingMode ?? data.teachingMode ?? "BOTH",
    };
  });
}

function toFormValues(data: TutorResponse): FormValues {
  return {
    education: data.education ?? "",
    bio: data.bio ?? "",
    teachingAreasText: (data.teachingAreas ?? []).join(", "),
    educationLevels: data.educationLevels ?? [],
    schedule: data.schedule ?? [],
    subjects: toSubjectValues(data),
  };
}

function newSubjectValues(
  subjectId: string,
  subjectName: string,
): SubjectFormValues {
  return {
    subjectId,
    subjectName,
    experienceYears: 0,
    hourlyRate: 100000,
    teachingMode: "BOTH",
  };
}

function toProfile(v: SubjectFormValues): SubjectProfile {
  return {
    subjectId: v.subjectId,
    subjectName: v.subjectName,
    experienceYears: Number(v.experienceYears) || 0,
    hourlyRate: Number(v.hourlyRate) || 0,
    teachingMode: v.teachingMode,
  };
}

function CertificateItem({
  certificate,
  onDelete,
  deleting,
}: {
  certificate: CertificateResponse;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={certificate.fileUrl}
          alt={certificate.name ?? t("subjectEditor.certAlt")}
          className="size-14 rounded-lg border border-border object-cover"
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {certificate.name ?? t("subjectEditor.certPending")}
        </p>
        {certificate.issuedBy && (
          <p className="truncate text-xs text-text-secondary">
            {certificate.issuedBy}
            {certificate.issuedDate ? ` · ${certificate.issuedDate}` : ""}
          </p>
        )}
      </div>
      {certificate.verified ? (
        <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
          {t("subjectEditor.certVerified")}
        </Badge>
      ) : (
        <Badge tone="yellow" icon={<Clock className="size-3" />}>
          {t("subjectEditor.certReviewing")}
        </Badge>
      )}
      <Button
        variant="ghost"
        aria-label={t("subjectEditor.deleteCertAria")}
        loading={deleting}
        onClick={onDelete}>
        <Trash2 className="size-4 text-danger-text" />
      </Button>
    </li>
  );
}
function SlotsEditor({ form }: { form: Form }) {
  const { t } = useTranslation();
  const {
    register,
    control,
    getValues,
    watch,
    formState: { errors },
  } = form;
  const schedule = watch("schedule") ?? [];
  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedule",
  });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-text">
        {t("subjectEditor.scheduleLegend")}
      </legend>
      {fields.map((f, i) => (
        (() => {
          const slot = schedule[i];
          const hasOverlap = Boolean(
            slot &&
              schedule.some(
                (other, index) =>
                  index !== i &&
                  slot.day === other.day &&
                  slot.from &&
                  slot.to &&
                  other.from &&
                  other.to &&
                  slot.from < other.to &&
                  other.from < slot.to,
              ),
          );

          return (
            <div
              key={f.id}
              className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] ${
                hasOverlap ? "border-danger" : "border-border"
              }`}>
              <Select
                aria-label={t("subjectEditor.dayAria")}
                options={DAYS.map((d) => ({ value: d, label: DAY_LABEL[d] }))}
                {...register(`schedule.${i}.day`)}
              />
              <Input
                aria-label={t("subjectEditor.fromAria")}
                type="time"
                error={errors.schedule?.[i]?.from?.message}
                {...register(`schedule.${i}.from`, {
                  required: t("subjectEditor.enterTime"),
                })}
              />
              <Input
                aria-label={t("subjectEditor.toAria")}
                type="time"
                error={errors.schedule?.[i]?.to?.message}
                {...register(`schedule.${i}.to`, {
                  required: t("subjectEditor.enterTime"),
                  validate: (to) =>
                    to > getValues(`schedule.${i}.from`) ||
                    t("subjectEditor.mustBeAfterStart"),
                })}
              />
              <Button
                variant="ghost"
                aria-label={t("subjectEditor.deleteSlotAria")}
                onClick={() => remove(i)}>
                <Trash2 className="size-4 text-danger-text" />
              </Button>
              {hasOverlap && (
                <p className="col-span-full text-xs text-danger-text" role="alert">
                  {t("subjectEditor.overlappingSchedule")}
                </p>
              )}
            </div>
          );
        })()
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ day: "MONDAY", from: "18:00", to: "20:00" })}>
        <Plus className="size-4" /> {t("subjectEditor.addSlot")}
      </Button>
    </fieldset>
  );
}
function CommonInfoCard({ form }: { form: Form }) {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6"
      aria-label={t("subjectEditor.commonInfo")}>
      <h2 className="text-lg font-bold text-text">
        {t("subjectEditor.commonInfo")}
      </h2>
      <Input
        label={t("subjectEditor.education")}
        required
        placeholder={t("subjectEditor.educationPlaceholder")}
        error={errors.education?.message}
        {...register("education", { required: t("subjectEditor.required") })}
      />
      <Textarea
        label={t("subjectEditor.bio")}
        required
        rows={5}
        error={errors.bio?.message}
        {...register("bio", {
          required: t("subjectEditor.required"),
          minLength: {
            value: 30,
            message: t("subjectEditor.bioMin", { min: 30 }),
          },
        })}
      />
      <Input
        label={t("subjectEditor.areas")}
        required
        placeholder={t("subjectEditor.areasPlaceholder")}
        {...register("teachingAreasText")}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">
          {t("subjectEditor.levels")}{" "}
          <span className="text-danger-text">*</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {TEACHING_LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                value={level}
                className="size-4 accent-primary"
                {...register("educationLevels")}
              />
              {EDUCATION_LEVEL_LABEL[level]}
            </label>
          ))}
        </div>
      </fieldset>
      <SlotsEditor form={form} />
    </section>
  );
}
interface SubjectCardProps {
  form: Form;
  index: number;
  isNew: boolean;
  subjectId: string;
  subjectOptions: { value: string; label: string }[];
  onPickSubject: (subjectId: string) => void;
  certificates: CertificateResponse[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveSubject: () => void;
  onDeleteCertificate: (id: string) => void;
  deletingCertificateId: string | null;
}

function SubjectCard({
  form,
  index,
  isNew,
  subjectId,
  subjectOptions,
  onPickSubject,
  certificates,
  files,
  onFilesChange,
  onRemoveSubject,
  onDeleteCertificate,
  deletingCertificateId,
}: SubjectCardProps) {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const subjectName = watch(`subjects.${index}.subjectName`);
  const e = errors.subjects?.[index];
  const verified = certificates.some((c) => c.verified);

  // Thẻ môn mới, chưa chọn môn: chỉ hiện ô chọn môn
  if (!subjectId) {
    return (
      <section
        className="flex flex-col gap-3 rounded-3xl border border-dashed border-border bg-surface p-5 sm:p-6"
        aria-label={t("subjectEditor.newSubject")}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-text">
            {t("subjectEditor.newSubject")}
          </h3>
          <Button variant="ghost" onClick={onRemoveSubject}>
            {t("subjectEditor.cancel")}
          </Button>
        </div>
        <Select
          label={t("subjectEditor.subject")}
          placeholder={t("subjectEditor.pickSubject")}
          value=""
          onChange={(ev) => onPickSubject(ev.target.value)}
          options={subjectOptions}
        />
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6"
      aria-label={t("subjectEditor.subjectAria", { name: subjectName })}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-text">{subjectName}</h3>
          {isNew ? (
            <Badge tone="yellow">{t("subjectEditor.unsavedBadge")}</Badge>
          ) : verified ? (
            <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
              {t("subjectEditor.confirmedBadge")}
            </Badge>
          ) : (
            <Badge tone="yellow" icon={<Clock className="size-3" />}>
              {t("subjectEditor.unconfirmedBadge")}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          aria-label={t("subjectEditor.removeSubjectAria", {
            name: subjectName,
          })}
          onClick={onRemoveSubject}>
          <Trash2 className="size-4 text-danger-text" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("subjectEditor.experienceYears")}
          type="number"
          required
          error={e?.experienceYears?.message}
          {...register(`subjects.${index}.experienceYears`, {
            valueAsNumber: true,
            required: t("subjectEditor.required"),
            min: { value: 0, message: t("subjectEditor.notNegative") },
            max: {
              value: 50,
              message: t("subjectEditor.maxValue", { max: 50 }),
            },
          })}
        />
        <Select
          label={t("subjectEditor.teachingMode")}
          options={TEACHING_MODES.map((m) => ({
            value: m,
            label: TEACHING_MODE_LABEL[m],
          }))}
          {...register(`subjects.${index}.teachingMode`)}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h4 className="text-sm font-medium text-text">
          {t("subjectEditor.subjectCert")}{" "}
          <span className="text-danger-text">*</span>
        </h4>
        {certificates.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {certificates.map((c) => (
              <CertificateItem
                key={c.id}
                certificate={c}
                deleting={deletingCertificateId === c.id}
                onDelete={() => onDeleteCertificate(c.id)}
              />
            ))}
          </ul>
        ) : (
          <>
            <p className="text-xs text-text-secondary">
              {t("subjectEditor.certHint")}
            </p>
            <CertificateUpload
              value={files}
              onChange={onFilesChange}
              maxFiles={1}
            />
          </>
        )}
      </div>
    </section>
  );
}

export function SubjectProfilesEditor({ data }: { data: TutorResponse }) {
  const { t } = useTranslation();
  const toast = useToast();
  const save = useSaveTutorProfile();
  const upload = useUploadCertificates();
  const removeCertificate = useDeleteCertificate();
  const { data: certificates = [], isLoading: certsLoading } =
    useMyCertificates();
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [subjectToRemove, setSubjectToRemove] = useState<{
    index: number;
    subjectId: string;
    subjectName: string;
  } | null>(null);
  const { data: allSubjects = [] } = useSubjects();

  const form = useForm<FormValues>({
    defaultValues: {
      education: "",
      bio: "",
      teachingAreasText: "",
      educationLevels: [],
      schedule: [],
      subjects: [],
    },
  });
  const { control, handleSubmit, reset, getValues } = form;
  useServerFormErrors(form, NO_KNOWN_FIELDS);
  const {
    fields,
    append,
    update,
    remove: removeSubject,
  } = useFieldArray({ control, name: "subjects" });
  const current = form.watch("subjects") ?? [];
  const takenIds = current.map((s) => s.subjectId).filter(Boolean);
  const availableSubjects = allSubjects.filter((s) => !takenIds.includes(s.id));
  // Môn đã có trong hồ sơ trên server; còn lại là môn vừa thêm, chưa lưu
  const savedIds = new Set(toSubjectValues(data).map((s) => s.subjectId));

  useEffect(() => {
    reset(toFormValues(data));
  }, [data, reset]);

  const deletingId = removeCertificate.isPending
    ? (removeCertificate.variables ?? null)
    : null;
  const orphans = certificates.filter((c) => !c.subjectId);

  const handleDeleteCertificate = (id: string) =>
    removeCertificate.mutate(id, {
      onSuccess: () => toast.success(t("subjectEditor.certDeleted")),
      onError: (err) => toast.apiError(err),
    });

  const handleRemoveSubject = (index: number) => {
    const { subjectId, subjectName } = getValues(`subjects.${index}`);
    if (!subjectId) {
      removeSubject(index);
      return;
    }
    setSubjectToRemove({ index, subjectId, subjectName });
  };

  const confirmRemoveSubject = () => {
    if (!subjectToRemove) return;
    const { index, subjectId } = subjectToRemove;
    removeSubject(index);
    setFiles(({ [subjectId]: _removed, ...rest }) => rest);
    setSubjectToRemove(null);
  };

  const submit = handleSubmit(async (values) => {
    if (values.subjects.length === 0) {
      toast.error(t("subjectEditor.addAtLeastOne"));
      return;
    }
    if (values.subjects.some((s) => !s.subjectId)) {
      toast.error(t("subjectEditor.pickOrCancel"));
      return;
    }
    if (hasOverlappingSchedule(values.schedule ?? [])) {
      toast.error(t("subjectEditor.overlappingSchedule"));
      return;
    }
    // Hồ sơ đã duyệt: phải bổ sung đủ thì mới nhận lớp / đăng bài được
    if (data.verificationStatus === "APPROVED") {
      const lacking: string[] = [];
      if (parseAreas(values.teachingAreasText).length === 0)
        lacking.push(t("subjectEditor.lackAreas"));
      if (!values.educationLevels?.length)
        lacking.push(t("subjectEditor.lackLevels"));
      if (!values.schedule?.length)
        lacking.push(t("subjectEditor.lackSchedule"));
      if (lacking.length > 0) {
        toast.error(
          t("subjectEditor.approvedNeedMore", { items: lacking.join(", ") }),
        );
        return;
      }
    }
    const hasCertificate = (subjectId: string) =>
      certificates.some((c) => c.subjectId === subjectId) ||
      (files[subjectId]?.length ?? 0) > 0;
    const missing = values.subjects.filter((s) => !hasCertificate(s.subjectId));
    if (missing.length > 0) {
      toast.error(
        t("subjectEditor.missingCert", {
          names: missing.map((m) => m.subjectName).join(", "),
        }),
      );
      return;
    }
    try {
      await save.mutateAsync({
        education: values.education,
        bio: values.bio,
        teachingAreas: parseAreas(values.teachingAreasText),
        educationLevels: Array.isArray(values.educationLevels)
          ? values.educationLevels
          : [],
        schedule: values.schedule ?? [],
        subjectProfiles: values.subjects.map(toProfile),
      });
      for (const s of values.subjects) {
        const picked = files[s.subjectId];
        if (picked && picked.length > 0) {
          await upload.mutateAsync({
            subjectId: s.subjectId,
            files: picked.slice(0, 1),
          });
        }
      }
      setFiles({});
      toast.success(
        data.verificationStatus === "APPROVED"
          ? t("subjectEditor.updated")
          : t("subjectEditor.submitted"),
      );
    } catch (err) {
      toast.apiError(err);
    }
  });

  return (
    <form
      onSubmit={(ev) => void submit(ev)}
      noValidate
      className="flex flex-col gap-5">
      {data.verificationStatus === "APPROVED" &&
        !(
          data.bio?.trim() &&
          data.teachingAreas?.length &&
          data.educationLevels?.length &&
          data.schedule?.length
        ) && (
          <p
            role="alert"
            className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text">
            {t("subjectEditor.approvedBanner")}
          </p>
        )}
      <CommonInfoCard form={form} />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-text">
          {t("subjectEditor.subjectsTitle")}
        </h2>
        <p className="text-xs text-text-secondary">
          {t("subjectEditor.subjectsHint")}
        </p>
      </div>
      {certsLoading && <Skeleton className="h-16 w-full" />}
      {fields.length === 0 && (
        <p className="text-sm text-text-secondary">
          {t("subjectEditor.noSubjects")}
        </p>
      )}
      {fields.map((field, index) => (
        <SubjectCard
          key={field.id}
          form={form}
          index={index}
          isNew={Boolean(field.subjectId) && !savedIds.has(field.subjectId)}
          subjectId={field.subjectId}
          subjectOptions={availableSubjects.map((s) => ({
            value: s.id,
            label: s.name,
          }))}
          onPickSubject={(id) => {
            const picked = allSubjects.find((s) => s.id === id);
            if (picked) update(index, newSubjectValues(picked.id, picked.name));
          }}
          certificates={certificates.filter(
            (c) => c.subjectId === field.subjectId,
          )}
          files={files[field.subjectId] ?? []}
          onFilesChange={(next) =>
            setFiles((prev) => ({ ...prev, [field.subjectId]: next }))
          }
          onRemoveSubject={() => handleRemoveSubject(index)}
          onDeleteCertificate={handleDeleteCertificate}
          deletingCertificateId={deletingId}
        />
      ))}
      {orphans.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-secondary">
            {t("subjectEditor.orphanCerts")}
          </p>
          <ul className="flex flex-col gap-2">
            {orphans.map((c) => (
              <CertificateItem
                key={c.id}
                certificate={c}
                deleting={deletingId === c.id}
                onDelete={() => handleDeleteCertificate(c.id)}
              />
            ))}
          </ul>
        </div>
      )}
      <Button
        variant="outline"
        className="w-fit"
        disabled={
          availableSubjects.length === 0 || current.some((c) => !c.subjectId)
        }
        onClick={() => append(newSubjectValues("", ""))}>
        <Plus className="size-4" /> {t("subjectEditor.addSubject")}
      </Button>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={save.isPending || upload.isPending}>
          {data.verificationStatus === "REJECTED"
            ? t("subjectEditor.resubmit")
            : t("subjectEditor.saveProfile")}
        </Button>
      </div>
      <ConfirmDialog
        open={subjectToRemove !== null}
        onClose={() => setSubjectToRemove(null)}
        onConfirm={confirmRemoveSubject}
        danger
        title={t("subjectEditor.removeTitle", {
          name: subjectToRemove?.subjectName ?? "",
        })}
        confirmText={t("subjectEditor.removeConfirm")}
        cancelText={t("subjectEditor.keep")}
        description={t("subjectEditor.removeDesc")}
      />
    </form>
  );
}
