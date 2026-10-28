import type { ContactInfo } from '@/features/user/types/user.types'

export interface ChatMessage {
  id: string
  applicationId: string
  senderId: string
  content: string
  createdAt: string
}

export interface ChatRoom {
  applicationId: string
  /** false → hiển thị ContactUnlockBox, không cho chat */
  unlocked: boolean
  partnerName: string
  partnerAvatarUrl?: string
  contact?: ContactInfo
  messages: ChatMessage[]
}
