import { useState } from 'react'
import { TRANSACTION_STATUS_META } from '@/constants/enums'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatVnd } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAdminMutations, useAdminTransactions, useRevenueStatistics, useAdminTransaction } from '@/features/admin/hooks/useAdmin'
import type { TransactionStatus } from '@/shared/types/common.types'

const TYPE_LABEL = { TOP_UP: 'Nạp tiền', COMMISSION: 'Phí nhận lớp', REFUND: 'Hoàn tiền' } as const

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminTransactions({ status });
  const items = data?.pages.flatMap(p => p.content) ?? [];
  const [detailId, setDetailId] = useState<string>();
  const detailQuery = useAdminTransaction(detailId);
  const detail = detailQuery.data;
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const toast = useToast()
  const revenue = useRevenueStatistics({ from: from || undefined, to: to || undefined })
  const { refundTransaction } = useAdminMutations()
  const rangeInvalid = Boolean(from) !== Boolean(to) || Boolean(from && to && from > to)
  const refund = () => {
    if (!detail) return
    refundTransaction.mutate(detail.id, {
      onSuccess: (tx) => { toast.success('Đã hoàn tiền giao dịch'); void tx; void detailQuery.refetch() },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Quản lý giao dịch" />
      <section aria-label="Thống kê doanh thu" className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-base font-bold text-text">Thống kê doanh thu</h2>
          <Input aria-label="Từ ngày" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <Input aria-label="Đến ngày" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        {rangeInvalid ? <p role="alert" className="text-sm text-danger">Chọn đủ hai ngày, ngày bắt đầu không sau ngày kết thúc.</p> : revenue.isError ? <ErrorState onRetry={() => void revenue.refetch()} /> : revenue.isLoading ? <ListSkeleton rows={1} /> : revenue.data && (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[
              ['Doanh thu thuần', formatVnd(revenue.data.totalRevenue)], ['Đã hoàn tiền', formatVnd(revenue.data.totalRefunded)], ['Tổng nạp ví', formatVnd(revenue.data.totalTopUp)],
              ['Lượt thu phí thành công', revenue.data.successCount], ['Lượt nạp ví thành công', revenue.data.topUpCount], ['Giao dịch thất bại / hoàn', `${revenue.data.failedCount} / ${revenue.data.refundedCount}`],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-surface-hover p-3"><dt className="text-xs text-text-secondary">{k}</dt><dd className="mt-0.5 text-lg font-extrabold text-text">{v}</dd></div>
            ))}
          </dl>
        )}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select aria-label="Trạng thái" placeholder="Tất cả trạng thái" value={status} onChange={(e) => { setStatus(e.target.value as TransactionStatus | '') }}
          options={(Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]).map((s) => ({ value: s, label: TRANSACTION_STATUS_META[s].label }))} />
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !items.length ? <EmptyState title="Không có giao dịch" /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary"><tr><th className="p-3">Thời gian</th><th>Gia sư</th><th>Loại</th><th className="text-right">Số tiền</th><th className="pr-3">Trạng thái</th></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id} className="cursor-pointer hover:bg-surface-hover" onClick={() => setDetailId(t.id)}>
                    <td className="p-3 text-text-secondary">{formatDateTime(t.createdAt)}</td>
                    <td className="font-medium text-text">{t.tutorId ?? '—'}</td>
                    <td>{TYPE_LABEL[t.transactionType as keyof typeof TYPE_LABEL] ?? t.transactionType}</td>
                    <td className="text-right font-semibold">{formatVnd(t.amount)}</td>
                    <td className="pr-3"><StatusBadge kind="transaction" status={t.transactionStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && <Button loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>Tải thêm giao dịch</Button>}
        </>
      )}

      <Modal open={Boolean(detailId)} onClose={() => setDetailId(undefined)} title="Chi tiết giao dịch" size="sm">
        {detailQuery.isLoading && <ListSkeleton rows={2} />}
        {detailQuery.isError && <ErrorState onRetry={() => void detailQuery.refetch()} />}
        {detail && (
          <dl className="divide-y divide-border text-sm">
            {[['Mã giao dịch', detail.id], ['Loại', TYPE_LABEL[detail.transactionType as keyof typeof TYPE_LABEL] ?? detail.transactionType], ['Số tiền', formatVnd(detail.amount)], ['Lượt đăng ký', detail.applicationId ?? '—'], ['Thời gian', formatDateTime(detail.createdAt)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-text-secondary">{k}</dt><dd className="font-semibold text-text">{v}</dd></div>
            ))}
            <div className="flex justify-between py-2"><dt className="text-text-secondary">Trạng thái</dt><dd><StatusBadge kind="transaction" status={detail.transactionStatus} /></dd></div>
            {detail.transactionType === 'COMMISSION' && detail.transactionStatus === 'SUCCESS' && (
              <div className="pt-3"><Button variant="danger" fullWidth loading={refundTransaction.isPending} onClick={refund}>Hoàn tiền cho gia sư</Button></div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  )
}
