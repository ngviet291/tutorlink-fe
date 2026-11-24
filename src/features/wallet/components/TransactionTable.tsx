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
        <ErrorState message="Không tải được lịch sử giao dịch. Vui lòng thử lại." onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title={t("wallet.noTransactions")} />
      ) : (
        <>
          {/* Mobile: mỗi giao dịch là một thẻ, không cần cuộn ngang */}
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((tx) => (
              <li key={tx.id} className="rounded-xl border border-border bg-surface-secondary p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text">{TRANSACTION_TYPE_LABEL[tx.transactionType]}</p>
                    <p className="text-xs text-text-secondary">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <p
                    className={`shrink-0 font-bold ${
                      tx.transactionType === "TOP_UP"
                        ? "text-success-text"
                        : tx.transactionType === "WITHDRAW"
                          ? "text-danger-text"
                          : "text-text"
                    }`}
                  >
                    {tx.transactionType === "TOP_UP" ? "+" : "−"}
                    {formatVnd(tx.amount)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge kind="transaction" status={tx.transactionStatus} />
                </div>
                {tx.transactionType === "WITHDRAW" && (
                  <div className="mt-2 border-t border-border pt-2 text-sm">
                    <p className="text-xs text-text-secondary">Thông tin nhận tiền</p>
                    <p className="break-words font-medium text-text">{tx.accountHolderName}</p>
                    <p className="break-words text-text-secondary">
                      {tx.bankAccountNumber} · {tx.bankName}
                    </p>
                    {tx.transactionStatus === "PENDING" && (
                      <button
                        type="button"
                        className="mt-1 min-h-11 font-medium text-primary hover:underline"
                        onClick={() => setEditing(tx)}
                      >
                        Sửa thông tin
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-fixed text-left text-sm">
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
                          ? "text-success-text" 
                          : tx.transactionType === "WITHDRAW"
                            ? "text-danger-text"
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
