import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatDate } from "@/shared/utils/date";
import { OfferList } from "@/features/application/components/OfferList";
import { ExpiryCountdown } from "@/features/application/components/ExpiryCountdown";
import { NextStepHint } from "@/features/application/components/NextStepHint";
import { useToast } from "@/shared/hooks/useToast";
import {
  useApplicationMutations,
  useMyApplications,
} from "@/features/application/hooks/useApplications";
import { isApplicant, isFeePayer } from "@/features/application/util/applicant";
import type { RootState } from "@/app/store";
import type { ApplicationResponse } from "@/features/application/types/application.types";
import { PayFeeModal } from "@/features/wallet/components/PayFeeModal";
import { ReviewForm } from "@/features/review/components/ReviewForm";
import { ReviewDetailModal } from "@/features/review/components/ReviewDetailModal";
import { reviewService } from "@/features/review/service/review.service";
import { useHasReviewed } from "@/features/review/hooks/useReviews";

export default function MyApplicationsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyApplications();
  const toast = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const { finish, confirm } = useApplicationMutations();
  const [offer, setOffer] = useState<ApplicationResponse | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ApplicationResponse | null>(
    null,
  );

  // Finish xong: học viên của đơn được mở modal đánh giá gia sư (nếu chưa review)
  const handleFinish = (a: ApplicationResponse) => {
    finish.mutate(a.id, {
      onSuccess: (res) => {
        const finished = res?.applicationStatus === "FINISHED";
        toast.success(
          finished
            ? t("myApplications.finished")
            : t("myApplications.finishWaiting"),
        );
        if (finished && user?.role === "STUDENT" && a.student?.id === user.id) {
          void reviewService
            .hasReviewed(a.id)
            .then((reviewed) => {
              if (!reviewed) setReviewTarget(a);
            })
            .catch(() => setReviewTarget(a));
        }
      },
      onError: (e) => toast.apiError(e),
    });
  };

  const reviewTutorName = reviewTarget
    ? ((reviewTarget.post.type === "FIND_TUTOR"
        ? reviewTarget.tutor?.fullName
        : reviewTarget.post.author?.fullName) ?? "")
    : "";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={t("myApplications.title")}
        description={
          user?.role === "TUTOR"
            ? t("myApplications.descTutor")
            : t("myApplications.descStudent")
        }
      />
      {user?.role === "TUTOR" && <OfferList onPay={setOffer} />}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState
          message={t("myApplications.loadError")}
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState
          title={
            user?.role === "TUTOR"
              ? t("myApplications.emptyTitleTutor")
              : t("myApplications.emptyTitleStudent")
          }
          description={t("myApplications.emptyDesc")}
          action={
            <Link to={ROUTES.FIND_CLASS}>
              <Button>{t("myApplications.findClassNow")}</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  to={ROUTES.POST_DETAIL(a.post.id)}
                  state={{ mine: true }}
                  className="block truncate font-bold text-text hover:text-primary"
                >
                  {a.post.title}
                </Link>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {t("myApplications.appliedOn", {
                    date: formatDate(a.appliedAt),
                  })}
                </p>
                <NextStepHint
                  application={a}
                  userId={user?.id}
                  className="mt-1.5"
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge kind="application" status={a.applicationStatus} />
                {/* Đơn ACCEPTED có expiresAt do BE tính: chưa trả -> hạn thanh toán (W1), đã trả -> hạn applicant confirm (W2) */}
                {a.applicationStatus === "ACCEPTED" && a.expiresAt && (
                  <ExpiryCountdown
                    expiresAt={a.expiresAt}
                    actionLabel={
                      a.paid || !isFeePayer(a, user?.id)
                        ? t("myApplications.actionConfirm")
                        : t("myApplications.actionPay")
                    }
                    onExpire={() => void refetch()}
                  />
                )}
                {a.applicationStatus === "ACCEPTED" &&
                  !a.paid &&
                  isFeePayer(a, user?.id) && (
                    <Button size="sm" onClick={() => setOffer(a)}>
                      {t("myApplications.payFee")}
                    </Button>
                  )}
                {a.applicationStatus === "ACCEPTED" &&
                  a.paid &&
                  isApplicant(a, user?.id) && (
                    <Button
                      size="sm"
                      loading={confirm.isPending && confirm.variables === a.id}
                      onClick={() =>
                        confirm.mutate(a.id, {
                          onSuccess: () =>
                            toast.success(t("myApplications.confirmed")),
                          onError: (e) => toast.apiError(e),
                        })
                      }
                    >
                      {t("myApplications.confirm")}
                    </Button>
                  )}
                {a.applicationStatus === "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={finish.isPending && finish.variables === a.id}
                    onClick={() => handleFinish(a)}
                  >
                    {t("myApplications.finishClass")}
                  </Button>
                )}
                {a.applicationStatus === "CONFIRMED" && (
                  <Link
                    to={ROUTES.CHAT_WITH(
                      (user?.id === a.student?.id
                        ? a.tutor?.id
                        : a.student?.id) ?? a.post.author.id,
                    )}
                  >
                    <Button size="sm" variant="secondary">
                      {t("myApplications.openChat")}
                    </Button>
                  </Link>
                )}
                {a.applicationStatus === "FINISHED" && (
                  <FinishedReviewAction a={a} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
      {reviewTarget && (
        <ReviewForm
          applicationId={reviewTarget.id}
          tutorName={reviewTutorName}
          open={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}

// Đơn FINISHED: học viên của đơn chưa đánh giá -> nút mở ReviewForm;
// đã đánh giá -> nút "Xem đánh giá" (cả học viên lẫn gia sư được xem).
// Gia sư chưa có đánh giá -> không hiện gì.
function FinishedReviewAction({ a }: { a: ApplicationResponse }) {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const isStudent = user?.role === "STUDENT" && a.student?.id === user.id;
  const isTutor = user?.role === "TUTOR" && a.tutor?.id === user.id;
  const { data: reviewed, isLoading } = useHasReviewed(a.id);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  if ((!isStudent && !isTutor) || isLoading) return null;
  if (reviewed) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setViewOpen(true)}>
          <Star className="size-4" /> {t("myApplications.viewReview")}
        </Button>
        <ReviewDetailModal
          applicationId={a.id}
          tutorId={a.tutor?.id}
          open={viewOpen}
          onClose={() => setViewOpen(false)}
        />
      </>
    );
  }

  // Chỉ học viên mới được đánh giá; gia sư chưa có review -> không hiện gì
  if (!isStudent) return null;
  const tutorName =
    (a.post.type === "FIND_TUTOR"
      ? a.tutor?.fullName
      : a.post.author?.fullName) ?? "";
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Star className="size-4" /> {t("myApplications.review")}
      </Button>
      <ReviewForm
        applicationId={a.id}
        tutorName={tutorName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
