import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Ban, CalendarDays, Clock, MapPin, Users, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants/routes";
import {
  BUDGET_UNIT_LABEL,
  EDUCATION_LEVEL_LABEL,
  POST_TYPE_LABEL,
  TEACHING_MODE_LABEL,
} from "@/constants/enums";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { formatBudgetRange } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { PostResponse } from "../types/post.types";

interface PostCardProps {
  post: PostResponse;
  mine?: boolean;
  compact?: boolean;
  /** Có truyền thì số lượt đăng ký bấm được (dùng ở trang admin). */
  onViewApplications?: () => void;
  /** Có truyền thì hiện nút Gỡ bài (dùng ở trang admin). */
  onRemove?: () => void;
}

// Card là <Link>, nên bấm nút bên trong không được chuyển trang
const handleClick = (action: () => void) => (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  action();
};

export function PostCard({
  post,
  mine = false,
  compact = false,
  onViewApplications,
  onRemove,
}: PostCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={ROUTES.POST_DETAIL(post.id)}
      state={mine}
      className={`group flex h-full flex-col rounded-2xl border border-border bg-surface transition-shadow hover:shadow-md ${compact ? "gap-2 p-3" : "gap-3 p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={post.type === "FIND_TUTOR" ? "orange" : "blue"}>
            {POST_TYPE_LABEL[post.type]}
          </Badge>
          <SubjectTag name={post.subject.name} />
        </div>
        <StatusBadge kind="post" status={post.status} />
      </div>

      <h3 className={`${compact ? "text-sm" : "text-base"} line-clamp-2 font-bold text-text group-hover:text-primary`}>
        {post.title}
      </h3>
      <p className={`${compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"} text-text-secondary`}>{post.content}</p>

      <dl className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-text-secondary">
        <div className={`col-span-2 font-bold text-primary ${compact ? "text-xs" : "text-sm"}`}>
          {formatBudgetRange(
            post.minBudget ?? undefined,
            post.maxBudget ?? undefined,
          )}
          <span className="font-normal text-text-secondary">
            {" "}
            {post.budgetUnit
              ? BUDGET_UNIT_LABEL[post.budgetUnit]
              : t("post.budgetUnitNotSpecified")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {[post.address?.ward, post.address?.province]
              .filter(Boolean)
              .join(", ") || t("common.notSpecified")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Wifi className="size-3.5 shrink-0" />
          {TEACHING_MODE_LABEL[post.teachingMode]}
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {post.sessionsPerWeek} {t("post.sessionsPerWeek")} ·{" "}
          {post.durationMinutes}'
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          {t("post.deadline")} {formatDate(post.deadline)}
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar
            name={post.author.fullName}
            src={post.author.avatarUrl}
            size="sm"
          />
          <span className="truncate text-xs font-medium text-text">
            {post.author.fullName}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2 text-xs text-text-secondary">
          <Badge tone="gray">
            {EDUCATION_LEVEL_LABEL[post.educationLevel]}
          </Badge>

          {post.applicationCount !== undefined &&
            (onViewApplications ? (
              <button
                type="button"
                title={t("post.viewApplications")}
                onClick={handleClick(onViewApplications)}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-primary/10 hover:text-primary"
              >
                <Users className="size-3.5" /> {post.applicationCount}
              </button>
            ) : (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {post.applicationCount}
              </span>
            ))}

          {onRemove && (
            <button
              type="button"
              title={t("post.remove")}
              aria-label={t("post.remove")}
              onClick={handleClick(onRemove)}
              className="flex size-10 items-center justify-center rounded-md text-danger-text hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <Ban className="size-4" />
            </button>
          )}
        </span>
      </div>
    </Link>
  );
}
