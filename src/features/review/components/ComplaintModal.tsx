import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/ui/Textarea";
import { useToast } from "@/shared/hooks/useToast";
import { useReviewMutations } from "../hooks/useReviews";
import type { ReviewResponse } from "../types/review.types";

interface Props {
  review: ReviewResponse | null;
  onClose: () => void;
}

interface FormValues {
  reason: string;
}

const REASON_MIN_LENGTH = 10;

export function ComplaintModal({ review, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { complain } = useReviewMutations();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const close = () => {
    reset();
    onClose();
  };

  const submit = handleSubmit(({ reason }) => {
    if (!review) return;
    complain.mutate(
      { reviewId: review.id, reason },
      {
        onSuccess: () => {
          toast.success(t("review.complaintModal.sent"));
          close();
        },
        onError: (e) => toast.apiError(e),
      },
    );
  });

  return (
    <Modal
      open={Boolean(review)}
      onClose={close}
      title={t("review.complaintModal.title")}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} loading={complain.isPending}>
            {t("review.complaintModal.submit")}
          </Button>
        </>
      }
    >
      {review && (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <blockquote className="rounded-xl bg-surface-hover p-3 text-sm text-text-secondary">
            {t("review.complaintModal.quote", {
              comment: review.comment,
              rating: review.rating,
              name: review.student.fullName,
            })}
          </blockquote>
          <Textarea
            label={t("review.complaintModal.reasonLabel")}
            required
            placeholder={t("review.complaintModal.reasonPlaceholder")}
            error={errors.reason?.message}
            {...register("reason", {
              required: t("review.complaintModal.reasonRequired"),
              minLength: {
                value: REASON_MIN_LENGTH,
                message: t("review.complaintModal.reasonMin", {
                  min: REASON_MIN_LENGTH,
                }),
              },
            })}
          />
        </form>
      )}
    </Modal>
  );
}
