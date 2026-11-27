import { useState } from "react";
import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { formatDate } from "@/shared/utils/date";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useHighlight, useHighlightParam } from "@/shared/hooks/useHighlight";
import { useTutorReviews } from "../hooks/useReviews";
import { ComplaintModal } from "./ComplaintModal";
import type { ReviewResponse } from "../types/review.types";

interface Props {
  tutorId: string;
  highlightReviewId?: string;
}

export function ReviewList({ tutorId, highlightReviewId }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useTutorReviews(tutorId);
  const [target, setTarget] = useState<ReviewResponse | null>(null);
  const isOwner = user?.id === tutorId;
  const isComplaintOpen = (st?: string) => st === "PENDING" || st === "OPEN";
  const isComplaintKept = (st?: string) =>
    st === "REJECTED" || st === "RESOLVED";

  const urlHighlightId = useHighlightParam();
  const highlightId = highlightReviewId ?? urlHighlightId;
  // ready = dữ liệu đã tải xong, để chỉ cuộn khi mục đã có trong DOM.
  const { ref, flashing, isHighlighted } = useHighlight<HTMLLIElement>(
    highlightId,
    Boolean(data),
  );

  if (isLoading) return <ListSkeleton rows={3} />;

  if (!data?.length) {
    return (
      <EmptyState
        title={t("review.list.empty.title")}
        description={t("review.list.empty.description")}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.map((r) => {
          const highlighted = isHighlighted(r.id);
          return (
            <li
              key={r.id}
              ref={highlighted ? ref : undefined}
              aria-current={highlighted ? "true" : undefined}
              className={`rounded-2xl border p-4 transition-colors duration-700 ${
                highlighted
                  ? flashing
                    ? "border-primary bg-primary-light ring-2 ring-primary"
                    : "border-primary bg-surface ring-2 ring-primary"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={r.student.fullName} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">
                      {r.student.fullName}
                    </span>

                    {r.createdAt && (
                      <span className="text-xs text-text-secondary">
                        {formatDate(r.createdAt)}
                      </span>
                    )}

                    {isComplaintOpen(r.complaintStatus) && (
                      <Badge tone="yellow">
                        {t("review.list.complaintOpen")}
                      </Badge>
                    )}

                    {isComplaintKept(r.complaintStatus) && (
                      <Badge tone="green">
                        {t("review.list.complaintResolved")}
                      </Badge>
                    )}
                  </div>

                  <RatingStars value={r.rating} showValue={false} />

                  <p className="mt-1 text-sm text-text-secondary">
                    {r.comment}
                  </p>

                  {r.complaintDecisionNote && (
                    <p className="mt-2 rounded-lg bg-surface-hover p-2 text-xs text-text-secondary">
                      {t("review.list.decisionNote")}: {r.complaintDecisionNote}
                    </p>
                  )}
                </div>

                {isOwner &&
                  (!r.complaintStatus || r.complaintStatus === "NONE") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTarget(r)}
                    >
                      <Flag className="size-4" />
                      {t("review.list.complain")}
                    </Button>
                  )}
              </div>
            </li>
          );
        })}
      </ul>

      <ComplaintModal review={target} onClose={() => setTarget(null)} />
    </>
  );
}
