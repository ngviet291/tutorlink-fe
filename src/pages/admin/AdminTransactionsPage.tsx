import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TRANSACTION_STATUS_META,
  TRANSACTION_TYPE_LABEL,
} from "@/constants/enums";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { Select } from "@/shared/components/ui/Select";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatVnd } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import { Button } from "@/shared/components/ui/Button";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminPaymentMutations,
  useAdminTransactions,
  useRevenueStatistics,
  useAdminTransaction,
} from "@/features/admin/hooks/useAdminPayments";
import type { TransactionStatus } from "@/shared/types/common.types";

export default function AdminTransactionsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminTransactions({ status });
  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const [detailId, setDetailId] = useState<string>();
  const detailQuery = useAdminTransaction(detailId);
  const detail = detailQuery.data;

  // Mặc định: 30 ngày gần nhất
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      from: thirtyDaysAgo.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    };
  };

  const defaultDates = getDefaultDates();
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const toast = useToast();
  const revenue = useRevenueStatistics({
    from: from || undefined,
    to: to || undefined,
  });
  const { refundTransaction } = useAdminPaymentMutations();
  const rangeInvalid =
    Boolean(from) !== Boolean(to) || Boolean(from && to && from > to);
  const refund = () => {
    if (!detail) {
      return;
    }
    refundTransaction.mutate(detail.id, {
      onSuccess: () => {
        toast.success(t("adminTransactions.refundDone"));
      },
      onError: (e) => toast.apiError(e),
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title={t("adminTransactions.title")} />
      <section
        aria-label={t("adminTransactions.revenueTitle")}
        className="rounded-2xl border border-border bg-surface p-4"
      >
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-base font-bold text-text">
            {t("adminTransactions.revenueTitle")}
          </h2>
          <Input
            aria-label={t("adminTransactions.fromDate")}
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            aria-label={t("adminTransactions.toDate")}
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {rangeInvalid ? (
          <p role="alert" className="text-sm text-danger-text">
            {t("adminTransactions.rangeInvalid")}
          </p>
        ) : !from || !to ? (
          <p className="text-sm text-text-secondary">
            {t("adminTransactions.pickRange")}
          </p>
        ) : revenue.isError ? (
          <ErrorState onRetry={() => void revenue.refetch()} />
        ) : revenue.isLoading ? (
          <ListSkeleton rows={1} />
        ) : (
          revenue.data && (
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                [
                  t("adminTransactions.netRevenue"),
                  formatVnd(revenue.data.totalRevenue),
                ],
                [
                  t("adminTransactions.refunded"),
                  formatVnd(revenue.data.totalRefunded),
                ],
                [
                  t("adminTransactions.totalTopUp"),
                  formatVnd(revenue.data.totalTopUp),
                ],
                [
                  t("adminTransactions.feeSuccessCount"),
                  revenue.data.successCount,
                ],
                [
                  t("adminTransactions.topUpSuccessCount"),
                  revenue.data.topUpCount,
                ],
                [
                  t("adminTransactions.failedRefunded"),
                  `${revenue.data.failedCount} / ${revenue.data.refundedCount}`,
                ],
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  className="rounded-xl bg-surface-hover p-3"
                >
                  <dt className="text-xs text-text-secondary">{k}</dt>
                  <dd className="mt-0.5 text-lg font-extrabold text-text">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          )
        )}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          aria-label={t("adminTransactions.status")}
          placeholder={t("adminTransactions.allStatuses")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TransactionStatus | "");
          }}
          options={(
            Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]
          ).map((s) => ({ value: s, label: TRANSACTION_STATUS_META[s].label }))}
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title={t("adminTransactions.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">{t("adminTransactions.colTime")}</th>
                  <th>{t("adminTransactions.colId")}</th>
                  <th>{t("adminTransactions.colType")}</th>
                  <th className="pr-4 text-right">
                    {t("adminTransactions.colAmount")}
                  </th>
                  <th className="pr-3">{t("adminTransactions.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((tx) => (
                  <tr
                    key={tx.id}
                    className="cursor-pointer hover:bg-surface-hover"
                    onClick={() => setDetailId(tx.id)}
                  >
                    <td className="p-3 text-text-secondary">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="font-medium text-text">{tx.id ?? "—"}</td>
                    <td>
                      {TRANSACTION_TYPE_LABEL[
                        tx.transactionType as keyof typeof TRANSACTION_TYPE_LABEL
                      ] ?? tx.transactionType}
                    </td>
                    <td
                      className={`pr-4 text-right font-semibold ${
                        tx.transactionType === "TOP_UP"
                          ? "text-success-text"
                          : tx.transactionType === "WITHDRAW"
                            ? "text-danger-text"
                            : ""
                      }`}
                    >
                      {formatVnd(tx.amount)}
                    </td>
                    <td className="pr-3">
                      <StatusBadge
                        kind="transaction"
                        status={tx.transactionStatus}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && (
            <Button
              loading={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {t("adminTransactions.loadMore")}
            </Button>
          )}
        </>
      )}

      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(undefined)}
        title={t("adminTransactions.detailTitle")}
        size="sm"
      >
        {detailQuery.isLoading && <ListSkeleton rows={2} />}
        {detailQuery.isError && (
          <ErrorState onRetry={() => void detailQuery.refetch()} />
        )}
        {detail && (
          <dl className="divide-y divide-border text-sm">
            {[
              [t("adminTransactions.txCode"), detail.id],
              [
                t("adminTransactions.tutor"),
                detail.tutorName ?? detail.tutorId ?? "—",
              ],
              [
                t("adminTransactions.colType"),
                TRANSACTION_TYPE_LABEL[
                  detail.transactionType as keyof typeof TRANSACTION_TYPE_LABEL
                ] ?? detail.transactionType,
              ],
              [t("adminTransactions.colAmount"), formatVnd(detail.amount)],
              [
                t("adminTransactions.colTime"),
                formatDateTime(detail.createdAt),
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2">
                <dt className="text-text-secondary">{k}</dt>
                <dd className="font-semibold text-text">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between py-2">
              <dt className="text-text-secondary">
                {t("adminTransactions.status")}
              </dt>
              <dd>
                <StatusBadge
                  kind="transaction"
                  status={detail.transactionStatus}
                />
              </dd>
            </div>
            {detail.transactionType === "COMMISSION" &&
              detail.transactionStatus === "SUCCESS" && (
                <div className="pt-3">
                  <Button
                    variant="danger"
                    fullWidth
                    loading={refundTransaction.isPending}
                    onClick={refund}
                  >
                    {t("adminTransactions.refundButton")}
                  </Button>
                </div>
              )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
