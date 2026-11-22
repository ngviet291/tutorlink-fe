import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import {
  useAdminMutations,
  usePendingCertificates,
} from "../hooks/useAdmin";
import type { PendingCertificate } from "../types/admin.types";

/** Chứng chỉ AI không tự duyệt được khi gia sư cập nhật hồ sơ: admin xem ảnh rồi duyệt / từ chối. */
export function AdminCertificatesPanel() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = usePendingCertificates();
  const { reviewCertificate } = useAdminMutations();
  const [rejecting, setRejecting] = useState<PendingCertificate | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const closeReject = () => {
    setRejecting(null);
    setReason("");
    setReasonError("");
  };

  const submit = (c: PendingCertificate, approved: boolean, why?: string) =>
    reviewCertificate.mutate(
      { id: c.id, approved, reason: why },
      {
        onSuccess: () => {
          toast.success(
            approved ? "Đã duyệt chứng chỉ" : "Đã từ chối chứng chỉ",
          );
          closeReject();
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  const confirmReject = () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      setReasonError("Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)");
      return;
    }
    submit(rejecting, false, reason.trim());
  };

  return (
    <section className="flex flex-col gap-3" aria-label="Chứng chỉ chờ admin duyệt">
      <div>
        <h2 className="text-lg font-bold text-text">
          Chứng chỉ chờ admin duyệt
        </h2>
        <p className="text-sm text-text-secondary">
          Chứng chỉ gia sư vừa cập nhật mà AI không tự duyệt được.
        </p>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title="Không có chứng chỉ nào chờ duyệt" />
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
                  alt={c.name ?? "Ảnh chứng chỉ"}
                  className="size-20 rounded-lg border border-border object-cover"
                />
              </a>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text">{c.tutorName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {c.subjectName && <SubjectTag name={c.subjectName} />}
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
                  <X className="size-4" /> Từ chối
                </Button>
                <Button
                  loading={
                    reviewCertificate.isPending &&
                    reviewCertificate.variables?.id === c.id
                  }
                  onClick={() => submit(c, true)}
                >
                  <Check className="size-4" /> Duyệt
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={closeReject}
        title={`Từ chối chứng chỉ: ${rejecting?.tutorName ?? ""}`}
        footer={
          <Button
            variant="danger"
            loading={reviewCertificate.isPending}
            onClick={confirmReject}
          >
            <X className="size-4" /> Từ chối
          </Button>
        }
      >
        <Textarea
          label="Lý do"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError("");
          }}
          error={reasonError}
          hint="Chứng chỉ sẽ bị xóa; gia sư sẽ nhận được lý do này."
        />
      </Modal>
    </section>
  );
}
