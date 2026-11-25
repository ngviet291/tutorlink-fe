import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  adminApplicationsService,
  type ApplicationStatus,
} from "../service/admin.applications.service";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { formatDateTime } from "@/shared/utils/date";
import { formatVnd } from "@/shared/utils/currency";

// Chỉ giữ giá trị; nhãn được dịch lúc render để đổi VI/EN có hiệu lực ngay.
const STATUS_VALUES: ApplicationStatus[] = [
  "PENDING",
  "ACCEPTED",
  "CONFIRMED",
  "FINISHED",
  "CANCELLED",
  "REJECTED",
];

export function AdminApplicationsPanel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const states = STATUS_VALUES.map((value) => ({
    value,
    label: t(`adminApplicationsPanel.status.${value}`),
  }));
  const query = useInfiniteQuery({
    queryKey: ["admin", "applications", status],
    queryFn: ({ pageParam }) =>
      adminApplicationsService.getApplications({
        status: status || undefined,
        cursor: pageParam,
        limit: 10,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasNext ? p.nextCursor : undefined),
  });
  const rows = query.data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-lg font-bold">
        {t("adminApplicationsPanel.title")}
      </h2>
      <Select
        aria-label={t("adminApplicationsPanel.statusAria")}
        placeholder={t("adminApplicationsPanel.allStatuses")}
        value={status}
        options={states}
        onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")}
      />
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !rows.length ? (
        <EmptyState title={t("adminApplicationsPanel.empty")} />
      ) : (
        <div className="my-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>{t("adminApplicationsPanel.colId")}</th>
                <th>{t("adminApplicationsPanel.colTutor")}</th>
                <th>{t("adminApplicationsPanel.colStudent")}</th>
                <th>{t("adminApplicationsPanel.colAppliedAt")}</th>
                <th>{t("adminApplicationsPanel.colStatus")}</th>
                <th>{t("adminApplicationsPanel.colProposedFee")}</th>
                <th>{t("adminApplicationsPanel.colFeeTransaction")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-3">{a.id.slice(0, 8)}</td>
                  <td>{a.tutor?.fullName ?? a.tutorId}</td>
                  <td>{a.student?.fullName ?? a.studentId}</td>
                  <td>{formatDateTime(a.appliedAt)}</td>
                  <td>
                    {states.find((s) => s.value === a.applicationStatus)
                      ?.label ?? a.applicationStatus}
                  </td>
                  <td>
                    {a.proposedFee != null ? formatVnd(a.proposedFee) : "—"}
                  </td>
                  <td>{a.transactionStatus ?? a.transactionId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.hasNextPage && (
        <Button
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t("adminApplicationsPanel.loadMore")}
        </Button>
      )}
    </section>
  );
}
