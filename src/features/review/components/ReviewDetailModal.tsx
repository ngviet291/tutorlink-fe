import { useState } from "react";
import { useSelector } from "react-redux";
import { Flag, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { formatDate } from "@/shared/utils/date";
import type { RootState } from "@/app/store";
import { useTutorReviews } from "../hooks/useReviews";
import { ComplaintModal } from "./ComplaintModal";
import { ReviewForm } from "./ReviewForm";

interface Props {
  applicationId: string;
  tutorId?: string;
  open: boolean;
  onClose: () => void;
}

// Modal xem lại đánh giá của 1 đơn FINISHED.
// Học viên viết đánh giá được sửa (nếu chưa bị khiếu nại).
// Gia sư xem được đánh giá học viên để lại và có thể khiếu nại (ComplaintModal).
export function ReviewDetailModal({
  applicationId,
  tutorId,
  open,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useTutorReviews(open ? tutorId : undefined);
  const review = data?.find((r) => r.applicationId === applicationId);
  const user = useSelector((state: RootState) => state.auth.user);
  const isTutor = user?.role === "TUTOR";
  const isOwner = user?.role === "STUDENT" && review?.student?.id === user.id;
  const [complainOpen, setComplainOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const status = review?.complaintStatus;
  // BE: NONE | PENDING | APPROVED (đánh giá bị gỡ) | REJECTED (giữ lại đánh giá)
  const complained = Boolean(status && status !== "NONE");
  const complaintNote =
    status === "PENDING" || status === "OPEN"
      ? t("review.detail.complaintPending")
      : status === "REJECTED" || status === "RESOLVED"
        ? t("review.detail.complaintRejected")
        : status === "APPROVED"
          ? t("review.detail.complaintApproved")
          : "";

  return (
    <>
      <Modal open={open} onClose={onClose} title={t("review.detail.title")}>
        {isLoading ? (
          <ListSkeleton rows={2} />
        ) : !review ? (
          <p className="text-sm text-text-secondary">
            {isTutor
              ? t("review.detail.notFoundTutor")
              : t("review.detail.notFound")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {review.student?.fullName && (
              <p className="text-sm font-medium text-text">
                {review.student.fullName}
              </p>
            )}

            <RatingStars value={review.rating} showValue />

            {review.comment && (
              <p className="text-sm text-text">{review.comment}</p>
            )}

            {review.createdAt && (
              <p className="text-xs text-text-secondary">
                {formatDate(review.createdAt)}
              </p>
            )}

            {isOwner &&
              (complained ? (
                <p className="text-xs text-text-secondary">
                  {t("review.detail.editLocked")}
                </p>
              ) : (
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="size-4" />
                    {t("review.detail.edit")}
                  </Button>
                </div>
              ))}

            {isTutor &&
              (complained ? (
                <p
                  role="status"
                  className="text-xs font-medium text-text-secondary"
                >
                  {complaintNote}
                </p>
              ) : (
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setComplainOpen(true)}
                  >
                    <Flag className="size-4" />
                    {t("review.detail.complain")}
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Modal>

      <ComplaintModal
        review={complainOpen ? (review ?? null) : null}
        onClose={() => setComplainOpen(false)}
      />

      {review && (
        <ReviewForm
          applicationId={applicationId}
          reviewId={review.id}
          initialRating={review.rating}
          initialComment={review.comment}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
