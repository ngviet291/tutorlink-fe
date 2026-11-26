import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { Textarea } from "@/shared/components/ui/Textarea";
import { formatVnd } from "@/shared/utils/currency";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminMutations,
  usePendingTutors,
} from "@/features/admin/hooks/useAdmin";
import { TutorCertificateGallery } from "@/features/admin/components/TutorCertificateGallery";
import { AdminCertificatesPanel } from "@/features/admin/components/AdminCertificatesPanel";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";

const MIN_REJECT_NOTE = 5;

export default function AdminTutorReviewPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = usePendingTutors();
  const { reviewTutor } = useAdminMutations();
  const [detail, setDetail] = useState<TutorResponse | null>(null);
  const [note, setNote] = useState("");
  // Lưu cờ thay vì chữ để câu lỗi đổi theo ngôn ngữ
  const [noteInvalid, setNoteInvalid] = useState(false);

  const close = () => {
    setDetail(null);
    setNote("");
    setNoteInvalid(false);
  };

  const decide = (decision: "APPROVED" | "REJECTED") => {
    if (!detail) return;
    if (decision === "REJECTED" && note.trim().length < MIN_REJECT_NOTE) {
      setNoteInvalid(true);
      return;
    }
    reviewTutor.mutate(
      { id: detail.id, payload: { decision, note: note.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(
            decision === "APPROVED"
              ? t("adminTutorReview.approved")
              : t("adminTutorReview.rejected"),
          );
          close();
        },
        onError: (e) => toast.apiError(e),
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader
        title={t("adminTutorReview.title")}
        description={t("adminTutorReview.description")}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title={t("adminTutorReview.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((tutor) => (
            <li
              key={tutor.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
              <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text">{tutor.fullName}</p>
                <p className="text-xs text-text-secondary">
                  {t("adminTutorReview.summary", {
                    years: tutor.experienceYears,
                    // fee: formatVnd(tutor.hourlyRate),
                  })}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {tutor.subjects?.length ? (
                    tutor.subjects.map((s) => (
                      <SubjectTag key={s.id} name={s.name} />
                    ))
                  ) : (
                    <span className="text-xs text-text-secondary">
                      {t("adminTutorReview.noSubject")}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => setDetail(tutor)}>
                {t("adminTutorReview.viewAndReview")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AdminCertificatesPanel />

      <Modal
        open={Boolean(detail)}
        onClose={close}
        title={t("adminTutorReview.modalTitle", {
          name: detail?.fullName ?? "",
        })}
        size="lg"
        footer={
          <>
            <Button
              variant="danger"
              loading={reviewTutor.isPending}
              onClick={() => decide("REJECTED")}>
              <X className="size-4" /> {t("adminTutorReview.reject")}
            </Button>
            <Button
              loading={reviewTutor.isPending}
              onClick={() => decide("APPROVED")}>
              <Check className="size-4" /> {t("adminTutorReview.approve")}
            </Button>
          </>
        }>
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-secondary">
                  {t("adminTutorReview.education")}
                </dt>
                <dd className="font-semibold text-text">
                  {detail.education || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">
                  {t("adminTutorReview.area")}
                </dt>
                <dd className="font-semibold text-text">
                  {(detail.teachingAreas?.length
                    ? detail.teachingAreas
                    : [detail.address?.province]
                  )
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">
                  {t("adminTutorReview.experience")}
                </dt>
                <dd className="font-semibold text-text">
                  {t("adminTutorReview.experienceValue", {
                    years: detail.experienceYears,
                  })}
                </dd>
              </div>
              {/* <div>
                <dt className="text-xs text-text-secondary">
                  {t("adminTutorReview.pricePerHour")}
                </dt>
                <dd className="font-semibold text-text">
                  {formatVnd(detail.hourlyRate)}
                </dd>
              </div> */}
              <div>
                <p className="text-xs text-text-secondary">
                  {t("adminTutorReview.subjects")}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detail.subjects?.length ? (
                    detail.subjects.map((s) => (
                      <SubjectTag key={s.id} name={s.name} />
                    ))
                  ) : (
                    <p className="text-text">—</p>
                  )}
                </div>
              </div>
            </dl>
            <div>
              <p className="text-xs text-text-secondary">
                {t("adminTutorReview.bio")}
              </p>
              <p className="text-text">{detail.bio || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">
                {t("adminTutorReview.certificates")}
              </p>
              <TutorCertificateGallery tutorId={detail.id} />
            </div>

            <Textarea
              label={t("adminTutorReview.noteLabel")}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteInvalid(false);
              }}
              error={
                noteInvalid
                  ? t("adminTutorReview.noteRequired", { min: MIN_REJECT_NOTE })
                  : undefined
              }
              hint={t("adminTutorReview.noteHint")}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
