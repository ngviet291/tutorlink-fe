import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import {
  useApplicationMutations,
  useApplicationsByPost,
} from "../hooks/useApplications";
import { AiTop5Panel } from "./AiTop5Panel";
import { ApplicantRow } from "./ApplicantRow";
import type { ApplicationResponse } from "../types/application.types";
import type { PostResponse } from "@/features/post/types/post.types";

export function ApplicantList({ post }: { post: PostResponse }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useApplicationsByPost(
    post.id,
    true,
  );
  const { select } = useApplicationMutations();
  const [target, setTarget] = useState<ApplicationResponse | null>(null);

  const hasAccepted =
    data?.some((a) =>
      ["ACCEPTED", "CONFIRMED", "PAID", "FINISHED"].includes(
        a.applicationStatus,
      ),
    ) ?? false;
  const canSelect = post.status === "PUBLISHED" && !hasAccepted;
  const pending =
    data?.filter((a) => a.applicationStatus === "PENDING").length ?? 0;

  const confirm = () => {
    if (!target) return;
    select.mutate(target.id, {
      onSuccess: () => {
        toast.success(
          t("application.selected", { name: target.tutor.fullName }),
        );
        setTarget(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AiTop5Panel
        postId={post.id}
        canSelect={canSelect}
        onSelect={setTarget}
        pendingCount={pending}
      />

      <section aria-labelledby="all-applicants">
        <h2
          id="all-applicants"
          className="mb-3 text-lg font-extrabold text-text"
        >
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
          name: target?.tutor.fullName,
        })}
      />
    </div>
  );
}
