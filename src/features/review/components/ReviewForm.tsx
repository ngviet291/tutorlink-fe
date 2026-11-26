import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { useSubmitReview, useUpdateReview } from "../hooks/useReviews";

interface Props {
  applicationId: string;
  tutorName?: string;
  open: boolean;
  onClose: () => void;
  /** Có reviewId -> chế độ sửa đánh giá đã gửi. */
  reviewId?: string;
  initialRating?: number;
  initialComment?: string;
}

export function ReviewForm({
  applicationId,
  tutorName,
  open,
  onClose,
  reviewId,
  initialRating = 5,
  initialComment = "",
}: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const submit = useSubmitReview();
  const update = useUpdateReview();
  const isEdit = Boolean(reviewId);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hovered, setHovered] = useState(0);

  // Mỗi lần mở lại thì nạp lại giá trị hiện có (chế độ sửa) hoặc giá trị mặc định
  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = () => {
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? t("review.updated") : t("review.submitted"));
        if (!isEdit) {
          setComment("");
          setRating(5);
        }
        onClose();
      },
      onError: (e: unknown) => toast.error(getErrorMessage(e)),
    };
    const body = { rating, comment: comment.trim() || undefined };

    if (reviewId) {
      update.mutate({ reviewId, ...body }, callbacks);
    } else {
      submit.mutate({ applicationId, ...body }, callbacks);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("review.editTitle")
          : t("review.title", { name: tutorName ?? "" })
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t("review.desc")}</p>

        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`size-8 ${
                  star <= (hovered || rating)
                    ? "fill-warning text-warning"
                    : "text-border"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-text-secondary">
            {rating}/5
          </span>
        </div>

        <Textarea
          label={t("review.comment")}
          placeholder={t("review.commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={300}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            loading={isEdit ? update.isPending : submit.isPending}
            onClick={handleSubmit}
          >
            {isEdit ? t("review.save") : t("review.submit")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
