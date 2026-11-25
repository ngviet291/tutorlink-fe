import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatVnd } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import { Button } from "@/shared/components/ui/Button";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminPaymentMutations,
  useAdminTransactions,
  useAdminTransaction,
} from "@/features/admin/hooks/useAdminPayments";

export default function AdminWithdrawalRequestsPage() {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminTransactions({ status: "PENDING", type: "WITHDRAW" });

  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const [detailId, setDetailId] = useState<string>();
  const detailQuery = useAdminTransaction(detailId);
  const detail = detailQuery.data;
  const toast = useToast();
  const { approveWithdrawal, rejectWithdrawal } = useAdminPaymentMutations();
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const handleApprove = () => {
    if (!detail) {
      return;
    }
    approveWithdrawal.mutate(detail.id, {
      onSuccess: () => {
        toast.success(t("admin.withdrawalrequests.approvedToast"));
        setDetailId(undefined);
        setConfirmAction(null);
      },
      onError: (e) => toast.apiError(e),
    });
  };

  const handleReject = () => {
    if (!detail) {
      return;
    }
    rejectWithdrawal.mutate(detail.id, {
      onSuccess: () => {
        toast.success(t("admin.withdrawalrequests.rejectedToast"));
        setDetailId(undefined);
        setConfirmAction(null);
      },
      onError: (e) => toast.apiError(e),
    });
  };

  // Key cố định để đổi ngôn ngữ không làm React mount lại cả dòng.
  const detailRows: [string, string, string | undefined][] = detail
    ? [
        ["id", t("admin.withdrawalrequests.txId"), detail.id],
        [
          "tutor",
          t("admin.withdrawalrequests.colTutor"),
          detail.tutorName ?? detail.tutorId ?? "—",
        ],
        [
          "amount",
          t("admin.withdrawalrequests.colAmount"),
          formatVnd(detail.amount),
        ],
        [
          "holder",
          t("admin.withdrawalrequests.holder"),
          detail.accountHolderName ?? "—",
        ],
        [
          "accountNumber",
          t("admin.withdrawalrequests.accountNumber"),
          detail.bankAccountNumber ?? "—",
        ],
        ["bank", t("admin.withdrawalrequests.colBank"), detail.bankName ?? "—"],
        [
          "requestedAt",
          t("admin.withdrawalrequests.requestedAt"),
          formatDateTime(detail.createdAt),
        ],
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader
        title={t("admin.withdrawalrequests.title")}
        description={t("admin.withdrawalrequests.description")}
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title={t("admin.withdrawalrequests.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">
                    {t("admin.withdrawalrequests.colTime")}
                  </th>
                  <th>{t("admin.withdrawalrequests.colTutor")}</th>
                  <th className="pr-5 text-right">
                    {t("admin.withdrawalrequests.colAmount")}
                  </th>
                  <th>{t("admin.withdrawalrequests.colBank")}</th>
                  <th className="pr-3">
                    {t("admin.withdrawalrequests.colStatus")}
                  </th>
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
                    <td className="font-medium text-text">
                      {tx.tutorName ?? tx.tutorId ?? "—"}
                    </td>
                    <td className="pr-5 text-right font-semibold text-danger-text">
                      {formatVnd(tx.amount)}
                    </td>
                    <td className="text-text-secondary">
                      {tx.bankName ?? "—"}
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
              {t("admin.withdrawalrequests.loadMore")}
            </Button>
          )}
        </>
      )}

      <Modal
        open={Boolean(detailId)}
        onClose={() => {
          setDetailId(undefined);
          setConfirmAction(null);
        }}
        title={t("admin.withdrawalrequests.detailTitle")}
        size="sm"
      >
        {detailQuery.isLoading && <ListSkeleton rows={2} />}
        {detailQuery.isError && (
          <ErrorState onRetry={() => void detailQuery.refetch()} />
        )}
        {detail && (
          <>
            <dl className="divide-y divide-border text-sm">
              {detailRows.map(([key, label, value]) => (
                <div key={key} className="flex justify-between gap-3 py-2">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="font-semibold text-text">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <dt className="text-text-secondary">
                  {t("admin.withdrawalrequests.colStatus")}
                </dt>
                <dd>
                  <StatusBadge
                    kind="transaction"
                    status={detail.transactionStatus}
                  />
                </dd>
              </div>
            </dl>

            {detail.transactionStatus === "PENDING" && (
              <>
                {!confirmAction ? (
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setConfirmAction("reject")}
                    >
                      {t("admin.withdrawalrequests.reject")}
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setConfirmAction("approve")}
                    >
                      {t("admin.withdrawalrequests.approve")}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-surface-hover p-4">
                    <p className="mb-3 text-sm text-text">
                      {confirmAction === "approve"
                        ? t("admin.withdrawalrequests.confirmApprove")
                        : t("admin.withdrawalrequests.confirmReject")}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setConfirmAction(null)}
                      >
                        {t("admin.withdrawalrequests.cancel")}
                      </Button>
                      <Button
                        variant={
                          confirmAction === "approve" ? "primary" : "danger"
                        }
                        fullWidth
                        loading={
                          approveWithdrawal.isPending ||
                          rejectWithdrawal.isPending
                        }
                        onClick={
                          confirmAction === "approve"
                            ? handleApprove
                            : handleReject
                        }
                      >
                        {t("admin.withdrawalrequests.confirm")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
