import type { NotificationType } from '@/shared/types/common.types'

export interface NotificationResponse {
  id: string
  title: string
  content: string
  notificationType: NotificationType
  isRead: boolean
  createdAt: string
}

export { type NotificationType }
