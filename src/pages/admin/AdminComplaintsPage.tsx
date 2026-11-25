import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Select } from "@/shared/components/ui/Select";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/shared/utils/errors";
import { useToast } from "@/shared/hooks/useToast";
import { applicationService } from "@/config/di/container";
import { formatVnd } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { reviewService } from "@/features/review/service/review.service";
import {
  useAdminMutations,
  useComplaints,
} from "@/features/admin/hooks/useAdmin";
import type {
  ComplaintDto,
  ComplaintStatus,
} from "@/features/admin/service/admin.complaints.service";
// Khóa i18n, dịch lúc hiển thị để đổi ngôn ngữ vẫn đúng
const labels = {
  PENDING: "adminComplaints.status.PENDING",
  APPROVED: "adminComplaints.status.APPROVED",
  REJECTED: "adminComplaints.status.REJECTED",
};
export default function AdminComplaintsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const { data, isLoading, isError, refetch } = useComplaints(
    status || undefined,
  );
  const { decideComplaint } = useAdminMutations();
  const [target, setTarget] = useState<ComplaintDto | null>(null);
  const reviewQuery = useQuery({
    queryKey: ["admin", "complaint-review", target?.reviewId],
    queryFn: () => reviewService.getReviewById(target!.reviewId),
    enabled: Boolean(target?.reviewId),
  });
  const review = reviewQuery.data;
  const applicationId = review?.applicationId;
  const appQuery = useQuery({
    queryKey: ["admin", "complaint-application", applicationId],
    queryFn: () => applicationService.getApplicationById(applicationId!),
    enabled: Boolean(applicationId),
  });
  const app = appQuery.data;
  const toast = useToast();
  const resolve = (status: "APPROVED" | "REJECTED") => {
    if (!target) return;
    decideComplaint.mutate(
      { complaintId: target.id, status },
      {
        onSuccess: () => {
          toast.success(t("adminComplaints.updatedToast"));
          setTarget(null);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader title={t("adminComplaints.title")} />
      <Select
        aria-label={t("adminComplaints.statusAria")}
        placeholder={t("adminComplaints.allStatuses")}
        value={status}
        onChange={(e) => setStatus(e.target.value as ComplaintStatus | "")}
        options={Object.entries(labels).map(([value, label]) => ({
          value,
          label: t(label),
        }))}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title={t("adminComplaints.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <p className="font-bold">{t(labels[c.status])}</p>
              <Link
                to={ROUTES.TUTOR_DETAIL(c.tutorId)}
                className="text-primary"
              >
                {t("adminComplaints.tutor", { name: c.tutorName ?? c.tutorId })}
              </Link>
              <p className="text-sm">
                {t("adminComplaints.reviewId", { id: c.reviewId })}
              </p>
              <p className="my-2">
                {t("adminComplaints.reason", { reason: c.reason })}
              </p>
              {c.status === "PENDING" && (
                <Button size="sm" onClick={() => setTarget(c)}>
                  {t("adminComplaints.review")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={t("adminComplaints.detailTitle")}
        footer={
          <>
            <Button
              variant="outline"
              loading={decideComplaint.isPending}
              onClick={() => resolve("REJECTED")}
            >
              {t("adminComplaints.reject")}
            </Button>
            <Button
              loading={decideComplaint.isPending}
              onClick={() => resolve("APPROVED")}
            >
              {t("adminComplaints.approve")}
            </Button>
          </>
        }
      >
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
          <section>
            <h3 className="mb-2 font-bold">
              {t("adminComplaints.sectionComplaint")}
            </h3>
            <p>{target?.reason}</p>
            <p className="mt-1 text-xs text-text-secondary">
              {t(labels[target?.status ?? "PENDING"])}
              {target?.createdAt ? ` · ${formatDate(target.createdAt)}` : ""}
            </p>
          </section>
          <section>
            <h3 className="mb-2 font-bold">
              {t("adminComplaints.sectionReview")}
            </h3>
            {reviewQuery.isLoading ? (
              <p className="text-text-secondary">
                {t("adminComplaints.loadingReview")}
              </p>
            ) : review ? (
              <div>
                <div className="flex items-center gap-2">
                  <RatingStars value={review.rating} />
                  <span className="text-xs text-text-secondary">
                    {review.student.fullName}
                    {review.createdAt
                      ? ` · ${formatDate(review.createdAt)}`
                      : ""}
                  </span>
                </div>
                {review.comment && <p className="mt-2">{review.comment}</p>}
              </div>
            ) : (
              <p className="text-text-secondary">
                {t("adminComplaints.reviewLoadFailed")}
              </p>
            )}
          </section>
          <section>
            <h3 className="mb-2 font-bold">
              {t("adminComplaints.sectionApplication")}
            </h3>
            {appQuery.isLoading ? (
              <p className="text-text-secondary">
                {t("adminComplaints.loadingApplication")}
              </p>
            ) : app ? (
              <div className="flex flex-col gap-1.5">
                <p className="font-bold">{app.post.title}</p>
                <p className="text-xs text-text-secondary">
                  {app.post.type === "FIND_TUTOR"
                    ? t("adminComplaints.findTutor")
                    : t("adminComplaints.findStudent")}{" "}
                  {t("adminComplaints.statusLine", {
                    status: app.applicationStatus,
                  })}
                  {app.paid ? t("adminComplaints.paidSuffix") : ""}
                </p>
                <p className="text-xs text-text-secondary">
                  {t("adminComplaints.people", {
                    student: app.student.fullName,
                    tutor: app.tutor.fullName,
                  })}
                </p>
                {app.message && (
                  <p className="text-xs">
                    {t("adminComplaints.message", { message: app.message })}
                  </p>
                )}
                {app.proposedFee != null && (
                  <p className="text-xs font-semibold text-primary">
                    {t("adminComplaints.proposedFee", {
                      fee: formatVnd(app.proposedFee),
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-secondary">
                {t("adminComplaints.applicationLoadFailed")}
              </p>
            )}
          </section>
          {app && (
            <section>
              <h3 className="mb-2 font-bold">
                {t("adminComplaints.sectionTimeline")}
              </h3>
              <ol className="flex flex-col gap-1.5">
                <li>
                  {t("adminComplaints.tlApplied")}
                  {app.appliedAt ? ` — ${formatDate(app.appliedAt)}` : ""}
                </li>
                {app.selectedAt && (
                  <li>
                    {t("adminComplaints.tlSelected", {
                      date: formatDate(app.selectedAt),
                    })}
                  </li>
                )}
                {app.paid ? (
                  <li>
                    {t("adminComplaints.tlPaid")}
                    {app.paidAt ? ` — ${formatDate(app.paidAt)}` : ""}
                  </li>
                ) : (
                  <li>
                    {t("adminComplaints.tlUnpaid")}
                    {app.expiresAt
                      ? t("adminComplaints.tlDue", {
                          date: formatDate(app.expiresAt),
                        })
                      : ""}
                  </li>
                )}
                {review?.createdAt && (
                  <li>
                    {t("adminComplaints.tlReviewed", {
                      date: formatDate(review.createdAt),
                    })}
                  </li>
                )}
                {target?.createdAt && (
                  <li>
                    {t("adminComplaints.tlComplained", {
                      date: formatDate(target.createdAt),
                    })}
                  </li>
                )}
              </ol>
            </section>
          )}
          <p className="text-xs text-text-secondary">
            {t("adminComplaints.footnote")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
