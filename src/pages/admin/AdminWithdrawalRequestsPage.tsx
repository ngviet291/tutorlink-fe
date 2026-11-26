import { useState } from "react";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatVnd } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import { Button } from "@/shared/components/ui/Button";
import { useToast } from "@/shared/hooks/useToast";
import { getErrorMessage } from "@/shared/utils/errors";
import {
  useAdminPaymentMutations,
  useAdminTransactions,
  useAdminTransaction,
} from "@/features/admin/hooks/useAdminPayments";
import { useTranslation } from "react-i18next";

export default function AdminWithdrawalRequestsPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminTransactions({ status: "PENDING", type: "WITHDRAW" });
  const { t } = useTranslation();
  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const [detailId, setDetailId] = useState<string>();
  const detailQuery = useAdminTransaction(detailId);
  const detail = detailQuery.data;
  const toast = useToast();
  const { approveWithdrawal, rejectWithdrawal } = useAdminPaymentMutations();
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const showQr =
    detail?.transactionStatus === "PENDING" &&
    Boolean(detail.bankAccountNumber);

  const qrUrl =
    detail && showQr
      ? `https://img.vietqr.io/image/${encodeURIComponent(detail.bankName ?? "")}-${detail.bankAccountNumber}-compact2.png` +
        `?amount=${detail.amount}` +
        `&addInfo=${encodeURIComponent(t("admin.withdrawalrequests.qrTransferMemo", { id: detail.id.slice(0, 8) }))}` +
        `&accountName=${encodeURIComponent(detail.accountHolderName ?? "")}`
      : "";

  // Thông tin đã in trong ảnh QR thì không hiện lại ở danh sách.
  const rows: [string, string][] = detail
    ? [
        [t("admin.withdrawalrequests.txId"), detail.id],
        [t("admin.withdrawalrequests.colTutor"), detail.tutorName ?? detail.tutorId ?? "—"],
        ...(showQr
          ? []
          : ([
              [t("admin.withdrawalrequests.colAmount"), formatVnd(detail.amount)],
              [t("admin.withdrawalrequests.holder"), detail.accountHolderName ?? "—"],
              [t("admin.withdrawalrequests.accountNumber"), detail.bankAccountNumber ?? "—"],
              [t("admin.withdrawalrequests.bank"), detail.bankName ?? "—"],
            ] as [string, string][])),
        [t("admin.withdrawalrequests.requestedAt"), formatDateTime(detail.createdAt)],
      ]
    : [];

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
                {items.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer hover:bg-surface-hover"
                    onClick={() => setDetailId(t.id)}>
                    <td className="p-3 text-text-secondary">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="font-medium text-text">
                      {t.tutorName ?? t.tutorId ?? "—"}
                    </td>
                    <td className="pr-5 text-right font-semibold text-danger">
                      {formatVnd(t.amount)}
                    </td>
                    <td className="text-text-secondary">{t.bankName ?? "—"}</td>
                    <td className="pr-3">
                      <StatusBadge
                        kind="transaction"
                        status={t.transactionStatus}
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
        size="md"
        className="max-h-[96vh]! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {detailQuery.isLoading && <ListSkeleton rows={2} />}
        {detailQuery.isError && (
          <ErrorState onRetry={() => void detailQuery.refetch()} />
        )}
        {detail && (
          <>
            <dl className="divide-y divide-border text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="font-semibold text-text">{v}</dd>
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
            {showQr && (
              <img
                src={qrUrl}
                alt={t("admin.withdrawalrequests.qrAlt")}
                className="mx-auto mt-4 w-full max-w-sm rounded-xl border border-border bg-white object-contain p-2"
              />
            )}
            {detail.transactionStatus === "PENDING" && (
              <>
                {!confirmAction ? (
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setConfirmAction("reject")}>
                      {t("admin.withdrawalrequests.reject")}
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setConfirmAction("approve")}>
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
                        onClick={() => setConfirmAction(null)}>
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
                        }>
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
