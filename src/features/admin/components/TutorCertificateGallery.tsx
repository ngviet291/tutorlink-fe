import { BadgeCheck, Clock, ShieldQuestion } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import { useTutorCertificates } from "../hooks/useAdmin";

const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);

function StatusBadge({ c }: { c: CertificateResponse }) {
  if (c.verified)
    return (
      <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
        Đã xác thực
      </Badge>
    );
  if (c.pendingAdminReview)
    return (
      <Badge tone="blue" icon={<ShieldQuestion className="size-3" />}>
        Chờ admin duyệt
      </Badge>
    );
  return (
    <Badge tone="yellow" icon={<Clock className="size-3" />}>
      AI đang kiểm tra
    </Badge>
  );
}

/** Hiện thẳng ảnh chứng chỉ của gia sư trong modal duyệt hồ sơ. */
export function TutorCertificateGallery({ tutorId }: { tutorId: string }) {
  const { data, isLoading, isError } = useTutorCertificates(tutorId);

  if (isLoading) return <p className="text-text-secondary">Đang tải chứng chỉ…</p>;
  if (isError)
    return <p className="text-danger">Không tải được chứng chỉ</p>;
  if (!data?.length) return <p className="text-text">Chưa có</p>;

  return (
    <ul className="mt-1 grid gap-3 sm:grid-cols-2">
      {data.map((c) => (
        <li
          key={c.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
        >
          <a href={c.fileUrl} target="_blank" rel="noreferrer">
            {isPdf(c.fileUrl) ? (
              <span className="text-primary underline">Mở file PDF</span>
            ) : (
              <img
                src={c.fileUrl}
                alt={c.name ?? "Ảnh chứng chỉ"}
                loading="lazy"
                className="max-h-56 w-full rounded-lg border border-border bg-surface-hover object-contain"
              />
            )}
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge c={c} />
            {c.subjectName && (
              <span className="text-xs font-semibold text-text">
                {c.subjectName}
              </span>
            )}
          </div>
          {c.name && (
            <p className="truncate text-xs text-text-secondary">{c.name}</p>
          )}
          {c.pendingAdminReview && !c.verified && c.reviewNote && (
            <p className="text-xs text-text-secondary">AI: {c.reviewNote}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
