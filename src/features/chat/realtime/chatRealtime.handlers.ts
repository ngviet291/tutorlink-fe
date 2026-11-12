import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeEventRouter } from '@/config/realtime/RealtimeEventRouter'
import type { RealtimeEnvelope, Unsubscribe } from '@/config/realtime/realtime.types'
import { queryKeys } from '@/constants/queryKeys'
import { isMessageReadReceipt, isMessageResponse, previewOf, toChatMessage } from '../mapper/chat.mapper'
import type { ChatThread } from '../types/chat.types'
import {
  bumpThread,
  hasMessage,
  incrementCount,
  markMineRead,
  upsertMessage,
  type MessagesCache,
} from './chatCache'

export const MESSAGE_NEW = 'MESSAGE_NEW'
export const MESSAGE_READ = 'MESSAGE_READ'

/** Ngữ cảnh hẹp mà handler cần (ISP): không nhận cả store hay cả React. */
export interface ChatRealtimeContext {
  queryClient: QueryClient
  getMyId: () => string | undefined
  getActiveChannelId: () => string | null
  /** Đã gom (debounce) ở phía gọi. */
  markRead: (channelId: string) => void
}

export function handleMessageNew(ctx: ChatRealtimeContext, envelope: RealtimeEnvelope): void {
  const myId = ctx.getMyId()
  if (!myId) return
  if (!isMessageResponse(envelope.data)) {
    console.warn('[chat] MESSAGE_NEW sai định dạng, bỏ qua')
    return
  }
  const qc = ctx.queryClient
  const message = toChatMessage(envelope.data)
  const messagesKey = queryKeys.chat.messages(message.channelId)

  // Đã có (kết quả REST gửi tin của chính mình, hoặc event lặp) → không làm gì thêm, kể cả unread
  if (hasMessage(qc.getQueryData<MessagesCache>(messagesKey), message.id)) return
  qc.setQueryData<MessagesCache>(messagesKey, (old) => upsertMessage(old, message))

  const fromPartner = message.senderId !== myId
  const isActive = ctx.getActiveChannelId() === message.channelId
  const countUnread = fromPartner && !isActive

  const threads = qc.getQueryData<ChatThread[]>(queryKeys.chat.channels)
  const bumped = threads
    ? bumpThread(threads, {
        channelId: message.channelId,
        preview: previewOf(message),
        sentAt: message.sentAt,
        countUnread,
      })
    : undefined
  if (bumped?.found) qc.setQueryData(queryKeys.chat.channels, bumped.threads)
  else void qc.invalidateQueries({ queryKey: queryKeys.chat.channels }) // channel mới chưa có trong cache

  if (countUnread) qc.setQueryData<number>(queryKeys.chat.unread, incrementCount)
  if (fromPartner && isActive) ctx.markRead(message.channelId)
}

export function handleMessageRead(ctx: ChatRealtimeContext, envelope: RealtimeEnvelope): void {
  const myId = ctx.getMyId()
  if (!myId) return
  if (!isMessageReadReceipt(envelope.data)) {
    console.warn('[chat] MESSAGE_READ sai định dạng, bỏ qua')
    return
  }
  const { channelId, readerId, readAt } = envelope.data
  if (readerId === myId) return // chỉ quan tâm đối phương đã đọc tin của mình
  ctx.queryClient.setQueryData<MessagesCache>(queryKeys.chat.messages(channelId), (old) =>
    markMineRead(old, myId, readAt),
  )
}

/** Event không được replay: sau mỗi lần reconnect phải đồng bộ lại những gì có thể đã lỡ. */
export function syncChatAfterReconnect(ctx: ChatRealtimeContext): void {
  const qc = ctx.queryClient
  void qc.invalidateQueries({ queryKey: queryKeys.chat.channels })
  void qc.invalidateQueries({ queryKey: queryKeys.chat.unread })
  const active = ctx.getActiveChannelId()
  if (active) {
    void qc.invalidateQueries({ queryKey: queryKeys.chat.messages(active) })
    ctx.markRead(active)
  }
}

export function registerChatRealtimeHandlers(router: RealtimeEventRouter, ctx: ChatRealtimeContext): Unsubscribe {
  const offNew = router.register(MESSAGE_NEW, (e) => handleMessageNew(ctx, e))
  const offRead = router.register(MESSAGE_READ, (e) => handleMessageRead(ctx, e))
  return () => {
    offNew()
    offRead()
  }
}

