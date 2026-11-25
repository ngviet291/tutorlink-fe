import { BadgeCheck, Clock, ShieldQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/Badge";
import type { CertificateResponse } from "@/features/user/types/user.dto";
import { useTutorCertificates } from "../hooks/useAdmin";

const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);

function StatusBadge({ c }: { c: CertificateResponse }) {
  const { t } = useTranslation();
  if (c.verified)
    return (
      <Badge tone="green" icon={<BadgeCheck className="size-3" />}>
        {t("adminTutorCertificateGallery.verified")}
      </Badge>
    );
  if (c.pendingAdminReview)
    return (
      <Badge tone="blue" icon={<ShieldQuestion className="size-3" />}>
        {t("adminTutorCertificateGallery.pendingAdmin")}
      </Badge>
    );
  return (
    <Badge tone="yellow" icon={<Clock className="size-3" />}>
      {t("adminTutorCertificateGallery.aiChecking")}
    </Badge>
  );
}

/** Hiện thẳng ảnh chứng chỉ của gia sư trong modal duyệt hồ sơ. */
export function TutorCertificateGallery({ tutorId }: { tutorId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useTutorCertificates(tutorId);

  if (isLoading)
    return (
      <p className="text-text-secondary">
        {t("adminTutorCertificateGallery.loading")}
      </p>
    );
  if (isError)
    return (
      <p className="text-danger-text">
        {t("adminTutorCertificateGallery.loadError")}
      </p>
    );
  if (!data?.length)
    return (
      <p className="text-text">{t("adminTutorCertificateGallery.none")}</p>
    );

  return (
    <ul className="mt-1 grid gap-3 sm:grid-cols-2">
      {data.map((c) => (
        <li
          key={c.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
        >
          <a href={c.fileUrl} target="_blank" rel="noreferrer">
            {isPdf(c.fileUrl) ? (
              <span className="text-primary underline">
                {t("adminTutorCertificateGallery.openPdf")}
              </span>
            ) : (
              <img
                src={c.fileUrl}
                alt={c.name ?? t("adminTutorCertificateGallery.imageAlt")}
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
