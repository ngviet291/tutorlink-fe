import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { useAdminMutations, usePendingCertificates } from "../hooks/useAdmin";
import type { PendingCertificate } from "../types/admin.types";

const REASON_MIN_LENGTH = 5;

/** Chứng chỉ AI không tự duyệt được khi gia sư cập nhật hồ sơ: admin xem ảnh rồi duyệt / từ chối. */
export function AdminCertificatesPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = usePendingCertificates();
  const { reviewCertificate } = useAdminMutations();
  const [rejecting, setRejecting] = useState<PendingCertificate | null>(null);
  const [reason, setReason] = useState("");
  // Lưu cờ thay vì chuỗi để chữ lỗi được dịch lại mỗi lần render (đổi VI/EN ngay).
  const [reasonError, setReasonError] = useState(false);

  const closeReject = () => {
    setRejecting(null);
    setReason("");
    setReasonError(false);
  };

  const submit = (c: PendingCertificate, approved: boolean, why?: string) =>
    reviewCertificate.mutate(
      { id: c.id, approved, reason: why },
      {
        onSuccess: () => {
          toast.success(
            approved
              ? t("adminCertificatesPanel.approved")
              : t("adminCertificatesPanel.rejected"),
          );
          closeReject();
        },
        onError: (e) => toast.apiError(e),
      },
    );

  const confirmReject = () => {
    if (!rejecting) return;
    if (reason.trim().length < REASON_MIN_LENGTH) {
      setReasonError(true);
      return;
    }
    submit(rejecting, false, reason.trim());
  };

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t("adminCertificatesPanel.title")}
    >
      <div>
        <h2 className="text-lg font-bold text-text">
          {t("adminCertificatesPanel.title")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t("adminCertificatesPanel.description")}
        </p>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title={t("adminCertificatesPanel.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
              <a href={c.fileUrl} target="_blank" rel="noreferrer">
                <img
                  src={c.fileUrl}
                  alt={c.name ?? t("adminCertificatesPanel.imageAlt")}
                  className="size-20 rounded-lg border border-border object-cover"
                />
              </a>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text">{c.tutorName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {c.subjectName && (
                    <SubjectTag name={c.subjectName} />
                  )}
                  <span className="truncate text-xs text-text-secondary">
                    {c.name}
                  </span>
                </div>
                {c.reviewNote && (
                  <p className="mt-1 text-xs text-text-secondary">
                    AI: {c.reviewNote}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  disabled={reviewCertificate.isPending}
                  onClick={() => setRejecting(c)}
                >
                  <X className="size-4" /> {t("adminCertificatesPanel.reject")}
                </Button>
                <Button
                  loading={
                    reviewCertificate.isPending &&
                    reviewCertificate.variables?.id === c.id
                  }
                  onClick={() => submit(c, true)}
                >
                  <Check className="size-4" />{" "}
                  {t("adminCertificatesPanel.approve")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={closeReject}
        title={t("adminCertificatesPanel.rejectTitle", {
          name: rejecting?.tutorName ?? "",
        })}
        footer={
          <Button
            variant="danger"
            loading={reviewCertificate.isPending}
            onClick={confirmReject}
          >
            <X className="size-4" /> {t("adminCertificatesPanel.reject")}
          </Button>
        }
      >
        <Textarea
          label={t("adminCertificatesPanel.reasonLabel")}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError(false);
          }}
          error={
            reasonError
              ? t("adminCertificatesPanel.reasonTooShort", {
                  min: REASON_MIN_LENGTH,
                })
              : undefined
          }
          hint={t("adminCertificatesPanel.reasonHint")}
        />
      </Modal>
    </section>
  );
}
