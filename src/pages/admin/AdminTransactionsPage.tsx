import { useState } from 'react'
import { TRANSACTION_STATUS_META } from '@/constants/enums'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Pagination } from '@/shared/components/ui/Pagination'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatVnd } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/hooks/useToast'
import { getErrorMessage } from '@/shared/utils/errors'
import { useAdminMutations, useAdminTransactions, useRevenueStatistics } from '@/features/admin/hooks/useAdmin'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { TransactionStatus } from '@/shared/types/common.types'
import type { TransactionResponse } from '@/features/wallet/types/wallet.types'

const TYPE_LABEL = { TOP_UP: 'Nạp tiền', COMMISSION: 'Phí nhận lớp', REFUND: 'Hoàn tiền' } as const

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [tutor, setTutor] = useState('')
  const [page, setPage] = useState(1)
  const debouncedTutor = useDebounce(tutor)
  const { data, isLoading, isError, refetch } = useAdminTransactions({ status, tutorId: debouncedTutor || undefined, page })
  const [detail, setDetail] = useState<TransactionResponse | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const toast = useToast()
  const revenue = useRevenueStatistics({ from: from || undefined, to: to || undefined })
  const { refundTransaction } = useAdminMutations()
  const rangeInvalid = Boolean(from && to && from > to)
  const refund = () => {
    if (!detail) return
    refundTransaction.mutate(detail.id, {
      onSuccess: (tx) => { toast.success('Đã hoàn tiền giao dịch'); setDetail(tx) },
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
        {rangeInvalid ? <p role="alert" className="text-sm text-danger">Ngày bắt đầu phải trước ngày kết thúc.</p> : revenue.isLoading ? <ListSkeleton rows={1} /> : revenue.data && (
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
        <Select aria-label="Trạng thái" placeholder="Tất cả trạng thái" value={status} onChange={(e) => { setStatus(e.target.value as TransactionStatus | ''); setPage(1) }}
          options={(Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]).map((s) => ({ value: s, label: TRANSACTION_STATUS_META[s].label }))} />
        <Input aria-label="Mã gia sư" placeholder="Lọc theo mã gia sư (VD: t-1)" value={tutor} onChange={(e) => { setTutor(e.target.value.trim()); setPage(1) }} />
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.items.length ? <EmptyState title="Không có giao dịch" /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary"><tr><th className="p-3">Thời gian</th><th>Gia sư</th><th>Loại</th><th className="text-right">Số tiền</th><th className="pr-3">Trạng thái</th></tr></thead>
              <tbody className="divide-y divide-border">
                {data.items.map((t) => (
                  <tr key={t.id} className="cursor-pointer hover:bg-surface-hover" onClick={() => setDetail(t)}>
                    <td className="p-3 text-text-secondary">{formatDateTime(t.createdAt)}</td>
                    <td className="font-medium text-text">{t.applicationId ?? '—'}</td>
                    <td>{TYPE_LABEL[t.transactionType as keyof typeof TYPE_LABEL] ?? t.transactionType}</td>
                    <td className="text-right font-semibold">{formatVnd(t.amount)}</td>
                    <td className="pr-3"><StatusBadge kind="transaction" status={t.transactionStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Chi tiết giao dịch" size="sm">
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
