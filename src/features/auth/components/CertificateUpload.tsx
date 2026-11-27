import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CertificateUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  /** Có truyền thì mỗi ảnh có ô chọn môn (mảng `fileSubjectIds` song song với `value`). */
  subjectOptions?: { id: string; name: string }[];
  fileSubjectIds?: string[];
  onFileSubjectIdsChange?: (ids: string[]) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Lưu khóa + tham số thay vì chuỗi đã dịch, để đổi VI/EN khi lỗi đang hiện vẫn đúng.
type Problem = { key: string; params?: Record<string, unknown> };

export function CertificateUpload({
  value,
  onChange,
  error,
  maxFiles = 5,
  maxSizeMB = 5,
  subjectOptions,
  fileSubjectIds = [],
  onFileSubjectIdsChange,
}: CertificateUploadProps) {
  const { t } = useTranslation();
  const pickSubject = !!subjectOptions && !!onFileSubjectIdsChange;
  const inputRef = useRef<HTMLInputElement>(null);
  const [localProblems, setLocalProblems] = useState<Problem[]>([]);

  const previews = useMemo(
    () => value.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [value],
  );
  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews],
  );

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    const problems: Problem[] = [];
    const valid: File[] = [];

    for (const f of picked) {
      if (!ACCEPTED.includes(f.type)) {
        problems.push({
          key: "auth.certificateUpload.badType",
          params: { name: f.name },
        });
      } else if (f.size > maxSizeMB * 1024 * 1024) {
        problems.push({
          key: "auth.certificateUpload.tooLarge",
          params: { name: f.name, max: maxSizeMB },
        });
      } else {
        valid.push(f);
      }
    }

    const room = maxFiles - value.length;
    if (valid.length > room)
      problems.push({
        key: "auth.certificateUpload.maxFiles",
        params: { max: maxFiles },
      });

    setLocalProblems(problems);
    if (valid.length > 0) {
      const added = valid.slice(0, room);
      onChange([...value, ...added]);
      if (pickSubject) {
        // Chỉ có 1 môn để chọn thì gán luôn
        const def = subjectOptions.length === 1 ? subjectOptions[0].id : "";
        onFileSubjectIdsChange([
          ...value.map((_, i) => fileSubjectIds[i] ?? ""),
          ...added.map(() => def),
        ]);
      }
    }
  };

  const remove = (index: number) => {
    setLocalProblems([]);
    onChange(value.filter((_, i) => i !== index));
    if (pickSubject) {
      onFileSubjectIdsChange(
        value
          .map((_, i) => fileSubjectIds[i] ?? "")
          .filter((_, i) => i !== index),
      );
    }
  };

  const localError = localProblems.map((p) => t(p.key, p.params)).join(". ");
  const message = localError || error;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text">
        {t("auth.certificateUpload.legend")}{" "}
        <span className="text-xs font-normal text-text-secondary">
          {t("auth.certificateUpload.limits", {
            maxFiles,
            maxSize: maxSizeMB,
          })}
        </span>
      </legend>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {previews.map((p, i) => (
          <div key={`${p.file.name}-${i}`} className="flex flex-col gap-1">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <img
                src={p.url}
                alt={p.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={t("auth.certificateUpload.removeAria", {
                  name: p.file.name,
                })}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="size-3" />
              </button>
            </div>
            {pickSubject && (
              <select
                value={fileSubjectIds[i] ?? ""}
                onChange={(e) =>
                  onFileSubjectIdsChange(
                    value.map((_, k) =>
                      k === i ? e.target.value : (fileSubjectIds[k] ?? ""),
                    ),
                  )
                }
                aria-label={t("auth.certificateUpload.subjectOfAria", {
                  name: p.file.name,
                })}
                className="w-full rounded-md border border-border bg-transparent px-1 py-1 text-base sm:text-xs"
              >
                <option value="">
                  {t("auth.certificateUpload.pickSubject")}
                </option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="size-5" />
            {t("auth.certificateUpload.addImage")}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        hidden
        onChange={handlePick}
      />

      {message && (
        <p role="alert" className="text-xs text-danger-text">
          {message}
        </p>
      )}
    </fieldset>
  );
}
