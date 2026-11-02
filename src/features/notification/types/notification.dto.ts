// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { NotificationType } from '@/shared/types/common.types'

/** BE: notification/dto/response/NotificationResponse.java */
export interface NotificationResponse {
  id: string
  title: string
  content: string
  notificationType: NotificationType
  /** BE field `isRead` (boolean) → Jackson/Lombok serialize thành `read`. */
  read: boolean
  createdAt: string
}
