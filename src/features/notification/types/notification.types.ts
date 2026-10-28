export type NotificationType =
  | 'REGISTERED'
  | 'POST_PUBLISHED'
  | 'PROFILE_REVIEWED'
  | 'NEW_APPLICATION'
  | 'SELECTED'
  | 'PAYMENT_SUCCESS'
  | 'NEW_MESSAGE'

export interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
  link?: string
}
