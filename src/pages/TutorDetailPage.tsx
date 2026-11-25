import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Award,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
} from "lucide-react";
import {
  DAY_LABEL,
  EDUCATION_LEVEL_LABEL,
  TEACHING_MODE_LABEL,
} from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { MaskedContact } from "@/shared/components/ui/MaskedContact";
import { RatingStars } from "@/shared/components/ui/RatingStars";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { SubjectTag } from "@/shared/components/ui/SubjectTag";
import { Tabs } from "@/shared/components/ui/Tabs";
import { formatVnd } from "@/shared/utils/currency";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useToast } from "@/shared/hooks/useToast";
import { ReviewList } from "@/features/review/components/ReviewList";
import { useTutor } from "@/features/tutor/hooks/useTutors";
import { PostCard } from "@/features/post/components/PostCard";
import { usePosts } from "@/features/post/hooks/usePosts";
import {
  useFavoriteIds,
  useToggleFavorite,
} from "@/features/favorite/hooks/useFavorites";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { useTutorProfileTracking, track } from "@/features/tracking/hooks";

type Tab = "about" | "certs" | "reviews" | "schedule" | "posts";

export default function TutorDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const { data: tutor, isLoading, isError, refetch } = useTutor(id);
  const [tab, setTab] = useState<Tab>("about");
  const canFavorite = user?.role === "STUDENT";
  const favorites = useFavoriteIds(canFavorite);
  const toggle = useToggleFavorite("profile");
  // Bài đăng công khai của gia sư (BE: GET /v1/posts?authorId=)
  const tutorPosts = usePosts({ authorId: id, limit: 6 });
  const postItems = tutorPosts.data?.pages.flatMap((p) => p.content) ?? [];
  const isFav = Boolean(id && favorites.data?.includes(id));

  const { state: navState } = useLocation();
  const origin = navState as {
    section?: "TOP" | "OTHERS";
    rank?: number;
  } | null;
  useTutorProfileTracking(tutor?.id, origin ?? undefined);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !tutor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          message={t("tutorDetail.notFound")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }
  const tutorSubjects = tutor.subjects ?? [];
  const onContact = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, {
        state: { from: ROUTES.TUTOR_DETAIL(tutor.id) },
      });
      return;
    }
    toast.info(t("tutorDetail.contactHint"));
  };

  const onFavorite = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, {
        state: { from: ROUTES.TUTOR_DETAIL(tutor.id) },
      });
      return;
    }
    if (!canFavorite) {
      toast.info(t("tutorDetail.studentOnlyFavorite"));
      return;
    }
    toggle.mutate(tutor.id, {
      onSuccess: (r) => {
        toast.success(
          r.favorited
            ? t("tutorDetail.favoriteAdded")
            : t("tutorDetail.favoriteRemoved"),
        );
        // Track: tutor favorited
        track("tutor_favorited", {
          tutorId: tutor.id,
          source: "profile",
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-10">
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={tutor.fullName} src={tutor.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-text sm:text-3xl">
            {tutor.fullName}
            {tutor.verificationStatus === "APPROVED" ? (
              <Badge tone="blue" icon={<BadgeCheck className="size-3.5" />}>
                {t("tutorDetail.verified")}
              </Badge>
            ) : (
              <StatusBadge
                kind="verification"
                status={tutor.verificationStatus}
              />
            )}
          </h1>
          <div className="mt-2">
            <RatingStars
              value={tutor.averageRating}
              size="md"
              count={tutor.reviewCount}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tutorSubjects.map((s) => (
              <SubjectTag key={s.id} name={s.name} />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
            <li className="flex items-center gap-1.5">
              <Briefcase className="size-4" />{" "}
              {t("tutorDetail.experienceYears", {
                years: tutor.experienceYears,
              })}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4" />{" "}
              {[tutor.address?.province].filter(Boolean).join(", ")}
            </li>
            {tutor.teachingMode && (
              <li>{TEACHING_MODE_LABEL[tutor.teachingMode]}</li>
            )}
          </ul>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-extrabold text-primary">
            {formatVnd(tutor.hourlyRate)}
          </p>
          <p className="text-xs text-text-secondary">
            {t("tutorDetail.perHour")}
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "about", label: t("tutorDetail.tabs.about") },
              { value: "certs", label: t("tutorDetail.tabs.certs") },
              {
                value: "reviews",
                label: `${t("tutorDetail.tabs.reviews")}${tutor.reviewCount ? ` (${tutor.reviewCount})` : ""}`,
              },
              { value: "schedule", label: t("tutorDetail.tabs.schedule") },
              {
                value: "posts",
                label: `${t("tutorDetail.tabs.posts")}${postItems.length ? ` (${postItems.length}${tutorPosts.hasNextPage ? "+" : ""})` : ""}`,
              },
            ]}
          />
          <div className="mt-4">
            {tab === "about" && (
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
                <p className="whitespace-pre-line text-text">
                  {tutor.bio || t("tutorDetail.noBio")}
                </p>
                {tutor.education && (
                  <p className="flex items-start gap-2 text-sm text-text-secondary">
                    <GraduationCap className="mt-0.5 size-4 shrink-0" />{" "}
                    {tutor.education}
                  </p>
                )}
                {tutor.educationLevels && (
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.educationLevels.map((l) => (
                      <Badge key={l} tone="gray">
                        {EDUCATION_LEVEL_LABEL[l]}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === "certs" &&
              (tutor.certificates?.length ? (
                <ul className="flex flex-col gap-3">
                  {tutor.certificates.map((c, i) => (
                    <li
                      key={`${c.name}-${i}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
                    >
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-light text-primary">
                        <Award className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-text">{c.name}</p>
                        <p className="text-xs text-text-secondary">
                          {c.issuer} · {c.year}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("tutorDetail.noCertificates")} />
              ))}
            {tab === "reviews" && <ReviewList tutorId={tutor.id} />}
            {tab === "posts" &&
              (tutorPosts.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : tutorPosts.isError ? (
                <ErrorState onRetry={() => void tutorPosts.refetch()} />
              ) : postItems.length ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {postItems.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                  {tutorPosts.hasNextPage && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        loading={tutorPosts.isFetchingNextPage}
                        onClick={() => void tutorPosts.fetchNextPage()}
                      >
                        {t("tutorDetail.loadMore")}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title={t("tutorDetail.noPublicPosts")} />
              ))}
            {tab === "schedule" &&
              (tutor.schedule?.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tutor.schedule.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
                    >
                      <span className="font-semibold text-text">
                        {DAY_LABEL[s.day]}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {s.from} – {s.to}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("tutorDetail.noSchedule")} />
              ))}
          </div>
        </div>

        <aside className="hidden flex-col gap-3 lg:flex">
          <div className="sticky top-20 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
            <MaskedContact />
            <Button fullWidth onClick={onContact}>
              <MessageCircle className="size-4" />{" "}
              {t("tutorDetail.contactTutor")}
            </Button>
            <Button
              fullWidth
              variant={isFav ? "secondary" : "outline"}
              onClick={onFavorite}
              loading={toggle.isPending}
            >
              <Heart className={isFav ? "size-4 fill-current" : "size-4"} />{" "}
              {isFav
                ? t("tutorDetail.favorited")
                : t("tutorDetail.addFavorite")}
            </Button>
            {!user && (
              <p className="text-xs text-text-secondary">
                <Link className="font-semibold text-primary" to={ROUTES.LOGIN}>
                  {t("tutorDetail.login")}
                </Link>{" "}
                {t("tutorDetail.loginToContact")}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-surface p-3 lg:hidden">
        <Button className="flex-1" onClick={onContact}>
          <MessageCircle className="size-4" /> {t("tutorDetail.contact")}
        </Button>
        <Button
          variant={isFav ? "secondary" : "outline"}
          onClick={onFavorite}
          aria-label={t("tutorDetail.favoriteAria")}
        >
          <Heart className={isFav ? "size-4 fill-current" : "size-4"} />
        </Button>
      </div>
    </div>
  );
}
