import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { ChatMessage, ChatRoom } from '../types/chat.types'
import { applications, chatMessages, contacts, nextId, notifications } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

export const chatService = {
  /** Chưa thanh toán → unlocked=false, không trả liên hệ và tin nhắn. */
  async getRoom(applicationId: string): Promise<ChatRoom> {
    if (USE_MOCK) {
      await delay(250)
      const me = requireUser()
      const a = applications.find((x) => x.id === applicationId)
      if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      const isParty = a.post.author.id === me.id || a.applicant.id === me.id
      if (!isParty && me.role !== 'ADMIN') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      const partnerId = a.post.author.id === me.id ? a.applicant.id : a.post.author.id
      const partnerName = a.post.author.id === me.id ? a.applicant.fullName : a.post.author.fullName
      if (!a.paid) return { applicationId, unlocked: false, partnerName, messages: [] }
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
      if (!a?.paid) throw new ApiError('Kênh chat chỉ mở sau khi thanh toán phí nhận lớp.', 'CHAT_LOCKED', 403)
      const msg: ChatMessage = { id: nextId('m'), applicationId, senderId: me.id, content, createdAt: new Date().toISOString() }
      chatMessages.push(msg)
      const partnerId = a.post.author.id === me.id ? a.applicant.id : a.post.author.id
      notifications[partnerId] = [
        { id: nextId('n'), type: 'NEW_MESSAGE', title: 'Tin nhắn mới', body: `${me.fullName}: ${content.slice(0, 60)}`, read: false, createdAt: msg.createdAt, link: `/chat/${applicationId}` },
        ...(notifications[partnerId] ?? []),
      ]
      return msg
    }
    return http.post<ChatMessage>(`/v1/chat/${applicationId}/messages`, { content }) // TODO: nối API
  },
}
