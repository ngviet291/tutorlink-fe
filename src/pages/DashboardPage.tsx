import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Heart,
  Inbox,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
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
import { useTutorProfile } from "@/features/tutor/hooks/useTutors";
import { PayFeeModal } from "@/features/wallet/components/PayFeeModal";
import { useTranslation } from "react-i18next";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";

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
  const profile = useTutorProfile();
  const { confirm, decline, confirmFinish } = useApplicationMutations();

  // Đơn PENDING (chủ bài cần chọn) đã được gộp vào dòng "N ứng viên đang chờ bạn chọn" của bài,
  // nên ở đây chỉ lấy đơn cần tôi trả phí / xác nhận lớp / xác nhận hoàn thành.
  const myApps = (apps.data ?? []).filter(
    (a) =>
      (a.applicationStatus === "ACCEPTED" ||
        a.applicationStatus === "FINISH_REQUESTED") &&
      needsMyAction(a, userId),
  );
  const postsWaiting = (
    posts.data?.pages.flatMap((p) => p.content) ?? []
  ).filter((p) => p.status === "PUBLISHED" && (p.applicationCount ?? 0) > 0);
  const profileRejected = isTutor && profile?.verificationStatus === "REJECTED";
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
        Việc cần xử lý
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
          message="Không tải được danh sách việc cần xử lý. Vui lòng thử lại."
          onRetry={retry}
        />
      ) : total === 0 ? (
        <p className="flex items-center gap-2 py-2 text-sm text-text-secondary">
          <CheckCircle2
            className="size-5 text-success-text"
            aria-hidden="true"
          />
          Bạn đã xử lý hết mọi việc. Khi có việc mới, nó sẽ hiện ở đây.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {profileRejected && (
            <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-primary">
                Hồ sơ gia sư bị từ chối — cập nhật và gửi lại để được duyệt
              </p>
              <Link to={ROUTES.TUTOR_PROFILE}>
                <Button size="sm">Cập nhật hồ sơ</Button>
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
                  Có {p.applicationCount} ứng viên đang chờ bạn chọn
                </p>
              </div>
              <Link to={ROUTES.POST_DETAIL(p.id)}>
                <Button size="sm">Xem ứng viên</Button>
              </Link>
            </li>
          ))}

          {myApps.map((a) => {
            const accepted = a.applicationStatus === "ACCEPTED";
            const canPay = accepted && !a.paid && isFeePayer(a, userId);
            const canConfirm =
              accepted && Boolean(a.paid) && isApplicant(a, userId);
            const finishAsk = a.applicationStatus === "FINISH_REQUESTED";
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
                        Thanh toán phí
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
                              toast.success("Đã từ chối lời mời"),
                            onError: (e) => toast.error(getErrorMessage(e)),
                          })
                        }
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                  {canConfirm && (
                    <Button
                      size="sm"
                      loading={confirm.isPending && confirm.variables === a.id}
                      onClick={() =>
                        confirm.mutate(a.id, {
                          onSuccess: () => toast.success("Đã xác nhận lớp học"),
                          onError: (e) => toast.error(getErrorMessage(e)),
                        })
                      }
                    >
                      Xác nhận lớp học
                    </Button>
                  )}
                  {/* Từ chối hoàn thành dẫn đến tranh chấp nên có hộp thoại xác nhận ở trang Đơn của tôi */}
                  {finishAsk && (
                    <>
                      <Button
                        size="sm"
                        loading={
                          confirmFinish.isPending &&
                          confirmFinish.variables === a.id
                        }
                        onClick={() =>
                          confirmFinish.mutate(a.id, {
                            onSuccess: () =>
                              toast.success(
                                t("myApplications.finishConfirmed"),
                              ),
                            onError: (e) => toast.error(getErrorMessage(e)),
                          })
                        }
                      >
                        {t("myApplications.finishConfirm")}
                      </Button>
                      <Link to={`${ROUTES.MY_APPLICATIONS}?highlight=${a.id}`}>
                        <Button size="sm" variant="ghost">
                          {t("dashboard.viewDetails")}
                        </Button>
                      </Link>
                    </>
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
  const toast = useToast();
  const { finish } = useApplicationMutations();
  const partner = a.post.author.id === myId ? a.tutor : a.post.author;

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
          Kết nối với {partner.fullName}
        </p>
        <NextStepHint application={a} userId={myId} className="mt-1" />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <StatusBadge kind="application" status={a.applicationStatus} />
        <Link to={ROUTES.CHAT_WITH(partner.id)}>
          <Button size="sm" variant="secondary">
            {t("myApplications.openChat")}
          </Button>
        </Link>
        {a.applicationStatus === "CONFIRMED" ? (
          <Button
            size="sm"
            variant="outline"
            loading={finish.isPending && finish.variables === a.id}
            onClick={() =>
              finish.mutate(a.id, {
                onSuccess: () =>
                  toast.success(t("myApplications.finishWaiting")),
                onError: (e) => toast.error(getErrorMessage(e)),
              })
            }
          >
            {t("myApplications.finishClass")}
          </Button>
        ) : (
          <Link to={`${ROUTES.MY_APPLICATIONS}?highlight=${a.id}`}>
            <Button size="sm" variant="outline">
              {t("dashboard.viewDetails")}
            </Button>
          </Link>
        )}
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isTutor = user?.role === "TUTOR";
  const isStudent = user?.role === "STUDENT";
  const posts = useMyPosts();
  const apps = useMyApplications();
  const connections = useConnections();
  const favorites = useFavorites(isStudent);
  const wallet = useWallet(isTutor);
  const profile = useTutorProfile();
  const notifications = useNotifications();
  const [offer, setOffer] = useState<ApplicationResponse | null>(null);

  if (!user) return null;
  if (user?.role === "ADMIN") return <Navigate to={ROUTES.ADMIN} replace />;
  const myPosts = posts.data?.pages.flatMap((p) => p.content) ?? [];
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const recentPosts = myPosts.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={`Xin chào, ${user.fullName}`}
        description={
          isTutor
            ? "Quản lý lớp, đơn ứng tuyển và ví của bạn."
            : "Theo dõi bài đăng, ứng viên và các lớp đã kết nối."
        }
        actions={
          <Link to={ROUTES.POST_CREATE}>
            <Button>
              <Plus className="size-4" />{" "}
              {isTutor ? "Đăng tìm học viên" : "Đăng bài tìm gia sư"}
            </Button>
          </Link>
        }
      />

      {/* 1. Việc cần xử lý — luôn ở đầu trang */}
      <TodoSection userId={user.id} isTutor={isTutor} onPay={setOffer} />

      {isTutor && profile?.verificationStatus === "PENDING" && (
        <Link
          to={ROUTES.TUTOR_PROFILE}
          className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-text hover:opacity-90"
        >
          Hồ sơ gia sư đang chờ duyệt — xem chi tiết →
        </Link>
      )}

      {/* 2. Thống kê */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={FileText}
          label="Bài đăng của tôi"
          value={posts.isError ? "—" : posts.data ? myPosts.length : undefined}
          to={ROUTES.MY_POSTS}
        />
        <Stat
          icon={Users}
          label="Đơn đã ứng tuyển"
          value={apps.isError ? "—" : apps.data ? apps.data.length : undefined}
          to={ROUTES.MY_APPLICATIONS}
        />

        {isTutor ? (
          <Stat
            icon={Wallet}
            label="Số dư ví"
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
            label="Gia sư yêu thích"
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
          label="Thông báo chưa đọc"
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
          <h2 className="text-lg font-extrabold text-text">Bài đăng gần đây</h2>
          <Link
            to={ROUTES.MY_POSTS}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        {posts.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : posts.isError ? (
          <ErrorState
            className="py-8"
            message="Không tải được bài đăng. Vui lòng thử lại."
            onRetry={() => void posts.refetch()}
          />
        ) : recentPosts.length === 0 ? (
          <EmptyState
            className="py-8"
            title="Bạn chưa có bài đăng"
            description="Đăng bài đầu tiên để bắt đầu nhận ứng viên."
            action={
              <Link to={ROUTES.POST_CREATE}>
                <Button size="sm">
                  <Plus className="size-4" />{" "}
                  {isTutor ? "Đăng tìm học viên" : "Đăng bài tìm gia sư"}
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
          {isTutor ? "Lớp đang dạy" : "Lớp đã kết nối"}
        </h2>
        {connections.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : connections.isError ? (
          <ErrorState
            className="py-8"
            message="Không tải được danh sách lớp. Vui lòng thử lại."
            onRetry={() => void connections.refetch()}
          />
        ) : !connections.data?.length ? (
          <EmptyState
            className="py-8"
            title="Chưa có lớp nào được kết nối"
            description="Lớp sẽ xuất hiện ở đây sau khi gia sư thanh toán phí nhận lớp."
            action={
              <Link to={isTutor ? ROUTES.FIND_CLASS : ROUTES.FIND_TUTOR}>
                <Button size="sm">
                  {isTutor ? "Tìm lớp ngay" : "Tìm gia sư"}
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
