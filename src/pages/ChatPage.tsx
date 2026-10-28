import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { ErrorState } from '@/shared/components/ui/EmptyState'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { ChatWindow } from '@/features/chat/components/ChatWindow'
import { ContactUnlockBox } from '@/features/chat/components/ContactUnlockBox'
import { useChatRoom } from '@/features/chat/hooks/useChat'

export default function ChatPage() {
  const { applicationId } = useParams()
  const { data, isLoading, isError, error, refetch } = useChatRoom(applicationId)

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={ROUTES.DASHBOARD} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft className="size-4" /> Quay lại tổng quan
      </Link>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError || !data ? (
        <ErrorState message={error instanceof Error ? error.message : 'Không thể mở phòng chat.'} onRetry={() => void refetch()} />
      ) : data.unlocked ? (
        <ChatWindow room={data} />
      ) : (
        <ContactUnlockBox partnerName={data.partnerName} />
      )}
    </div>
  )
}
