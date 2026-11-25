import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
import {
  useApplicationMutations,
  useMyApplicationsForPost,
} from "../hooks/useApplications";
import { track } from "@/features/tracking/hooks";
import { AiTop5Panel } from "./AiTop5Panel";
import { ApplicantRow } from "./ApplicantRow";
import type { ApplicationResponse } from "../types/application.types";
import type { PostResponse } from "@/features/post/types/post.types";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

export function ApplicantList({ post }: { post: PostResponse }) {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    data: mine,
    isLoading,
    isError,
    refetch,
  } = useMyApplicationsForPost(post);
  const data = useMemo(
    () =>
      mine
        ?.filter(
          (a) => a.post.id === post.id && a.applicationStatus !== "CANCELLED",
        )
        .sort((a, b) => +new Date(a.appliedAt) - +new Date(b.appliedAt)),
    [mine, post.id],
  );
  const { select } = useApplicationMutations();
  const [target, setTarget] = useState<ApplicationResponse | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const isOwner = Boolean(user?.id) && post.author?.id === user?.id;

  const hasAccepted =
    data?.some((a) =>
      ["ACCEPTED", "CONFIRMED", "FINISHED"].includes(
        a.applicationStatus,
      ),
    ) ?? false;
  const canSelect = post.status === "PUBLISHED" && !hasAccepted;
  const pending =
    data?.filter((a) => a.applicationStatus === "PENDING").length ?? 0;

  // Track: application_list_opened when data loads successfully
  useEffect(() => {
    if (!isLoading && !isError && data) {
      track("application_list_opened", {
        postId: post.id,
        applicantCount: data.length,
        ranked: Boolean(data.some((a) => a.aiRank !== undefined)),
      });
    }
  }, [isLoading, isError, data, post.id]);

  const applicantName = (a: ApplicationResponse) =>
    post.type === "FIND_TUTOR" ? a.tutor.fullName : a.student.fullName;

  const confirm = () => {
    if (!target) return;
    select.mutate(target.id, {
      onSuccess: () => {
        toast.success(
          t("application.selected", { name: applicantName(target) }),
        );
        setTarget(null);
      },
      onError: (e) => toast.apiError(e),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AiTop5Panel
        postId={post.id}
        canSelect={canSelect}
        onSelect={setTarget}
        pendingCount={pending}
        isOwner={isOwner}
      />

      <section aria-labelledby="all-applicants">
        <h2
          id="all-applicants"
          className="mb-3 text-lg font-extrabold text-text">
          {t("application.allApplicants", { count: data?.length ?? 0 })}
        </h2>
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data && data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {data.map((a) => (
              <ApplicantRow
                key={a.id}
                application={a}
                canSelect={canSelect}
                onSelect={setTarget}
                isOwner={isOwner}
                onExpire={() => void refetch()}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t("application.noApplicants")}
            description={t("application.noApplicantsDesc")}
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={t("application.confirmSelectTitle")}
        confirmText={t("application.selectApplicant")}
        loading={select.isPending}
        onConfirm={confirm}
        description={t("application.confirmSelectDesc", {
          name: target ? applicantName(target) : "",
        })}
      />
    </div>
  );
}
