import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { useToast } from "@/shared/hooks/useToast";
import { useApplicationMutations } from "../hooks/useApplications";
import { ExpiryCountdown } from "./ExpiryCountdown";
import { NextStepHint } from "./NextStepHint";
import { formatVnd } from "@/shared/utils/currency";
import { timeAgo } from "@/shared/utils/date";
import type { ApplicationResponse } from "../types/application.types";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

interface Props {
  application: ApplicationResponse;
  canSelect: boolean;
  onSelect: (a: ApplicationResponse) => void;
  showAi?: boolean;
  isOwner?: boolean;
  /** Callback khi countdown hết hạn — parent truyền refetch để reload trạng thái mới. */
  onExpire?: () => void;
}

export function ApplicantRow({
  application: a,
  canSelect,
  onSelect,
  showAi,
  isOwner,
  onExpire,
}: Props) {
  const { t } = useTranslation();
  const tutor = a.tutor;
  const toast = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const { confirm, unselect, reject, pay } = useApplicationMutations();
  const [payOpen, setPayOpen] = useState(false);
  const isTutor = user?.role === "TUTOR";
  const isStudent = user?.role === "STUDENT";
  // Người apply: gia sư với bài FIND_TUTOR, học viên với bài FIND_STUDENT.
  const isTutorPost = a.post.type === "FIND_TUTOR";
  const applicant = isTutorPost ? tutor : a.student;
  // Người apply là bên xác nhận sau khi trả phí (BE check theo post.type).
  // BE chỉ cho xác nhận khi đã trả phí nên chỉ hiện nút khi a.paid.
  const canConfirm =
    a.applicationStatus === "ACCEPTED" &&
    Boolean(a.paid) &&
    (isTutorPost ? isTutor : isStudent);
  // Gia sư của đơn luôn là người trả phí: bài FIND_TUTOR là gia sư ứng tuyển,
  // bài FIND_STUDENT là gia sư đăng bài (BE gán a.tutor = tác giả bài).
  const canPay =
    a.applicationStatus === "ACCEPTED" &&
    !a.paid &&
    isTutor &&
    Boolean(user?.id) &&
    user?.id === a.tutor.id;

  const onPay = () => {
    pay.mutate(a.id, {
      onSuccess: () => {
        setPayOpen(false);
        toast.success(t("application.applicantRow.paidToast"));
      },
      onError: (e) => {
        setPayOpen(false);
        toast.apiError(e);
      },
    });
  };

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {showAi && a.aiRank !== undefined && (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white"
              aria-label={t("application.rank", { rank: a.aiRank })}>
              {a.aiRank}
            </span>
          )}
          <Avatar
            name={applicant.fullName}
            src={applicant.avatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-text">{applicant.fullName}</span>
              <StatusBadge kind="application" status={a.applicationStatus} />
              {showAi && a.aiScore !== undefined && (
                <Badge tone="orange">
                  {t("application.matchScore", {
                    score: parseInt(a.aiScore * 100 + ""),
                  })}
                </Badge>
              )}
            </div>
            {isTutorPost && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                <RatingStars value={tutor.averageRating} showValue />
                <span>
                  {tutor.experienceYears} {t("common.yearsExp")}
                </span>
                {/* <span className="font-semibold text-primary">
                  {formatVnd(tutor.hourlyRate)}
                  {t("common.perHour")}
                </span> */}
              </div>
            )}
            {isTutorPost && tutor.subject && (
              <div className="mt-2 flex flex-wrap gap-1">
                <SubjectTag name={tutor.subject.name} />
              </div>
            )}
            {showAi && a.aiReason && (
              <p className="mt-2 rounded-lg bg-primary-light px-3 py-1.5 text-xs text-text">
                💡 {a.aiReason}
              </p>
            )}
            {a.proposedFee !== undefined && (
              <p className="mt-2 text-sm font-semibold text-primary">
                {t("application.applicantRow.proposed", {
                  fee: formatVnd(a.proposedFee),
                })}
              </p>
            )}
            {a.message && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-text-secondary">
                <MessageSquare className="mt-0.5 size-4 shrink-0" /> {a.message}
              </p>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="size-3.5" />
              {t("application.appliedAgo", { time: timeAgo(a.appliedAt) })}
            </p>
            <NextStepHint application={a} userId={user?.id} className="mt-2" />
            {/* Đơn ACCEPTED có expiresAt do BE tính: chưa trả -> hạn thanh toán (W1), đã trả -> hạn applicant confirm (W2) */}
            {a.applicationStatus === "ACCEPTED" && a.expiresAt && (
              <ExpiryCountdown
                expiresAt={a.expiresAt}
                actionLabel={
                  a.paid
                    ? t("application.applicantRow.actionConfirm")
                    : isTutorPost
                      ? t("application.applicantRow.actionTutorPay")
                      : t("application.applicantRow.actionPay")
                }
                onExpire={onExpire}
                className="mt-1"
              />
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2">
          <Link
            to={
              isTutorPost
                ? ROUTES.TUTOR_DETAIL(applicant.id)
                : ROUTES.STUDENT_DETAIL(applicant.id)
            }
            state={{ section: showAi ? "TOP" : "OTHERS", rank: a.aiRank }}>
            <Button variant="outline" size="sm" fullWidth>
              {t("tutor.viewProfile")}
            </Button>
          </Link>
          {canPay && (
            <Button size="sm" onClick={() => setPayOpen(true)}>
              {t("application.applicantRow.payFee")}
            </Button>
          )}
          {canConfirm && (
            <Button
              size="sm"
              loading={confirm.isPending}
              onClick={() =>
                confirm.mutate(a.id, {
                  onSuccess: () =>
                    toast.success(t("application.applicantRow.confirmedToast")),
                  onError: (e) => toast.apiError(e),
                })
              }>
              {isTutorPost
                ? t("application.applicantRow.confirmTutor")
                : t("application.applicantRow.confirmStudent")}
            </Button>
          )}
          {canSelect && a.applicationStatus === "PENDING" && (
            <Button size="sm" onClick={() => onSelect(a)}>
              {t("application.selectApplicant")}
            </Button>
          )}
          {isOwner && a.applicationStatus === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              loading={reject.isPending}
              onClick={() =>
                reject.mutate(a.id, {
                  onSuccess: () =>
                    toast.success(t("application.applicantRow.rejectedToast")),
                  onError: (e) => toast.apiError(e),
                })
              }>
              {t("application.applicantRow.reject")}
            </Button>
          )}
          {/* BE không cho hủy chọn sau khi đã trả phí */}
          {isOwner && a.applicationStatus === "ACCEPTED" && !a.paid && (
            <Button
              size="sm"
              variant="outline"
              loading={unselect.isPending}
              onClick={() =>
                unselect.mutate(a.id, {
                  onSuccess: () =>
                    toast.success(
                      t("application.applicantRow.unselectedToast"),
                    ),
                  onError: (e) => toast.apiError(e),
                })
              }>
              {t("application.applicantRow.unselect")}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={t("application.applicantRow.payDialog.title")}
        confirmText={t("application.applicantRow.payDialog.confirm")}
        loading={pay.isPending}
        onConfirm={onPay}
        description={t("application.applicantRow.payDialog.description")}
      />
    </li>
  );
}
