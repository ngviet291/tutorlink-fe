import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
  Inbox,
  Plus,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatVnd } from "@/shared/utils/currency";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { NextStepHint } from "@/features/application/components/NextStepHint";
import {
  useApplicationMutations,
  useConnections,
  useMyApplications,
} from "@/features/application/hooks/useApplications";
import { isFeePayer, isApplicant } from "@/features/application/util/applicant";
import { needsMyAction } from "@/features/application/util/nextStep";
import type { ApplicationResponse } from "@/features/application/types/application.types";
import { useFavorites } from "@/features/favorite/hooks/useFavorites";
import { useMyPosts } from "@/features/post/hooks/usePosts";
import { ReviewForm } from "@/features/review/components/ReviewForm";
import { useHasReviewed } from "@/features/review/hooks/useReviews";
import { useMyTutorProfile } from "@/features/tutor/hooks/useTutors";
import { PayFeeModal } from "@/features/wallet/components/PayFeeModal";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { useToast } from "@/shared/hooks/useToast";

function Stat({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof Users;
  label: string;
  value: string | number | undefined;
  to?: string;
}) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-1 h-6 w-12" />
        ) : (
          <p className="text-xl font-extrabold text-text">{value}</p>
        )}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function TodoSection({
  userId,
  isTutor,
  onPay,
}: {
  userId: string;
  isTutor: boolean;
  onPay: (a: ApplicationResponse) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const apps = useMyApplications();
  const posts = useMyPosts();
  const profile = useMyTutorProfile(isTutor);
  const { confirm, decline } = useApplicationMutations();

  // Đơn PENDING (chủ bài cần chọn) đã được gộp vào dòng "N ứng viên đang chờ bạn chọn" của bài,
  // nên ở đây chỉ lấy đơn ACCEPTED (cần trả phí / xác nhận) để không bị lặp và không hiện nút sai.
  const myApps = (apps.data ?? []).filter(
    (a) => a.applicationStatus === "ACCEPTED" && needsMyAction(a, userId),
  );
  const postsWaiting = (
    posts.data?.pages.flatMap((p) => p.content) ?? []
  ).filter((p) => p.status === "PUBLISHED" && (p.applicationCount ?? 0) > 0);
  const profileRejected =
    isTutor && profile.data?.verificationStatus === "REJECTED";
  const total = myApps.length + postsWaiting.length + (profileRejected ? 1 : 0);

  const isLoading = apps.isLoading || posts.isLoading;
  const isError = apps.isError || posts.isError;
  const retry = () => {
    if (apps.isError) void apps.refetch();
    if (posts.isError) void posts.refetch();
  };

  return (
    <section
      aria-labelledby="todo-heading"
      className="rounded-2xl border-2 border-primary/40 bg-primary-light/60 p-4 sm:p-5"
    >
      <h2
        id="todo-heading"
        className="mb-3 flex items-center gap-2 text-lg font-extrabold text-text"
      >
        <ClipboardList className="size-5 text-primary" aria-hidden="true" />
        {t("dashboard.todoTitle")}
        {total > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
            {total}
          </span>
        )}
      </h2>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : isError ? (
        <ErrorState
          className="py-6"
          message={t("dashboard.todoLoadError")}
          onRetry={retry}
        />
      ) : total === 0 ? (
        <p className="flex items-center gap-2 py-2 text-sm text-text-secondary">
          <CheckCircle2
            className="size-5 text-success-text"
            aria-hidden="true"
          />
          {t("dashboard.todoEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {profileRejected && (
            <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-primary">
                {t("dashboard.todoProfileRejected")}
              </p>
              <Link to={ROUTES.TUTOR_PROFILE}>
                <Button size="sm">{t("dashboard.updateProfile")}</Button>
              </Link>
            </li>
          )}

          {postsWaiting.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{p.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Users className="size-4 shrink-0" aria-hidden="true" />
                  {t("dashboard.waitingApplicants", {
                    count: p.applicationCount,
                  })}
                </p>
              </div>
              <Link to={ROUTES.POST_DETAIL(p.id)}>
                <Button size="sm">{t("dashboard.viewApplicants")}</Button>
              </Link>
            </li>
          ))}

          {myApps.map((a) => {
            const accepted = a.applicationStatus === "ACCEPTED";
            const canPay = accepted && !a.paid && isFeePayer(a, userId);
            const canConfirm =
              accepted && Boolean(a.paid) && isApplicant(a, userId);
            return (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={ROUTES.POST_DETAIL(a.post.id)}
                    className="block truncate font-semibold text-text hover:text-primary"
                  >
                    {a.post.title}
                  </Link>
                  <NextStepHint
                    application={a}
                    userId={userId}
                    className="mt-1"
                  />
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canPay && (
                    <>
                      <Button size="sm" onClick={() => onPay(a)}>
                        {t("dashboard.payFee")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={
                          decline.isPending && decline.variables === a.id
                        }
                        onClick={() =>
                          decline.mutate(a.id, {
                            onSuccess: () =>
                              toast.success(t("dashboard.declined")),
                            onError: (e) => toast.apiError(e),
                          })
                        }
                      >
                        {t("dashboard.decline")}
                      </Button>
                    </>
                  )}
                  {canConfirm && (
                    <Button
                      size="sm"
                      loading={confirm.isPending && confirm.variables === a.id}
                      onClick={() =>
                        confirm.mutate(a.id, {
                          onSuccess: () =>
                            toast.success(t("dashboard.classConfirmed")),
                          onError: (e) => toast.apiError(e),
                        })
                      }
                    >
                      {t("dashboard.confirmClass")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ConnectedRow({ a, myId }: { a: ApplicationResponse; myId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const iAmStudent =
    (a.post.type === "FIND_TUTOR" ? a.post.author.id : a.tutor.id) === myId;
  const partner = a.post.author.id === myId ? a.tutor : a.post.author;
  const tutorName =
    a.post.type === "FIND_TUTOR" ? a.tutor.fullName : a.post.author.fullName;
  const reviewed = useHasReviewed(a.id);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          to={ROUTES.POST_DETAIL(a.post.id)}
          className="block truncate font-bold text-text hover:text-primary"
        >
          {a.post.title}
        </Link>
        <p className="text-xs text-text-secondary">
          {t("dashboard.connectedWith", { name: partner.fullName })}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link to={ROUTES.CHAT_WITH(partner.id)}>
          <Button size="sm" variant="secondary">
            {t("dashboard.openChat")}
          </Button>
        </Link>
        {iAmStudent && !reviewed.data && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Star className="size-4" /> {t("dashboard.endAndReview")}
          </Button>
        )}
        {iAmStudent && reviewed.data && (
          <Badge tone="green">{t("dashboard.reviewed")}</Badge>
        )}
      </div>
      {iAmStudent && (
        <ReviewForm
          applicationId={a.id}
          tutorName={tutorName}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </li>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const isTutor = user?.role === "TUTOR";
  const isStudent = user?.role === "STUDENT";
  const posts = useMyPosts();
  const apps = useMyApplications();
  const connections = useConnections();
  const favorites = useFavorites(isStudent);
  const wallet = useWallet(isTutor);
  const profile = useMyTutorProfile(isTutor);
  const notifications = useNotifications();
  const [offer, setOffer] = useState<ApplicationResponse | null>(null);

  if (!user) return null;
  if (user?.role === "ADMIN") return <Navigate to={ROUTES.ADMIN} replace />;
  const myPosts = posts.data?.pages.flatMap((p) => p.content) ?? [];
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const recentPosts = myPosts.slice(0, 4);
  const createPostLabel = isTutor
    ? t("dashboard.createPostTutor")
    : t("dashboard.createPostStudent");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={t("dashboard.greeting", { name: user.fullName })}
        description={
          isTutor
            ? t("dashboard.subtitleTutor")
            : t("dashboard.subtitleStudent")
        }
        actions={
          <Link to={ROUTES.POST_CREATE}>
            <Button>
              <Plus className="size-4" /> {createPostLabel}
            </Button>
          </Link>
        }
      />

      {/* 1. Việc cần xử lý — luôn ở đầu trang */}
      <TodoSection userId={user.id} isTutor={isTutor} onPay={setOffer} />

      {isTutor && profile.data?.verificationStatus === "PENDING" && (
        <Link
          to={ROUTES.TUTOR_PROFILE}
          className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-text hover:opacity-90"
        >
          {t("dashboard.profilePendingLink")}
        </Link>
      )}

      {/* 2. Thống kê */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={FileText}
          label={t("dashboard.statMyPosts")}
          value={posts.isError ? "—" : posts.data ? myPosts.length : undefined}
          to={ROUTES.MY_POSTS}
        />
        <Stat
          icon={Users}
          label={t("dashboard.statApplied")}
          value={apps.isError ? "—" : apps.data ? apps.data.length : undefined}
          to={ROUTES.MY_APPLICATIONS}
        />

        {isTutor ? (
          <Stat
            icon={Wallet}
            label={t("dashboard.statBalance")}
            value={
              wallet.isError
                ? "—"
                : wallet.data
                  ? formatVnd(wallet.data.balance)
                  : undefined
            }
            to={ROUTES.WALLET}
          />
        ) : (
          <Stat
            icon={Heart}
            label={t("dashboard.statFavorites")}
            value={
              isStudent
                ? favorites.isError
                  ? "—"
                  : favorites.data
                    ? favorites.data.length
                    : undefined
                : 0
            }
            to={ROUTES.FAVORITES}
          />
        )}
        <Stat
          icon={Inbox}
          label={t("dashboard.statUnread")}
          value={
            notifications.isError
              ? "—"
              : notifications.data
                ? unread
                : undefined
          }
          to={ROUTES.NOTIFICATIONS}
        />
      </div>

      {/* 3. Hoạt động gần đây */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text">
            {t("dashboard.recentPosts")}
          </h2>
          <Link
            to={ROUTES.MY_POSTS}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("common.viewAll")}
          </Link>
        </div>
        {posts.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : posts.isError ? (
          <ErrorState
            className="py-8"
            message={t("dashboard.postsLoadError")}
            onRetry={() => void posts.refetch()}
          />
        ) : recentPosts.length === 0 ? (
          <EmptyState
            className="py-8"
            title={t("dashboard.noPostsTitle")}
            description={t("dashboard.noPostsDesc")}
            action={
              <Link to={ROUTES.POST_CREATE}>
                <Button size="sm">
                  <Plus className="size-4" /> {createPostLabel}
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link
                  to={ROUTES.POST_DETAIL(p.id)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 hover:shadow-md"
                >
                  <span className="min-w-0 truncate font-semibold text-text">
                    {p.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-text-secondary">
                    <Users className="size-3.5" aria-hidden="true" />{" "}
                    {p.applicationCount ?? 0}
                    <StatusBadge kind="post" status={p.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-text">
          <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />{" "}
          {isTutor
            ? t("dashboard.classesTutor")
            : t("dashboard.classesStudent")}
        </h2>
        {connections.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : connections.isError ? (
          <ErrorState
            className="py-8"
            message={t("dashboard.classesLoadError")}
            onRetry={() => void connections.refetch()}
          />
        ) : !connections.data?.length ? (
          <EmptyState
            className="py-8"
            title={t("dashboard.noClassesTitle")}
            description={t("dashboard.noClassesDesc")}
            action={
              <Link to={isTutor ? ROUTES.FIND_CLASS : ROUTES.FIND_TUTOR}>
                <Button size="sm">
                  {isTutor
                    ? t("dashboard.findClassNow")
                    : t("dashboard.findTutorNow")}
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {connections.data.map((a) => (
              <ConnectedRow key={a.id} a={a} myId={user.id} />
            ))}
          </ul>
        )}
      </section>

      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  );
}
