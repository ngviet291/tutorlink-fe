import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface CertificateUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function CertificateUpload({
  value,
  onChange,
  error,
  maxFiles = 5,
  maxSizeMB = 5,
}: CertificateUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");

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
    const problems: string[] = [];
    const valid: File[] = [];

    for (const f of picked) {
      if (!ACCEPTED.includes(f.type)) {
        problems.push(`${f.name}: chỉ nhận JPG, PNG, WEBP`);
      } else if (f.size > maxSizeMB * 1024 * 1024) {
        problems.push(`${f.name}: vượt quá ${maxSizeMB}MB`);
      } else {
        valid.push(f);
      }
    }

    const room = maxFiles - value.length;
    if (valid.length > room) problems.push(`Tối đa ${maxFiles} ảnh`);

    setLocalError(problems.join(". "));
    if (valid.length > 0) onChange([...value, ...valid.slice(0, room)]);
  };

  const remove = (index: number) => {
    setLocalError("");
    onChange(value.filter((_, i) => i !== index));
  };

  const message = localError || error;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text">
        Ảnh chứng chỉ / bằng cấp{" "}
        <span className="text-xs font-normal text-text-secondary">
          (tối đa {maxFiles} ảnh, mỗi ảnh ≤ {maxSizeMB}MB)
        </span>
      </legend>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {previews.map((p, i) => (
          <div
            key={`${p.file.name}-${i}`}
            className="relative aspect-square overflow-hidden rounded-lg border border-border">
            <img
              src={p.url}
              alt={p.file.name}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Xóa ${p.file.name}`}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
              <X className="size-3" />
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary">
            <ImagePlus className="size-5" />
            Thêm ảnh
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
        <p role="alert" className="text-xs text-red-600">
          {message}
        </p>
      )}
    </fieldset>
  );
}
