import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SubjectProfilesEditor } from "@/features/tutor/components/SubjectProfilesEditor";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useMyTutorProfile } from "@/features/tutor/hooks/useTutors";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";

function StatusBanner({ tutor }: { tutor: TutorResponse }) {
  const { t } = useTranslation();
  const map = {
    PENDING: {
      Icon: Clock,
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
      title: t("tutorProfile.pendingTitle"),
      body: t("tutorProfile.pendingBody"),
    },
    APPROVED: {
      Icon: CheckCircle2,
      cls: "bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200",
      title: t("tutorProfile.approvedTitle"),
      body: t("tutorProfile.approvedBody"),
    },
    REJECTED: {
      Icon: XCircle,
      cls: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
      title: t("tutorProfile.rejectedTitle"),
      body: t("tutorProfile.rejectedBody"),
    },
  }[tutor.verificationStatus];
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl p-4 ${map.cls}`}
    >
      <map.Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-bold">{map.title}</p>
        <p className="text-sm opacity-90">{map.body}</p>
        {tutor.verificationNote && (
          <p className="mt-2 rounded-lg bg-white/60 p-2 text-sm dark:bg-black/20">
            <strong>{t("tutorProfile.adminNote")}</strong>{" "}
            {tutor.verificationNote}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TutorProfilePage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyTutorProfile();

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={t("tutorProfile.pageTitle")}
        description={t("tutorProfile.pageDescription")}
      />
      <StatusBanner tutor={data} />
      <SubjectProfilesEditor data={data} />
    </div>
  );
}
