import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { ChatMessage, ChatRoom, ChatThread } from '../types/chat.types'
import { applications, chatMessages, contacts, nextId, notifications } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

/** Mock: thời điểm đã đọc gần nhất của người dùng hiện tại ở mỗi cuộc trò chuyện. */
const lastRead: Record<string, string> = {}
const readKey = (userId: string, appId: string) => `${userId}:${appId}`

export const chatService = {
  /** Danh sách cuộc trò chuyện của tôi (mới nhất trước). */
  async getInbox(): Promise<ChatThread[]> {
    if (USE_MOCK) {
      await delay(200)
      const me = requireUser()
      return applications
        .filter((a) => (a.applicationStatus === 'PAID' || a.applicationStatus === 'FINISHED') && (a.post.author.id === me.id || a.tutor.id === me.id))
        .map((a): ChatThread => {
          const msgs = chatMessages.filter((m) => m.applicationId === a.id)
          const last = msgs[msgs.length - 1]
          const since = lastRead[readKey(me.id, a.id)] ?? ''
          const partner = a.post.author.id === me.id ? a.tutor : a.post.author
          return {
            id: a.id, partnerName: partner.fullName, partnerAvatarUrl: partner.avatarUrl,
            lastMessage: last?.content, lastMessageAt: last?.createdAt,
            unreadCount: msgs.filter((m) => m.senderId !== me.id && m.createdAt > since).length,
          }
        })
        .sort((x, y) => (y.lastMessageAt ?? '').localeCompare(x.lastMessageAt ?? ''))
    }
    // BE: GET /v1/chat/channels → { items: [{ id, lastMessageAt, partner: { id, fullName, avatarUrl } }] }
    const r = await http.get<{ items: { id: string; lastMessageAt?: string; partner: { fullName: string; avatarUrl?: string } }[] }>('/v1/chat/channels')
    return r.items.map((ch) => ({ id: ch.id, partnerName: ch.partner.fullName, partnerAvatarUrl: ch.partner.avatarUrl, lastMessageAt: ch.lastMessageAt, unreadCount: 0 }))
  },

  async getUnreadCount(): Promise<number> {
    if (USE_MOCK) return (await chatService.getInbox()).reduce((s, t) => s + t.unreadCount, 0)
    return http.get<number>('/v1/chat/unread-count')
  },

  /** Chưa thanh toán → unlocked=false, không trả liên hệ và tin nhắn. */
  async getRoom(applicationId: string): Promise<ChatRoom> {
    if (USE_MOCK) {
      await delay(250)
      const me = requireUser()
      const a = applications.find((x) => x.id === applicationId)
      if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      const isParty = a.post.author.id === me.id || a.tutor.id === me.id
      if (!isParty && me.role !== 'ADMIN') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      const partnerId = a.post.author.id === me.id ? a.tutor.id : a.post.author.id
      const partnerName = a.post.author.id === me.id ? a.tutor.fullName : a.post.author.fullName
      if (a.applicationStatus !== 'PAID' && a.applicationStatus !== 'FINISHED') return { applicationId, unlocked: false, partnerName, messages: [] }
      lastRead[readKey(me.id, applicationId)] = new Date().toISOString()
      return {
        applicationId, unlocked: true, partnerName, contact: contacts[partnerId],
        messages: chatMessages.filter((m) => m.applicationId === applicationId),
      }
    }
    return http.get<ChatRoom>(`/v1/chat/${applicationId}`) // TODO: nối API
  },

  async sendMessage(applicationId: string, content: string): Promise<ChatMessage> {
    if (USE_MOCK) {
      await delay(150)
      const me = requireUser()
      const a = applications.find((x) => x.id === applicationId)
      if (a?.applicationStatus !== 'PAID' && a?.applicationStatus !== 'FINISHED') throw new ApiError('Kênh chat chỉ mở sau khi thanh toán phí nhận lớp.', 'CHAT_LOCKED', 403)
      const msg: ChatMessage = { id: nextId('m'), applicationId, senderId: me.id, content, createdAt: new Date().toISOString() }
      chatMessages.push(msg)
      const partnerId = a.post.author.id === me.id ? a.tutor.id : a.post.author.id
      notifications[partnerId] = [
        { id: nextId('n'), notificationType: 'CHAT' as const, title: 'Tin nhắn mới', content: `${me.fullName}: ${content.slice(0, 60)}`, isRead: false, createdAt: msg.createdAt },
        ...(notifications[partnerId] ?? []),
      ]
      return msg
    }
    return http.post<ChatMessage>(`/v1/chat/${applicationId}/messages`, { content }) // TODO: nối API
  },
}
