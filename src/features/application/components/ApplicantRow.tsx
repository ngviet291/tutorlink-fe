import { Link } from "react-router-dom";
import { Clock, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import { useApplicationMutations } from "../hooks/useApplications";
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
}

export function ApplicantRow({
  application: a,
  canSelect,
  onSelect,
  showAi,
}: Props) {
  const { t } = useTranslation();
  const tutor = a.tutor;
  const toast = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const { confirm } = useApplicationMutations();
  const isTutor = user?.role === "TUTOR";

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {showAi && a.aiRank !== undefined && (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white"
              aria-label={t("application.rank", { rank: a.aiRank })}>
              {a.aiRank}
            </span>
          )}
          <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-text">{tutor.fullName}</span>
              <StatusBadge kind="application" status={a.applicationStatus} />
              {showAi && a.aiScore !== undefined && (
                <Badge tone="orange">
                  {t("application.matchScore", { score: a.aiScore })}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
              <RatingStars value={tutor.averageRating} showValue />
              <span>
                {tutor.experienceYears} {t("common.yearsExp")}
              </span>
              <span className="font-semibold text-primary">
                {formatVnd(tutor.hourlyRate)}
                {t("common.perHour")}
              </span>
            </div>
            {tutor.subject && (
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
                Đề xuất: {formatVnd(a.proposedFee)}
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
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Link
            to={ROUTES.TUTOR_DETAIL(tutor.id)}
            state={{ section: showAi ? "TOP" : "OTHERS", rank: a.aiRank }}>
            <Button variant="outline" size="sm" fullWidth>
              {t("tutor.viewProfile")}
            </Button>
          </Link>
          {isTutor && a.applicationStatus === "ACCEPTED" && (
            <Button
              size="sm"
              loading={confirm.isPending}
              onClick={() =>
                confirm.mutate(a.id, {
                  onSuccess: () => toast.success("Đã xác nhận gia sư"),
                  onError: (e) => toast.error(getErrorMessage(e)),
                })
              }>
              Xác nhận gia sư
            </Button>
          )}
          {canSelect && a.applicationStatus === "PENDING" && (
            <Button size="sm" onClick={() => onSelect(a)}>
              {t("application.selectApplicant")}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
