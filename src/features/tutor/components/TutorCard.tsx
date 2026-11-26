import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, ChevronRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { formatVnd } from "@/shared/utils/currency";
import type { TutorResponse } from "../types/tutor.types";

const MAX_SUBJECTS = 3;

export function TutorCard({ tutor }: { tutor: TutorResponse }) {
  const { t } = useTranslation();
  const subjects = tutor.subjects ?? [];
  const visibleSubjects = subjects.slice(0, MAX_SUBJECTS);
  const hiddenCount = subjects.length - visibleSubjects.length;
  const isVerified = tutor.verificationStatus === "APPROVED";
  const hasRating = tutor.averageRating > 0;

  return (
    <Link
      to={ROUTES.TUTOR_DETAIL(tutor.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Danh tính: ảnh, tên, xác thực, đánh giá */}
        <div className="flex items-center gap-4">
          <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-base font-bold leading-tight text-text group-hover:text-primary">
              <span className="truncate">{tutor.fullName}</span>
              {isVerified && (
                <BadgeCheck
                  className="size-4 shrink-0 text-info"
                  aria-label={t("common.verified")}
                />
              )}
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <RatingStars value={tutor.averageRating} />
              {hasRating && (
                <span className="text-xs font-semibold tabular-nums text-text">
                  {tutor.averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Môn dạy: xuống dòng gọn, tối đa 3 môn */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleSubjects.map((s) => (
              <SubjectTag key={s.id} name={s.name} />
            ))}
            {hiddenCount > 0 && (
              <span className="rounded-full bg-border/50 px-2 py-0.5 text-xs font-medium text-text-secondary">
                +{hiddenCount}
              </span>
            )}
          </div>
        )}

        {/* Giữ chiều cao 2 dòng để các thẻ trong lưới thẳng hàng */}
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-text-secondary">
          {tutor.bio}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Briefcase className="size-3.5 shrink-0" />
            {tutor.experienceYears} {t("common.experience")}
          </span>
          {tutor.address?.province && (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{tutor.address.province}</span>
            </span>
          )}
        </div>
      </div>

      {/* Chân thẻ: giá là điểm nhấn duy nhất */}
      <div className="flex items-center justify-end border-t border-border bg-primary/5 p-3" >
        {/* <span className="text-lg font-bold tabular-nums text-primary">
          {formatVnd(tutor.hourlyRate)}
          <span className="ml-0.5 text-xs font-normal text-text-secondary">
            {t("common.perHour")}
          </span>
        </span> */}
        <span className="flex items-center gap-0.5 text-sm font-semibold text-primary">
          {t("tutor.viewProfile")}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
