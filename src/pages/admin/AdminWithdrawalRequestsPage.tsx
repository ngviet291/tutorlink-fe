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
  
  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const [detailId, setDetailId] = useState<string>();
  const detailQuery = useAdminTransaction(detailId);
  const detail = detailQuery.data;
  const toast = useToast();
  const { approveWithdrawal, rejectWithdrawal } = useAdminPaymentMutations();
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = () => {
    if (!detail) {
      return;
    }
    approveWithdrawal.mutate(detail.id, {
      onSuccess: () => {
        toast.success("Đã duyệt yêu cầu rút tiền");
        setDetailId(undefined);
        setConfirmAction(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  const handleReject = () => {
    if (!detail) {
      return;
    }
    rejectWithdrawal.mutate(detail.id, {
      onSuccess: () => {
        toast.success("Đã từ chối yêu cầu rút tiền và hoàn tiền vào ví");
        setDetailId(undefined);
        setConfirmAction(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader
        title="Yêu cầu rút tiền"
        description="Quản lý các yêu cầu rút tiền từ gia sư"
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title="Không có yêu cầu rút tiền đang chờ" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th>Gia sư</th>
                  <th className="pr-5 text-right">Số tiền</th>
                  <th>Ngân hàng</th>
                  <th className="pr-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer hover:bg-surface-hover"
                    onClick={() => setDetailId(t.id)}
                  >
                    <td className="p-3 text-text-secondary">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="font-medium text-text">{t.tutorName ?? t.tutorId ?? "—"}</td>
                    <td className="pr-5 text-right font-semibold text-danger">
                      {formatVnd(t.amount)}
                    </td>
                    <td className="text-text-secondary">
                      {t.bankName ?? "—"}
                    </td>
                    <td className="pr-3">
                      <StatusBadge kind="transaction" status={t.transactionStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && (
            <Button loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
              Tải thêm yêu cầu
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
        title="Chi tiết yêu cầu rút tiền"
        size="sm"
      >
        {detailQuery.isLoading && <ListSkeleton rows={2} />}
        {detailQuery.isError && <ErrorState onRetry={() => void detailQuery.refetch()} />}
        {detail && (
          <>
            <dl className="divide-y divide-border text-sm">
              {[
                ["Mã giao dịch", detail.id],
                ["Gia sư", detail.tutorName ?? detail.tutorId ?? "—"],
                ["Số tiền", formatVnd(detail.amount)],
                ["Tên chủ tài khoản", detail.accountHolderName ?? "—"],
                ["Số tài khoản", detail.bankAccountNumber ?? "—"],
                ["Ngân hàng", detail.bankName ?? "—"],
                ["Thời gian yêu cầu", formatDateTime(detail.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-2">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="font-semibold text-text">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <dt className="text-text-secondary">Trạng thái</dt>
                <dd>
                  <StatusBadge kind="transaction" status={detail.transactionStatus} />
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
                      Từ chối
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setConfirmAction("approve")}
                    >
                      Duyệt
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-surface-hover p-4">
                    <p className="mb-3 text-sm text-text">
                      {confirmAction === "approve"
                        ? "Xác nhận duyệt yêu cầu rút tiền này? Số tiền sẽ được chuyển khoản đến tài khoản ngân hàng của gia sư."
                        : "Xác nhận từ chối yêu cầu rút tiền? Số tiền sẽ được hoàn lại vào ví của gia sư."}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => setConfirmAction(null)}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant={confirmAction === "approve" ? "primary" : "danger"}
                        fullWidth
                        loading={
                          approveWithdrawal.isPending || rejectWithdrawal.isPending
                        }
                        onClick={
                          confirmAction === "approve" ? handleApprove : handleReject
                        }
                      >
                        Xác nhận
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
