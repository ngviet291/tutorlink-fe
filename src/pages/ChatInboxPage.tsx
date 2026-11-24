import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/shared/components/ui/Avatar'
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { ListSkeleton } from '@/shared/components/ui/Skeleton'
import { timeAgo } from '@/shared/utils/date'
import { ConnectionStatus } from '@/features/chat/components/ConnectionStatus'
import { useChannels } from '@/features/chat/hooks/useChat'

export default function ChatInboxPage() {
  const { data, isLoading, isError, refetch } = useChannels()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Tin nhắn" description="Các cuộc trò chuyện với học viên / gia sư đã kết nối." />
      <ConnectionStatus />
      {isLoading ? <ListSkeleton /> : isError ? <ErrorState message="Không tải được danh sách tin nhắn. Vui lòng thử lại." onRetry={() => void refetch()} /> : !data?.length ? (
        <EmptyState
          icon={<MessageSquare className="size-10" />}
          title="Chưa có cuộc trò chuyện"
          description="Kênh chat sẽ mở sau khi gia sư thanh toán phí nhận lớp."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {data.map((t) => (
            <li key={t.channelId}>
              <Link to={ROUTES.CHAT(t.channelId)} className="flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                <Avatar name={t.partner.fullName} src={t.partner.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${t.unreadCount ? 'font-extrabold' : 'font-semibold'} text-text`}>{t.partner.fullName}</p>
                    {t.lastMessageAt && <span className="shrink-0 text-xs text-text-secondary">{timeAgo(t.lastMessageAt)}</span>}
                  </div>
                  <p className={`truncate text-sm ${t.unreadCount ? 'font-semibold text-text' : 'text-text-secondary'}`}>
                    {t.lastMessage ?? (t.lastMessageAt ? 'Mở để xem tin nhắn' : 'Chưa có tin nhắn')}
                  </p>
                </div>
                {t.unreadCount > 0 && (
                  <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white"><span aria-hidden="true">{t.unreadCount}</span><span className="sr-only">{t.unreadCount} tin chưa đọc</span></span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
