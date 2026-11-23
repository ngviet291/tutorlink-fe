import { useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { TRANSACTION_TYPE_LABEL } from "@/constants/enums";
import { formatVnd } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import { useTransactions } from "../hooks/useWallet";
import type { TransactionResponse } from "../types/wallet.types";
import { EditWithdrawalModal } from "./EditWithdrawalModal";

export function TransactionTable() {
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (!node) {
        return;
      }
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
        <h2 className="text-lg font-bold text-text">{t("wallet.transactionHistory")}</h2>
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
            <table className="w-full min-w-[760px] table-fixed text-left text-sm">
              <thead className="text-xs uppercase text-text-secondary">
                <tr>
                  <th className="w-[19%] py-3 pr-4">{t("wallet.time")}</th>
                  <th className="w-[22%] py-3 pr-4">{t("wallet.type")}</th>
                  <th className="w-[16%] py-3 pr-5 text-right">{t("wallet.amount")}</th>
                  <th className="w-[28%] py-3 px-4 text-center">Thông tin nhận tiền</th>
                  <th className="w-[15%] py-3 pl-4 text-center">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((tx) => (
                  <tr key={tx.id} className="align-middle">
                    <td className="py-3 pr-4 text-text-secondary">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-text">
                      {TRANSACTION_TYPE_LABEL[tx.transactionType]}
                    </td>
                    <td
                      className={`py-3 pr-5 text-right font-semibold ${
                        tx.transactionType === "TOP_UP" 
                          ? "text-success" 
                          : tx.transactionType === "WITHDRAW"
                            ? "text-danger"
                            : "text-text"
                      }`}
                    >
                      {tx.transactionType === "TOP_UP" ? "+" : "−"}
                      {formatVnd(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-text">
                      {tx.transactionType === "WITHDRAW" && (
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span className="font-medium break-words">{tx.accountHolderName}</span>
                          <span className="break-words text-text-secondary">
                            {tx.bankAccountNumber} · {tx.bankName}
                          </span>
                          {tx.transactionStatus === "PENDING" && (
                            <button
                              type="button"
                              className="mt-1 w-fit font-medium text-primary hover:underline"
                              onClick={() => setEditing(tx)}
                            >
                              Sửa thông tin
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pl-4 text-center">
                      <StatusBadge kind="transaction" status={tx.transactionStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editing && <EditWithdrawalModal transaction={editing} onClose={() => setEditing(null)} />}
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
