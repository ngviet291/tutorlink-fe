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
import { useAdminTransactions } from '@/features/admin/hooks/useAdmin'
import { useDebounce } from '@/shared/hooks/useDebounce'
import type { TransactionStatus } from '@/shared/types/common.types'
import type { TransactionResponse } from '@/features/wallet/types/wallet.types'

const TYPE_LABEL = { TOP_UP: 'Nạp tiền', ENROLLMENT_FEE: 'Phí nhận lớp' } as const

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [tutor, setTutor] = useState('')
  const [page, setPage] = useState(1)
  const debouncedTutor = useDebounce(tutor)
  const { data, isLoading, isError, refetch } = useAdminTransactions({ status, tutorId: debouncedTutor || undefined, page })
  const [detail, setDetail] = useState<TransactionResponse | null>(null)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Quản lý giao dịch" />
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
                    <td className="font-medium text-text">{t.tutorName ?? t.tutorId}</td>
                    <td>{TYPE_LABEL[t.type]}</td>
                    <td className="text-right font-semibold">{formatVnd(t.amount)}</td>
                    <td className="pr-3"><StatusBadge kind="transaction" status={t.status} /></td>
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
            {[['Mã giao dịch', detail.id], ['Gia sư', `${detail.tutorName ?? ''} (${detail.tutorId ?? ''})`], ['Loại', TYPE_LABEL[detail.type]], ['Số tiền', formatVnd(detail.amount)], ['Lượt đăng ký', detail.applicationId ?? '—'], ['Thời gian', formatDateTime(detail.createdAt)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-text-secondary">{k}</dt><dd className="font-semibold text-text">{v}</dd></div>
            ))}
            <div className="flex justify-between py-2"><dt className="text-text-secondary">Trạng thái</dt><dd><StatusBadge kind="transaction" status={detail.status} /></dd></div>
          </dl>
        )}
      </Modal>
    </div>
  )
}
