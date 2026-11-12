import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { getErrorMessage } from '@/shared/utils/errors'
import { ContactUnlockBox } from '@/features/chat/components/ContactUnlockBox'
import { useChannelWithPartner } from '@/features/chat/hooks/useChat'

/** Mở chat theo đối tác: có channel → vào thẳng; 404 → khóa; lỗi khác → báo lỗi riêng. */
export default function ChatWithPartnerPage() {
  const { partnerId } = useParams()
  const { data, isLoading, isError, error, refetch } = useChannelWithPartner(partnerId)

  if (data) return <Navigate to={ROUTES.CHAT(data.channelId)} replace />

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={ROUTES.CHAT_INBOX} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft className="size-4" /> Tất cả tin nhắn
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <ContactUnlockBox partnerId={partnerId} />
      )}
    </div>
  )
}
