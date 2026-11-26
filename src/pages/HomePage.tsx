import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Code2,
  FlaskConical,
  Languages,
  Music2,
  Atom,
  Dna,
  ShieldCheck,
  Sparkles,
  Wallet,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/shared/components/ui/Button";
import { CardGridSkeleton } from "@/shared/components/ui/Skeleton";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { PostCard } from "@/features/post/components/PostCard";
import { TutorCard } from "@/features/tutor/components/TutorCard";
import { usePosts } from "@/features/post/hooks/usePosts";
import { useTopTutor } from "@/features/tutor/hooks/useTutors";
import { useSubjects } from "@/features/subject/hooks/useSubjects";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { TOP_TUTOR } from "@/features/tutor/types/tutor.types";
import { HowItWorksSection } from "@/shared/components/ui/HowItWorksSection";

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  "019cef3d-54e0-7e12-85ae-da011bb1fa7d": Calculator,
  "019cef3d-7bf0-7519-9e8f-edb503144692": BookOpen,
  "019cef3d-7038-7158-afd2-4302a0e0fe8c": Languages,
  "019cef3d-58c8-73f5-9c26-747646e8272f": Atom,
  "019cef3d-5cb0-7b92-b114-2b73bc1efde7": FlaskConical,
  "sub-bio": Dna,
  "019cef3d-7808-7483-8158-511aa2f5576d": Code2,
  "019cef3d-7fd8-7881-95f9-bf62461639ef": Music2,
};

