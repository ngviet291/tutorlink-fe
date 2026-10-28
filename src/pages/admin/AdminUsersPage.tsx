import { useState } from 'react'
import { Search } from 'lucide-react'
import { ACCOUNT_STATUS_META } from '@/constants/enums'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Pagination } from '@/shared/components/ui/Pagination'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { Select } from '@/shared/components/ui/Select'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useToast } from '@/shared/hooks/useToast'
import { useAdminMutations, useAdminUsers } from '@/features/admin/hooks/useAdmin'
import type { AccountStatus } from '@/shared/types/common.types'
import type { UserAdminRow } from '@/features/user/types/user.types'

const ROLE_LABEL = { GUEST: 'Khách', STUDENT: 'Học viên', TUTOR: 'Gia sư', ADMIN: 'Admin' } as const

export default function AdminUsersPage() {
  const toast = useToast()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(keyword)
  const { data, isLoading, isError, refetch } = useAdminUsers({ keyword: debounced || undefined, page })
  const { setUserStatus } = useAdminMutations()
  const [detail, setDetail] = useState<UserAdminRow | null>(null)

  const change = (u: UserAdminRow, status: AccountStatus) =>
    setUserStatus.mutate({ id: u.id, status }, {
      onSuccess: (r) => { toast.success('Đã cập nhật trạng thái tài khoản'); setDetail(r) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Quản lý người dùng" />
      <Input aria-label="Tìm người dùng" placeholder="Tìm theo tên, email, SĐT..." leftIcon={<Search className="size-4" />} value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} />

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={() => void refetch()} /> : !data?.items.length ? <EmptyState title="Không có người dùng" /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr><th className="p-3">Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th className="pr-3 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3"><div className="flex items-center gap-2"><Avatar name={u.fullName} size="sm" /><div><p className="font-semibold text-text">{u.fullName}</p><p className="text-xs text-text-secondary">{u.email}</p></div></div></td>
                    <td><Badge tone="gray">{ROLE_LABEL[u.role]}</Badge></td>
                    <td><StatusBadge kind="account" status={u.status} /></td>
                    <td className="pr-3 text-right"><button type="button" className="cursor-pointer text-sm font-semibold text-primary hover:underline" onClick={() => setDetail(u)}>Chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Chi tiết người dùng">
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              {[['Họ tên', detail.fullName], ['Email', detail.email], ['SĐT', detail.phone], ['Vai trò', ROLE_LABEL[detail.role]], ['Khu vực', [detail.address?.district, detail.address?.city].filter(Boolean).join(', ') || '—'], ['Ngày tạo', formatDate(detail.createdAt)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-text-secondary">{k}</dt><dd className="font-semibold text-text">{v}</dd></div>
              ))}
            </dl>
            <p className="text-xs text-text-secondary">Mật khẩu không bao giờ được hiển thị.</p>
            {detail.role !== 'ADMIN' && (
              <Select
                label="Trạng thái tài khoản" value={detail.status} disabled={setUserStatus.isPending}
                onChange={(e) => change(detail, e.target.value as AccountStatus)}
                options={(Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]).map((s) => ({ value: s, label: ACCOUNT_STATUS_META[s].label }))}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
