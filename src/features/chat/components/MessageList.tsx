import { useLayoutEffect, useRef } from 'react'
import { Spinner } from '@/shared/components/ui/Spinner'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import type { ChatMessage } from '../types/chat.types'
import { MessageBubble } from './MessageBubble'

const NEAR_BOTTOM_PX = 120

interface Props {
  /** Thứ tự cũ → mới. */
  messages: ChatMessage[]
  myId: string | undefined
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onResend: (message: ChatMessage) => void
}

export function MessageList({ messages, myId, hasMore, isLoadingMore, onLoadMore, onResend }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prev = useRef<{ firstId?: string; lastId?: string; height: number }>({ height: 0 })
  const topSentinel = useInfiniteScroll(onLoadMore, hasMore && !isLoadingMore)

  // Tin cũ vừa được chèn lên đầu thì giữ nguyên vị trí đang đọc; tin mới ở cuối thì cuộn xuống nếu đang ở gần đáy
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const firstId = messages[0]?.id
    const lastId = messages[messages.length - 1]?.id
    const last = messages[messages.length - 1]
    const before = prev.current

    if (before.lastId === undefined) {
      el.scrollTop = el.scrollHeight // lần đầu: xuống tin mới nhất
    } else if (lastId !== before.lastId) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX + (el.scrollHeight - before.height)
      if (nearBottom || last?.senderId === myId) el.scrollTop = el.scrollHeight
    } else if (firstId !== before.firstId) {
      el.scrollTop += el.scrollHeight - before.height
    }
    prev.current = { firstId, lastId, height: el.scrollHeight }
  }, [messages, myId])

  const lastReadMineId = [...messages].reverse().find((m) => m.senderId === myId && m.status === 'read')?.id

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-background p-4" aria-live="polite">
      <div ref={topSentinel} aria-hidden="true" className="flex h-4 shrink-0 justify-center">
        {isLoadingMore && <Spinner />}
      </div>
      {messages.length === 0 && <p className="m-auto text-sm text-text-secondary">Hãy gửi lời chào đầu tiên 👋</p>}
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          mine={m.senderId === myId}
          showReadReceipt={m.id === lastReadMineId}
          onResend={onResend}
        />
      ))}
    </div>
  )
}
