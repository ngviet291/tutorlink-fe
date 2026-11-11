import type { InfiniteData } from '@tanstack/react-query'
import type { ChatMessage, ChatThread, MessagePage } from './types/chat.types'

export const msg = (id: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  channelId: 'c1',
  senderId: 'partner',
  content: `content ${id}`,
  sentAt: '2026-01-01T10:00:00.000Z',
  media: [],
  status: 'sent',
  ...over,
})

/** Các trang nhận vào theo thứ tự mới → cũ (trang đầu là mới nhất). */
export const cache = (...pages: ChatMessage[][]): InfiniteData<MessagePage, string | undefined> => ({
  pages: pages.map((messages, i) => ({
    messages,
    hasNext: i < pages.length - 1,
    nextCursor: i < pages.length - 1 ? messages[messages.length - 1]?.id : undefined,
  })),
  pageParams: pages.map((_, i) => (i === 0 ? undefined : `p${i}`)),
})

export const ids = (data: InfiniteData<MessagePage, string | undefined> | undefined): string[] =>
  data?.pages.flatMap((p) => p.messages.map((m) => m.id)) ?? []

export const thread = (channelId: string, over: Partial<ChatThread> = {}): ChatThread => ({
  channelId,
  partner: { id: `p-${channelId}`, fullName: `Partner ${channelId}` },
  unreadCount: 0,
  ...over,
})
