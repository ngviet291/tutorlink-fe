import { Link, useParams } from "react-router-dom";
import { GraduationCap, MapPin, Target } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { CardGridSkeleton, Skeleton } from "@/shared/components/ui/Skeleton";
import { PostCard } from "@/features/post/components/PostCard";
import { usePosts } from "@/features/post/hooks/usePosts";
import { useStudentProfile } from "@/features/student/hooks/useStudent";

export default function StudentDetailPage() {
  const { id } = useParams();
  const { data: student, isLoading, isError, refetch } = useStudentProfile(id);
  // Bài đăng công khai của học viên (BE: GET /v1/posts?authorId=)
  const posts = usePosts({ authorId: id, limit: 6 });
  const items = posts.data?.pages.flatMap((p) => p.content) ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !student) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          message="Không tìm thấy hồ sơ học viên."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const area = [student.address?.ward, student.address?.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={student.fullName} src={student.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">
            {student.fullName}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
            {student.grade && (
              <li className="flex items-center gap-1.5">
                <GraduationCap className="size-4" /> {student.grade}
              </li>
            )}
            {area && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {area}
              </li>
            )}
          </ul>
          {student.learningGoal && (
            <p className="mt-3 flex items-start gap-2 text-sm text-text">
              <Target className="mt-0.5 size-4 shrink-0 text-primary" />
              {student.learningGoal}
            </p>
          )}
        </div>
      </section>

      <h2 className="mb-3 mt-8 text-lg font-bold text-text">Bài đăng</h2>
      {posts.isLoading ? (
        <CardGridSkeleton count={2} />
      ) : posts.isError ? (
        <ErrorState onRetry={() => void posts.refetch()} />
      ) : items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {posts.hasNextPage && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                loading={posts.isFetchingNextPage}
                onClick={() => void posts.fetchNextPage()}>
                Xem thêm
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Chưa có bài đăng công khai"
          action={
            <Link to={ROUTES.FIND_CLASS}>
              <Button variant="outline">Xem các lớp khác</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
