import { useEffect, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
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
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
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
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <a href={certificate.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={certificate.fileUrl}
          alt={certificate.name ?? "Ảnh chứng chỉ"}
          className="size-14 rounded-lg border border-border object-cover"
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {certificate.name ?? "Đang chờ hệ thống đọc thông tin..."}
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
          Đã xác thực
        </Badge>
      ) : (
        <Badge tone="yellow" icon={<Clock className="size-3" />}>
          Đang duyệt
        </Badge>
      )}
      <Button
        variant="ghost"
        aria-label="Xóa chứng chỉ"
        loading={deleting}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-danger" />
      </Button>
    </li>
  );
}

function SlotsEditor({ form }: { form: Form }) {
  const {
    register,
    control,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedule",
  });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-text">
        Lịch rảnh trong tuần
      </legend>
      {fields.map((f, i) => (
        <div
          key={f.id}
          className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Select
            aria-label="Thứ"
            options={DAYS.map((d) => ({ value: d, label: DAY_LABEL[d] }))}
            {...register(`schedule.${i}.day`)}
          />
          <Input
            aria-label="Từ giờ"
            type="time"
            error={errors.schedule?.[i]?.from?.message}
            {...register(`schedule.${i}.from`, { required: "Nhập giờ" })}
          />
          <Input
            aria-label="Đến giờ"
            type="time"
            error={errors.schedule?.[i]?.to?.message}
            {...register(`schedule.${i}.to`, {
              required: "Nhập giờ",
              validate: (to) =>
                to > getValues(`schedule.${i}.from`) || "Phải sau giờ bắt đầu",
            })}
          />
          <Button variant="ghost" aria-label="Xóa ca" onClick={() => remove(i)}>
            <Trash2 className="size-4 text-danger" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ day: "MONDAY", from: "18:00", to: "20:00" })}
      >
        <Plus className="size-4" /> Thêm ca rảnh
      </Button>
    </fieldset>
  );
}

/** Khối thông tin chung của gia sư, nằm trên cùng. */
function CommonInfoCard({ form }: { form: Form }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6"
      aria-label="Thông tin chung"
    >
      <h2 className="text-lg font-bold text-text">Thông tin chung</h2>
      <Input
        label="Học vấn"
        required
        placeholder="VD: Cử nhân Sư phạm Toán — ĐH Sư phạm"
        error={errors.education?.message}
        {...register("education", { required: "Bắt buộc" })}
      />
      <Textarea
        label="Giới thiệu bản thân"
        required
        rows={5}
        error={errors.bio?.message}
        {...register("bio", {
          required: "Bắt buộc",
          minLength: { value: 30, message: "Tối thiểu 30 ký tự" },
        })}
      />
      <Input
        label="Khu vực nhận dạy"
        placeholder="VD: Gò Vấp, Quận 1, Thủ Đức (cách nhau bằng dấu phẩy)"
        {...register("teachingAreasText")}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">
          Cấp học nhận dạy
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {TEACHING_LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 text-sm text-text"
            >
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
        aria-label="Môn học mới"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-text">Môn học mới</h3>
          <Button variant="ghost" onClick={onRemoveSubject}>
            Hủy
          </Button>
        </div>
        <Select
          label="Môn học"
          placeholder="Chọn môn học"
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
      aria-label={`Môn ${subjectName}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-text">{subjectName}</h3>
          {isNew ? (
            <Badge tone="yellow">Môn mới, chưa lưu</Badge>
          ) : verified ? (
            <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
              Môn đã xác nhận
            </Badge>
          ) : (
            <Badge tone="yellow" icon={<Clock className="size-3" />}>
              Chưa xác nhận
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          aria-label={`Xóa môn ${subjectName}`}
          onClick={onRemoveSubject}
        >
          <Trash2 className="size-4 text-danger" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Số năm kinh nghiệm"
          type="number"
          required
          error={e?.experienceYears?.message}
          {...register(`subjects.${index}.experienceYears`, {
            valueAsNumber: true,
            required: "Bắt buộc",
            min: { value: 0, message: "Không âm" },
            max: { value: 50, message: "Tối đa 50" },
          })}
        />
        <Select
          label="Hình thức dạy"
          options={TEACHING_MODES.map((m) => ({
            value: m,
            label: TEACHING_MODE_LABEL[m],
          }))}
          {...register(`subjects.${index}.teachingMode`)}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h4 className="text-sm font-medium text-text">
          Chứng chỉ của môn này <span className="text-danger">*</span>
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
              Tải 1 ảnh chứng chỉ / bằng cấp. Chưa có chứng chỉ thì môn này chưa
              được xác nhận.
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
  const toast = useToast();
  const save = useSaveTutorProfile();
  const upload = useUploadCertificates();
  const removeCertificate = useDeleteCertificate();
  const { data: certificates = [], isLoading: certsLoading } =
    useMyCertificates();
  const [files, setFiles] = useState<Record<string, File[]>>({});
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
      onSuccess: () => toast.success("Đã xóa chứng chỉ"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  const handleRemoveSubject = (index: number) => {
    const { subjectId, subjectName } = getValues(`subjects.${index}`);
    if (!subjectId) {
      removeSubject(index);
      return;
    }
    if (
      !window.confirm(
        `Xóa môn ${subjectName}? Khi lưu, thông tin và chứng chỉ của môn này sẽ bị xóa.`,
      )
    ) {
      return;
    }
    removeSubject(index);
    setFiles(({ [subjectId]: _removed, ...rest }) => rest);
  };

  const submit = handleSubmit(async (values) => {
    if (values.subjects.length === 0) {
      toast.error("Hãy thêm ít nhất 1 môn học");
      return;
    }
    if (values.subjects.some((s) => !s.subjectId)) {
      toast.error("Hãy chọn môn học cho thẻ môn mới hoặc bấm Hủy");
      return;
    }
    const hasCertificate = (subjectId: string) =>
      certificates.some((c) => c.subjectId === subjectId) ||
      (files[subjectId]?.length ?? 0) > 0;
    const missing = values.subjects.filter((s) => !hasCertificate(s.subjectId));
    if (missing.length > 0) {
      toast.error(
        `Môn ${missing.map((m) => m.subjectName).join(", ")} cần có 1 ảnh chứng chỉ`,
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
          ? "Đã cập nhật hồ sơ"
          : "Đã gửi hồ sơ, vui lòng chờ Admin duyệt",
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <form
      onSubmit={(ev) => void submit(ev)}
      noValidate
      className="flex flex-col gap-5"
    >
      <CommonInfoCard form={form} />

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-text">Môn học</h2>
        <p className="text-xs text-text-secondary">
          Mỗi môn có số năm kinh nghiệm và hình thức dạy riêng, và cần 1 chứng
          chỉ. Môn có chứng chỉ đã xác thực mới đăng bài và nhận lớp được.
        </p>
      </div>

      {certsLoading && <Skeleton className="h-16 w-full" />}

      {fields.length === 0 && (
        <p className="text-sm text-text-secondary">
          Chưa có môn học nào. Hãy thêm môn học ở bên dưới.
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
            Chứng chỉ chưa gắn môn (hãy xóa và tải lại ở đúng môn):
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
        onClick={() => append(newSubjectValues("", ""))}
      >
        <Plus className="size-4" /> Thêm môn học mới
      </Button>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={save.isPending || upload.isPending}>
          {data.verificationStatus === "REJECTED"
            ? "Gửi lại để duyệt"
            : "Lưu hồ sơ"}
        </Button>
      </div>
    </form>
  );
}
