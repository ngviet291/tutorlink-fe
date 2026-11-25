import { AlertTriangle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/components/ui/Badge";
import { CardGridSkeleton } from "@/shared/components/ui/Skeleton";
import { describeWarnings } from "@/features/application/util/matchwarning";
import { useRecommendedPosts } from "../hooks/usePosts";
import { PostCard } from "./PostCard";

/** Chấp nhận cả thang 0..1 lẫn 0..100. */
const toPercent = (score: number) =>
  Math.round(Math.min(Math.max(score <= 1 ? score * 100 : score, 0), 100));

export function RecommendedPosts({ limit = 5 }: { limit?: number }) {
  const { t } = useTranslation();
  const { data, isLoading } = useRecommendedPosts(limit);

  // Lỗi hoặc rỗng thì ẩn luôn: đây chỉ là phần phụ, không chặn trang.
  if (!isLoading && !data?.length) return null;

  return (
    <section aria-labelledby="recommended-heading" className="mt-6">
      <h2
        id="recommended-heading"
        className="mb-3 flex items-center gap-2 text-lg font-extrabold text-text">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        {t("findClass.recommendedTitle", "Gợi ý cho bạn")}
      </h2>

      {isLoading ? (
        <CardGridSkeleton count={limit} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map(({ post, score, warnings }) => {
            const warning = describeWarnings(warnings, post.type);
            return (
              <div key={post.id} className="flex flex-col gap-2">
                <PostCard post={post} />
                <div className="flex items-start justify-between gap-2 px-1 text-xs">
                  <Badge tone="green">
                    {t("findClass.matchScore", "Phù hợp")} {toPercent(score)}%
                  </Badge>
                  {warning && (
                    <span className="flex min-w-0 items-start gap-1 text-text-secondary">
                      <AlertTriangle
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2">{warning}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
