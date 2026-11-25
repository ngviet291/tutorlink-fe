import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Clock,
  Info,
  Lock,
  MapPin,
  Pencil,
  Trash2,
  Wallet,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  EDUCATION_LEVEL_LABEL,
  POST_TYPE_LABEL,
  TEACHING_MODE_LABEL,
} from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { MaskedContact } from "@/shared/components/ui/MaskedContact";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { Tooltip } from "@/shared/components/ui/Tooltip";
import { formatBudgetRange } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/errors";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useToast } from "@/shared/hooks/useToast";
import { ApplicantList } from "@/features/application/components/ApplicantList";
import { ApplyModal } from "@/features/application/components/ApplyModal";
import {
  useMyApplicationsForPost,
  useApplicationMutations,
} from "@/features/application/hooks/useApplications";
import {
  usePostDetail,
  usePostMutations,
} from "@/features/post/hooks/usePosts";
import { useMyTutorProfile } from "@/features/tutor/hooks/useTutors";

export default function PostDetailPage() {
  // Gọi useTranslation để trang render lại khi đổi ngôn ngữ (kể cả chữ lỗi bên dưới).
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const [deleting, setDeleting] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isTutor = user?.role === "TUTOR";

  const { remove, publish, close } = usePostMutations();
  const { cancel } = useApplicationMutations();

  const myTutor = useMyTutorProfile(isTutor);

  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
  } = usePostDetail(id, Boolean(user), isAdmin);

  const myApps = useMyApplicationsForPost(post, Boolean(user));

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          message={
            isError && (error as { status?: number } | null)?.status !== 404
              ? getErrorMessage(error)
              : t("postDetail.notFound")
          }
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;

  const myApplication = myApps.data?.find(
    (a) =>
      a.post.id === post.id &&
      (a.tutor.id === user?.id || a.student.id === user?.id),
  );

  const alreadyApplied = Boolean(
    myApplication && myApplication.applicationStatus !== "CANCELLED",
  );

  // Người đủ điều kiện đăng ký:
  // Gia sư APPROVED -> bài FIND_TUTOR
  // Học viên -> bài FIND_STUDENT
  const roleMatches =
    post.type === "FIND_TUTOR"
      ? user?.role === "TUTOR"
      : user?.role === "STUDENT";

  const tutorApproved =
    post.type === "FIND_TUTOR"
      ? myTutor.data?.verificationStatus === "APPROVED"
      : true;

  let disabledReason: string | undefined;

  if (isAuthor) {
    disabledReason = t("postDetail.cannotApplyOwn");
  } else if (alreadyApplied) {
    disabledReason = t("postDetail.alreadyApplied");
  } else if (post.status !== "PUBLISHED") {
    disabledReason = t("postDetail.notAccepting");
  } else if (isTutor && post.type === "FIND_TUTOR" && !tutorApproved) {
    disabledReason = t("postDetail.tutorNotApproved");
  }

  const onApply = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, {
        state: { from: ROUTES.POST_DETAIL(post.id) },
      });
      return;
    }

    setApplyOpen(true);
  };

  const onClosePost = () => {
    close.mutate(post.id, {
      onSuccess: () => {
        setCloseOpen(false);
        toast.success(t("postDetail.closedToast"));
      },
      onError: (e) => toast.apiError(e),
    });
  };

  const onDelete = () => {
    setDeleting(true);

    remove.mutate(post.id, {
      onSuccess: () => {
        toast.success(t("postDetail.deletedToast"));
        navigate(ROUTES.MY_POSTS);
      },
      onError: (e) => {
        setDeleting(false);
        toast.apiError(e);
      },
    });
  };

  const canEdit =
    isAuthor && post.status !== "CLOSED" && post.status !== "REMOVED";

  const info: {
    key: string;
    icon: typeof MapPin;
    label: string;
    value: string;
  }[] = [
    {
      key: "area",
      icon: MapPin,
      label: t("postDetail.area"),
      value: [post.address?.ward, post.address?.province]
        .filter(Boolean)
        .join(", "),
    },
    {
      key: "mode",
      icon: Wifi,
      label: t("postDetail.mode"),
      value: TEACHING_MODE_LABEL[post.teachingMode],
    },
    {
      key: "schedule",
      icon: Clock,
      label: t("postDetail.schedule"),
      value: t("postDetail.scheduleValue", {
        sessions: post.sessionsPerWeek,
        minutes: post.durationMinutes,
      }),
    },
    {
      key: "deadline",
      icon: CalendarDays,
      label: t("postDetail.deadline"),
      value: formatDate(post.deadline),
    },
  ];

  if (deleting) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={post.type === "FIND_TUTOR" ? "orange" : "blue"}>
            {POST_TYPE_LABEL[post.type]}
          </Badge>

          <SubjectTag name={post.subject.name} />

          <Badge tone="gray">
            {EDUCATION_LEVEL_LABEL[post.educationLevel]}
          </Badge>

          <StatusBadge kind="post" status={post.status} />
        </div>

        <h1 className="text-2xl font-extrabold leading-snug text-text sm:text-3xl">
          {post.title}
        </h1>

        <p className="mt-3 text-2xl font-extrabold text-primary">
          {formatBudgetRange(post.minBudget, post.maxBudget)}{" "}
          <span className="text-sm font-medium text-text-secondary">
            {t(`postDetail.budgetUnit.${post.budgetUnit ?? "PER_MONTH"}`)}{" "}
            {t("postDetail.estimated")}
          </span>
        </p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {info.map(({ key, icon: Icon, label, value }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl bg-surface-hover p-3"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <dt className="text-xs text-text-secondary">{label}</dt>

                <dd className="text-sm font-semibold text-text">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <h2 className="mb-2 mt-6 text-lg font-bold text-text">
          {t("postDetail.descriptionTitle")}
        </h2>

        <p className="whitespace-pre-line text-text-secondary">
          {post.content}
        </p>

        <p className="mt-5 flex items-start gap-2 rounded-xl border border-border p-3 text-xs text-text-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          {t("postDetail.feeNotice")}
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between">
          <Link
            to={
              post.author.role === "TUTOR"
                ? ROUTES.TUTOR_DETAIL(post.author.id)
                : ROUTES.STUDENT_DETAIL(post.author.id)
            }
            className="flex items-center gap-3 rounded-xl hover:opacity-80"
          >
            <Avatar
              name={post.author.fullName}
              src={post.author.avatarUrl}
              size="lg"
            />

            <div>
              <p className="text-xs text-text-secondary">
                {t("postDetail.author")}
              </p>

              <p className="font-bold text-text">{post.author.fullName}</p>

              <p className="text-xs text-text-secondary">
                {t("postDetail.applicationCount", {
                  count: post.applicationCount ?? 0,
                })}
              </p>
            </div>
          </Link>

          <MaskedContact className="sm:w-72" contact={post.author.contact} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!isAuthor && !isAdmin && (
            <Tooltip text={disabledReason}>
              <Button
                size="lg"
                onClick={onApply}
                disabled={
                  Boolean(disabledReason) || (Boolean(user) && !roleMatches)
                }
              >
                {t("postDetail.apply")}
              </Button>
            </Tooltip>
          )}

          {/* Hiện lý do ngay trên trang (tooltip không dùng được trên cảm ứng) */}
          {!isAuthor && !isAdmin && disabledReason && (
            <p className="w-full text-sm text-text-secondary">
              {disabledReason}
            </p>
          )}

          {!isAuthor && !isAdmin && user && !roleMatches && !disabledReason && (
            <p className="self-center text-xs text-text-secondary">
              {post.type === "FIND_TUTOR"
                ? t("postDetail.onlyTutorsApply")
                : t("postDetail.onlyStudentsApply")}
            </p>
          )}

          {!user && (
            <p className="self-center text-xs text-text-secondary">
              <Link className="font-semibold text-primary" to={ROUTES.LOGIN}>
                {t("postDetail.login")}
              </Link>{" "}
              {t("postDetail.loginToApply")}
            </p>
          )}

          {!isAuthor &&
            alreadyApplied &&
            myApplication?.applicationStatus === "PENDING" && (
              <Button
                variant="outline"
                size="lg"
                loading={cancel.isPending}
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="size-4" /> {t("postDetail.cancelApply")}
              </Button>
            )}

          {isTutor &&
            post.type === "FIND_TUTOR" &&
            myTutor.data &&
            myTutor.data.verificationStatus !== "APPROVED" && (
              <Link
                to={ROUTES.TUTOR_PROFILE}
                className="self-center text-xs font-semibold text-primary hover:underline"
              >
                <Wallet className="mr-1 inline size-3.5" />
                {t("postDetail.viewTutorStatus")}
              </Link>
            )}
        </div>

        {canEdit && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            {post.status === "DRAFT" && (
              <Button
                loading={publish.isPending}
                onClick={() =>
                  publish.mutate(post.id, {
                    onSuccess: () =>
                      toast.success(t("postDetail.publishedToast")),
                    onError: (e) => toast.apiError(e),
                  })
                }
              >
                {t("postDetail.publish")}
              </Button>
            )}

            {post.status === "PUBLISHED" && (
              <Button variant="outline" onClick={() => setCloseOpen(true)}>
                <Lock className="size-4" /> {t("postDetail.closePost")}
              </Button>
            )}

            <Link to={ROUTES.POST_EDIT(post.id)}>
              <Button variant="outline">
                <Pencil className="size-4" /> {t("postDetail.edit")}
              </Button>
            </Link>

            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> {t("postDetail.delete")}
            </Button>
          </div>
        )}
      </article>

      {isAuthor && post.status !== "DRAFT" && (
        <div className="mt-6">
          <ApplicantList post={post} />
        </div>
      )}

      <ApplyModal
        postId={post.id}
        minBudget={post.minBudget}
        maxBudget={post.maxBudget}
        budgetUnit={post.budgetUnit}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("postDetail.cancelDialog.title")}
        confirmText={t("postDetail.cancelDialog.confirm")}
        cancelText={t("postDetail.cancelDialog.cancel")}
        danger
        loading={cancel.isPending}
        onConfirm={() => {
          if (!myApplication) return;
          cancel.mutate(myApplication.id, {
            onSuccess: () => {
              setCancelOpen(false);
              toast.success(t("postDetail.cancelledToast"));
            },
            onError: (e) => {
              setCancelOpen(false);
              toast.apiError(e);
            },
          });
        }}
        description={t("postDetail.cancelDialog.description")}
      />

      <ConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title={t("postDetail.closeDialog.title")}
        confirmText={t("postDetail.closeDialog.confirm")}
        loading={close.isPending}
        onConfirm={onClosePost}
        description={t("postDetail.closeDialog.description")}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("postDetail.deleteDialog.title")}
        danger
        confirmText={t("postDetail.deleteDialog.confirm")}
        loading={remove.isPending}
        onConfirm={onDelete}
        description={t("postDetail.deleteDialog.description")}
      />
    </div>
  );
}