function Hero({ role }: { role?: string }) {
  const { t } = useTranslation();
  const isTutor = role === "TUTOR";
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="size-4" /> {t("home.heroBadge")}
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl">
            {t("home.heroTitle1")}{" "}
            <span className="text-primary">{t("home.heroTitle2")}</span>{" "}
            {t("home.heroTitle3")}
          </h1>
          <p className="max-w-xl text-lg text-text-secondary">
            {t("home.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={isTutor ? ROUTES.FIND_CLASS : ROUTES.FIND_TUTOR}>
              <Button size="lg">
                {isTutor ? t("home.findStudentsNow") : t("home.findTutorsNow")}{" "}
                <ArrowRight className="size-5" />
              </Button>
            </Link>
            <Link to={ROUTES.POST_CREATE}>
              <Button size="lg" variant="outline">
                {isTutor ? t("home.postFindStudents") : t("home.postClass")}
              </Button>
            </Link>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 pt-2">
            {[
              { n: t("home.stat1Value"), l: t("home.stat1Label") },
              { n: t("home.stat2Value"), l: t("home.stat2Label") },
              { n: t("home.stat3Value"), l: t("home.stat3Label") },
            ].map(({ n, l }) => (
              <div key={l}>
                <dt className="text-2xl font-extrabold text-primary">{n}</dt>
                <dd className="text-xs text-text-secondary">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          <div className="absolute -left-6 -top-6 size-40 rounded-full bg-secondary/40 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 size-48 rounded-full bg-primary/30 blur-2xl" />
          <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                H
              </span>
              <div>
                <p className="font-bold text-text">{t("home.demoName")}</p>
                <p className="text-xs text-text-secondary">
                  {t("home.demoInfo")}
                </p>
              </div>
              <span className="ml-auto rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success-text">
                {t("home.matchPercent", { percent: 94 })}
              </span>
            </div>
            <div className="mb-4 space-y-2">
              {[
                { l: t("home.barSubject"), v: 100 },
                { l: t("home.barArea"), v: 85 },
                { l: t("home.barSchedule"), v: 90 },
                { l: t("home.barRating"), v: 96 },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div className="mb-1 flex justify-between text-xs text-text-secondary">
                    <span>{l}</span>
                    <span>{v}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-2 rounded-xl bg-primary-light p-3 text-xs text-text-secondary">
              <Brain className="size-4 shrink-0 text-primary" />{" "}
              {t("home.aiNote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  title,
  to,
  sub,
  onMore,
  moreLabel,
}: {
  title: string;
  to?: string;
  sub?: string;
  /** Nút bấm cùng kiểu với link "Xem tất cả" (dùng khi không có trang đích). */
  onMore?: () => void;
  moreLabel?: string;
}) {
  const { t } = useTranslation();
  const moreClass =
    "flex shrink-0 cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline";
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-text">{title}</h2>
        {sub && <p className="mt-1 text-sm text-text-secondary">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className={moreClass}>
          {t("home.viewAll")} <ArrowRight className="size-4" />
        </Link>
      )}
      {onMore && (
        <button type="button" onClick={onMore} className={moreClass}>
          {moreLabel ?? t("home.viewAll")} <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const isTutor = user?.role === "TUTOR";
  // Khách chưa đăng nhập được coi là học viên.
  const isStudent = !user || user.role === "STUDENT";
  const subjects = useSubjects();
  const topTutors = useTopTutor(TOP_TUTOR);
  const posts = usePosts({
    type: isStudent ? "FIND_STUDENT" : "FIND_TUTOR",
    limit: 6,
  });
  const subjectTarget = isTutor ? ROUTES.FIND_CLASS : ROUTES.FIND_TUTOR;
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const subjectList = subjects.data ?? [];
  const visibleSubjects = showAllSubjects
    ? subjectList
    : subjectList.slice(0, 8);

  return (
    <>
      <Hero role={user?.role} />

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-14">
        <section>
          <SectionHead
            title={t("home.subjectsTitle")}
            sub={
              isTutor
                ? t("home.subjectsSubTutor")
                : t("home.subjectsSubStudent")
            }
            onMore={
              subjectList.length > 8
                ? () => setShowAllSubjects((v) => !v)
                : undefined
            }
            moreLabel={showAllSubjects ? t("home.collapse") : t("home.viewAll")}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {visibleSubjects.map((s) => {
              const Icon = SUBJECT_ICONS[s.id] ?? BookOpen;
              return (
                <Link
                  key={s.id}
                  to={`${subjectTarget}?subject=${s.id}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-sm font-bold text-text">{s.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {!isTutor && (
          <section>
            <SectionHead title={t("home.topTutors")} to={ROUTES.FIND_TUTOR} />
            {topTutors.isLoading ? (
              <CardGridSkeleton count={4} />
            ) : topTutors.isError ? (
              <ErrorState onRetry={() => void topTutors.refetch()} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {topTutors.data?.content.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <SectionHead
            title={
              isStudent
                ? t("home.tutorsLookingForStudents")
                : t("home.classesLookingForTutors")
            }
            to={ROUTES.FIND_CLASS}
          />
          {posts.isLoading ? (
            <CardGridSkeleton count={6} />
          ) : posts.isError ? (
            <ErrorState onRetry={() => void posts.refetch()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.data?.pages[0]?.content.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>

        <HowItWorksSection />

        <section>
          <SectionHead title={t("home.whyTitle")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Eye,
                title: t("home.why1Title"),
                desc: t("home.why1Desc"),
              },
              {
                icon: Wallet,
                title: t("home.why2Title"),
                desc: t("home.why2Desc"),
              },
              {
                icon: Brain,
                title: t("home.why3Title"),
                desc: t("home.why3Desc"),
              },
              {
                icon: ShieldCheck,
                title: t("home.why4Title"),
                desc: t("home.why4Desc"),
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <Icon className="mb-3 size-7 text-primary" />
                <h3 className="mb-1 font-bold text-text">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {user?.role !== "TUTOR" && (
          <section className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-white/85">
              {t("home.ctaDesc")}
            </p>
            <Link to={ROUTES.REGISTER} className="mt-6 inline-block">
              <Button size="lg" variant="secondary">
                {t("home.ctaButton")}
              </Button>
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
