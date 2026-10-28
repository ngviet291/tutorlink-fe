import { useState } from 'react'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Pagination } from '@/shared/components/ui/Pagination'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { TRANSACTION_STATUS_META } from '@/constants/enums'
import { formatVnd } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import type { TransactionStatus } from '@/shared/types/common.types'
import { useTransactions } from '../hooks/useWallet'
import type { TransactionResponse } from '../types/wallet.types'

const TYPE_LABEL: Record<TransactionResponse['type'], string> = { TOP_UP: 'Nạp tiền', ENROLLMENT_FEE: 'Phí nhận lớp' }

export function TransactionTable() {
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useTransactions({ status, page, pageSize: 8 })

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-text">Lịch sử giao dịch</h2>
        <div className="w-44">
          <Select
            aria-label="Lọc theo trạng thái" placeholder="Tất cả trạng thái" value={status}
            onChange={(e) => { setStatus(e.target.value as TransactionStatus | ''); setPage(1) }}
            options={(Object.keys(TRANSACTION_STATUS_META) as TransactionStatus[]).map((s) => ({ value: s, label: TRANSACTION_STATUS_META[s].label }))}
          />
        </div>
      </div>

      {isLoading ? <ListSkeleton rows={4} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.items.length ? (
        <EmptyState title="Chưa có giao dịch" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase text-text-secondary">
                <tr><th className="py-2 pr-3">Thời gian</th><th className="pr-3">Loại</th><th className="pr-3 text-right">Số tiền</th><th>Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3 text-text-secondary">{formatDateTime(t.createdAt)}</td>
                    <td className="pr-3 font-medium text-text">{TYPE_LABEL[t.type]}</td>
                    <td className={`pr-3 text-right font-semibold ${t.type === 'TOP_UP' ? 'text-success' : 'text-text'}`}>
                      {t.type === 'TOP_UP' ? '+' : '−'}{formatVnd(t.amount)}
                    </td>
                    <td><StatusBadge kind="transaction" status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>
        </>
      )}
    </section>
  )
}
