import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, FileText, Heart, Inbox, Plus, Star, Users, Wallet } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatVnd } from '@/shared/utils/currency'
import { useAppSelector } from '@/shared/hooks/useAppStore'
import { OfferList } from '@/features/application/components/OfferList'
import { useConnections, useMyApplications } from '@/features/application/hooks/useApplications'
import type { ApplicationResponse } from '@/features/application/types/application.types'
import { useFavorites } from '@/features/favorite/hooks/useFavorites'
import { useMyPosts } from '@/features/post/hooks/usePosts'
import { ReviewForm } from '@/features/review/components/ReviewForm'
import { useHasReviewed } from '@/features/review/hooks/useReviews'
import { useMyTutorProfile } from '@/features/tutor/hooks/useTutors'
import { PayFeeModal } from '@/features/wallet/components/PayFeeModal'
import { useWallet } from '@/features/wallet/hooks/useWallet'
import { useNotifications } from '@/features/notification/hooks/useNotifications'

function Stat({ icon: Icon, label, value, to }: { icon: typeof Users; label: string; value: string | number | undefined; to?: string }) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary"><Icon className="size-5" /></span>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        {value === undefined ? <Skeleton className="mt-1 h-6 w-12" /> : <p className="text-xl font-extrabold text-text">{value}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function ConnectedRow({ a, myId }: { a: ApplicationResponse; myId: string }) {
  const [open, setOpen] = useState(false)
  const iAmStudent = (a.post.type === 'FIND_TUTOR' ? a.post.author.id : a.applicant.id) === myId
  const partner = a.post.author.id === myId ? a.applicant : a.post.author
  const tutorName = a.post.type === 'FIND_TUTOR' ? a.applicant.fullName : a.post.author.fullName
  const reviewed = useHasReviewed(a.id)

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link to={ROUTES.POST_DETAIL(a.post.id)} className="block truncate font-bold text-text hover:text-primary">{a.post.title}</Link>
        <p className="text-xs text-text-secondary">Kết nối với {partner.fullName}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link to={ROUTES.CHAT(a.id)}><Button size="sm" variant="secondary">Mở chat</Button></Link>
        {iAmStudent && !reviewed.data && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Star className="size-4" /> Kết thúc lớp & đánh giá</Button>
        )}
        {iAmStudent && reviewed.data && <Badge tone="green">Đã đánh giá</Badge>}
      </div>
      {iAmStudent && <ReviewForm applicationId={a.id} tutorName={tutorName} open={open} onClose={() => setOpen(false)} />}
    </li>
  )
}

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isTutor = user?.role === 'TUTOR'
  const isStudent = user?.role === 'STUDENT'
  const posts = useMyPosts()
  const apps = useMyApplications()
  const connections = useConnections()
  const favorites = useFavorites(isStudent)
  const wallet = useWallet(isTutor)
  const profile = useMyTutorProfile(isTutor)
  const notifications = useNotifications()
  const [offer, setOffer] = useState<ApplicationResponse | null>(null)

  if (!user) return null

  const myPosts = posts.data ?? []
  const received = myPosts.reduce((s, p) => s + (p.applicationCount ?? 0), 0)
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0
  const recentPosts = myPosts.slice(0, 4)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title={`Xin chào, ${user.fullName}`}
        description={isTutor ? 'Quản lý lớp, đơn ứng tuyển và ví của bạn.' : 'Theo dõi bài đăng, ứng viên và các lớp đã kết nối.'}
        actions={
          <Link to={ROUTES.POST_CREATE}>
            <Button><Plus className="size-4" /> {isTutor ? 'Đăng tìm học viên' : 'Đăng bài tìm gia sư'}</Button>
          </Link>
        }
      />

      {isTutor && profile.data && profile.data.profileStatus !== 'APPROVED' && (
        <Link to={ROUTES.TUTOR_PROFILE} className="rounded-2xl bg-amber-100 p-4 text-sm font-semibold text-amber-900 hover:opacity-90 dark:bg-amber-500/20 dark:text-amber-200">
          {profile.data.profileStatus === 'PENDING' ? 'Hồ sơ gia sư đang chờ duyệt — xem chi tiết →' : 'Hồ sơ gia sư bị từ chối — xem ghi chú và cập nhật →'}
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileText} label="Bài đăng của tôi" value={posts.data ? myPosts.length : undefined} to={ROUTES.MY_POSTS} />
        <Stat icon={Users} label={isTutor ? 'Đơn đã ứng tuyển' : 'Lượt ứng tuyển nhận được'} value={isTutor ? (apps.data ? apps.data.length : undefined) : posts.data ? received : undefined} to={isTutor ? ROUTES.MY_APPLICATIONS : ROUTES.MY_POSTS} />
        {isTutor ? (
          <Stat icon={Wallet} label="Số dư ví" value={wallet.data ? formatVnd(wallet.data.balance) : undefined} to={ROUTES.WALLET} />
        ) : (
          <Stat icon={Heart} label="Gia sư yêu thích" value={isStudent ? (favorites.data ? favorites.data.length : undefined) : 0} to={ROUTES.FAVORITES} />
        )}
        <Stat icon={Inbox} label="Thông báo chưa đọc" value={notifications.data ? unread : undefined} to={ROUTES.NOTIFICATIONS} />
      </div>

      {isTutor && <OfferList onPay={setOffer} />}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text">Bài đăng gần đây</h2>
          <Link to={ROUTES.MY_POSTS} className="text-sm font-semibold text-primary hover:underline">Xem tất cả</Link>
        </div>
        {posts.isLoading ? <Skeleton className="h-24 w-full" /> : recentPosts.length === 0 ? (
          <EmptyState title="Bạn chưa có bài đăng" />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link to={ROUTES.POST_DETAIL(p.id)} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 hover:shadow-md">
                  <span className="min-w-0 truncate font-semibold text-text">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-text-secondary">
                    <Users className="size-3.5" /> {p.applicationCount ?? 0}
                    <StatusBadge kind="post" status={p.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-text"><BookOpenCheck className="size-5 text-primary" /> {isTutor ? 'Lớp đang dạy' : 'Lớp đã kết nối'}</h2>
        {connections.isLoading ? <Skeleton className="h-20 w-full" /> : !connections.data?.length ? (
          <EmptyState title="Chưa có lớp nào được kết nối" description="Lớp sẽ xuất hiện ở đây sau khi gia sư thanh toán phí nhận lớp." />
        ) : (
          <ul className="flex flex-col gap-3">{connections.data.map((a) => <ConnectedRow key={a.id} a={a} myId={user.id} />)}</ul>
        )}
      </section>

      <PayFeeModal application={offer} onClose={() => setOffer(null)} />
    </div>
  )
}
