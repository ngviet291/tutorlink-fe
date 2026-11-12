import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { Select } from "@/shared/components/ui/Select";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import {
  TRANSACTION_STATUS_META,
  TRANSACTION_TYPE_LABEL,
} from "@/constants/enums";
import { formatVnd } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import type { TransactionStatus } from "@/shared/types/common.types";
import { useTransactions } from "../hooks/useWallet";

export function TransactionTable() {
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
  } = useTransactions({ transactionStatus: status || undefined });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const items = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-text">
          {t("wallet.transactionHistory")}
        </h2>
        <div className="w-44">
          <Select
            aria-label={t("wallet.filterByStatus")}
            placeholder={t("wallet.allStatuses")}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as TransactionStatus | "")
            }
            options={(
              Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]
            ).map((s) => ({
              value: s,
              label: TRANSACTION_STATUS_META[s].label,
            }))}
          />
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title={t("wallet.noTransactions")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-lg text-left text-sm">
              <thead className="text-xs uppercase text-text-secondary">
                <tr>
                  <th className="py-2 pr-3">{t("wallet.time")}</th>
                  <th className="pr-3">{t("wallet.type")}</th>
                  <th className="pr-3 text-right">{t("wallet.amount")}</th>
                  <th>{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pr-3 text-text-secondary">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="pr-3 font-medium text-text">
                      {TRANSACTION_TYPE_LABEL[tx.transactionType]}
                    </td>
                    <td
                      className={`pr-3 text-right font-semibold ${tx.transactionType === "TOP_UP" ? "text-success" : "text-text"}`}
                    >
                      {tx.transactionType === "TOP_UP" ? "+" : "−"}
                      {formatVnd(tx.amount)}
                    </td>
                    <td>
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
            <div ref={loaderRef} className="mt-4 flex justify-center py-2">
              {isFetchingNextPage && <ListSkeleton rows={1} />}
            </div>
          )}
        </>
      )}
    </section>
  );
}
