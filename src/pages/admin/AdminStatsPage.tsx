import { usePostStatistics } from '@/features/post/hooks/usePosts'
import { POST_STATUS_META } from '@/constants/enums'
import { AdminApplicationsPanel } from '@/features/admin/components/AdminApplicationsPanel'
import { CircleDollarSign, Handshake } from 'lucide-react'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { formatVnd } from '@/shared/utils/currency'
import { useAdminStats } from '@/features/admin/hooks/useAdmin'
import type { RevenuePoint } from '@/features/admin/types/admin.types'

/** Biểu đồ cột tự dựng bằng SVG. */
function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const W = 560, H = 220, PAD = { l: 8, r: 8, t: 24, b: 28 }
  const max = Math.max(...points.map((p) => p.revenue), 1)
  const bw = (W - PAD.l - PAD.r) / Math.max(points.length, 1)
  const summary = points.map((p) => `${p.label}: ${formatVnd(p.revenue)}`).join('; ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Doanh thu phí nhận lớp theo tháng. ${summary}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + (H - PAD.t - PAD.b) * (1 - g)} y2={PAD.t + (H - PAD.t - PAD.b) * (1 - g)} stroke="var(--color-border)" strokeDasharray="3 3" />
      ))}
      {points.map((p, i) => {
        const h = ((H - PAD.t - PAD.b) * p.revenue) / max
        const x = PAD.l + i * bw + bw * 0.18
        const y = H - PAD.b - h
        return (
          <g key={p.label}>
            <rect x={x} y={y} width={bw * 0.64} height={h} rx={6} fill="var(--color-primary)" />
            <text x={x + bw * 0.32} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text)">{(p.revenue / 1_000_000).toFixed(1)}tr</text>
            <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">{p.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminStatsPage() {
  const { data, isLoading, isError, refetch } = useAdminStats()
  const postStats = usePostStatistics()
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  const totalRevenue = data?.revenueByMonth.reduce((s, p) => s + p.revenue, 0)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title="Thống kê" description="Tổng quan doanh thu phí nhận lớp và hoạt động của nền tảng." />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: CircleDollarSign, label: 'Doanh thu 6 tháng', value: totalRevenue === undefined ? undefined : formatVnd(totalRevenue) },
          { icon: Handshake, label: 'Đơn được chấp nhận trong 6 tháng', value: data?.totalSuccessfulMatches },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary"><Icon className="size-5" /></span>
            <div><p className="text-xs text-text-secondary">{label}</p>{value === undefined ? <Skeleton className="mt-1 h-6 w-20" /> : <p className="text-xl font-extrabold text-text">{value}</p>}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-2 text-lg font-bold text-text">Doanh thu phí nhận lớp theo tháng</h2>
        {isLoading || !data ? <Skeleton className="h-56 w-full" /> : <RevenueChart points={data.revenueByMonth} />}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold text-text">Top gia sư nhận lớp nhiều nhất</h2>
          {isLoading || !data ? <Skeleton className="h-40" /> : (
            <ol className="flex flex-col gap-2">
              {data.topTutors.map((t, i) => (
                <li key={t.tutorId} className="flex items-center gap-3 rounded-xl bg-surface-hover px-3 py-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{i + 1}</span>
                  <span className="flex-1 truncate font-semibold text-text">{t.fullName}</span>
                  <span className="text-sm font-bold text-primary">{t.matchCount} lớp</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-bold">Bài đăng theo trạng thái</h2>
        {postStats.isLoading ? <Skeleton className="h-24" /> : postStats.isError ? <ErrorState onRetry={() => void postStats.refetch()} /> :
          <ul>{postStats.data?.map(p => <li key={p.status} className="flex justify-between py-2"><span>{POST_STATUS_META[p.status].label}</span><strong>{p.count}</strong></li>)}</ul>}
      </section>
      <AdminApplicationsPanel />
    </div>
  )
}
