import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import type { NotificationResponse } from '../types/notification.types'
import { notifications } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse[]> {
    if (USE_MOCK) {
      await delay(200)
      const me = requireUser()
      return [...(notifications[me.id] ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    }
    return http.get<NotificationResponse[]>('/v1/notifications') // TODO: nối API
  },

  async markRead(id: string): Promise<void> {
    if (USE_MOCK) {
      const me = requireUser()
      const n = notifications[me.id]?.find((x) => x.id === id)
      if (n) n.read = true
      return
    }
    await http.put<void>(`/v1/notifications/${id}/read`) // TODO: nối API
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) {
      const me = requireUser()
      notifications[me.id]?.forEach((n) => (n.read = true))
      return
    }
    await http.put<void>('/v1/notifications/read-all') // TODO: nối API
  },
}
