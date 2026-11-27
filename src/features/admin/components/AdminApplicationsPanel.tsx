import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  adminApplicationsService,
  type AdminApplication,
  type ApplicationStatus,
} from "../service/admin.applications.service";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { formatDateTime } from "@/shared/utils/date";
import { formatVnd } from "@/shared/utils/currency";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Modal } from "@/shared/components/ui/Modal";

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
  const [detail, setDetail] = useState<AdminApplication | null>(null);
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
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="mb-3 text-lg font-bold text-text">
        {t("adminApplicationsPanel.title")}
      </h2>
      <div className="sm:max-w-xs">
        <Select
          aria-label={t("adminApplicationsPanel.statusAria")}
          placeholder={t("adminApplicationsPanel.allStatuses")}
          value={status}
          options={states}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")}
        />
      </div>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !rows.length ? (
        <EmptyState title={t("adminApplicationsPanel.empty")} />
      ) : (
        <div className="my-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
              <tr>
                <th className="p-3">{t("adminApplicationsPanel.colId")}</th>
                <th className="p-3">{t("adminApplicationsPanel.colTutor")}</th>
                <th className="p-3">
                  {t("adminApplicationsPanel.colStudent")}
                </th>
                <th className="p-3">
                  {t("adminApplicationsPanel.colAppliedAt")}
                </th>
                <th className="p-3">{t("adminApplicationsPanel.colStatus")}</th>
                <th className="p-3 text-right">
                  {t("adminApplicationsPanel.colFeeEarned")}
                </th>
                <th className="p-3 text-right">
                  {t("adminApplicationsPanel.colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-surface-hover"
                  onClick={() => setDetail(a)}
                >
                  <td className="p-3 font-mono text-xs text-text-secondary">
                    {a.id.slice(0, 8)}
                  </td>
                  <td className="p-3 font-semibold text-text">
                    {a.tutor?.fullName ?? a.tutorId}
                  </td>
                  <td className="p-3">{a.student?.fullName ?? a.studentId}</td>
                  <td className="p-3 text-text-secondary">
                    {formatDateTime(a.appliedAt)}
                  </td>
                  <td className="p-3">
                    {states.find((s) => s.value === a.applicationStatus)
                      ?.label ?? a.applicationStatus}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {a.feeAmount != null ? formatVnd(a.feeAmount) : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetail(a);
                      }}
                    >
                      {t("adminApplicationsPanel.details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t("adminApplicationsPanel.loadMore")}
          </Button>
        </div>
      )}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={t("adminApplicationsPanel.detailTitle")}
        size="sm"
      >
        {detail && (
          <dl className="divide-y divide-border text-sm">
            {(
              [
                [t("adminApplicationsPanel.colId"), detail.id],
                [
                  t("adminApplicationsPanel.colTutor"),
                  detail.tutor?.fullName ?? detail.tutorId,
                ],
                [
                  t("adminApplicationsPanel.colStudent"),
                  detail.student?.fullName ?? detail.studentId,
                ],
                [
                  t("adminApplicationsPanel.colStatus"),
                  states.find((s) => s.value === detail.applicationStatus)
                    ?.label ?? detail.applicationStatus,
                ],
                [
                  t("adminApplicationsPanel.colAppliedAt"),
                  formatDateTime(detail.appliedAt),
                ],
                [
                  t("adminApplicationsPanel.selectedAt"),
                  detail.selectedAt ? formatDateTime(detail.selectedAt) : null,
                ],
                [
                  t("adminApplicationsPanel.proposedFee"),
                  detail.proposedFee != null
                    ? formatVnd(detail.proposedFee)
                    : null,
                ],
                [
                  t("adminApplicationsPanel.colFeeEarned"),
                  detail.feeAmount != null ? formatVnd(detail.feeAmount) : null,
                ],
                [
                  t("adminApplicationsPanel.transaction"),
                  detail.transactionStatus ?? detail.transactionId ?? null,
                ],
                [
                  t("adminApplicationsPanel.paidAt"),
                  detail.paidAt ? formatDateTime(detail.paidAt) : null,
                ],
              ] as [string, string | null][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="text-right font-semibold text-text">{v}</dd>
                </div>
              ))}
            {detail.message && (
              <div className="py-2">
                <dt className="text-text-secondary">
                  {t("adminApplicationsPanel.message")}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-text">
                  {detail.message}
                </dd>
              </div>
            )}
            <div className="pt-3">
              <Link to={ROUTES.POST_DETAIL(detail.postId)}>
                <Button variant="outline" fullWidth>
                  {t("adminApplicationsPanel.viewPost")}
                </Button>
              </Link>
            </div>
          </dl>
        )}
      </Modal>
    </section>
  );
}
