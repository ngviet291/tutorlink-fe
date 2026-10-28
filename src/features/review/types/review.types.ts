import type { StudentSummary } from '@/features/user/types/user.types'

export type ComplaintStatus = 'NONE' | 'OPEN' | 'RESOLVED'

export interface ReviewResponse {
  id: string
  tutorId: string
  rating: number
  comment: string
  student: StudentSummary
  createdAt?: string
  complaintStatus?: ComplaintStatus
  /** Lý do khiếu nại của gia sư */
  complaintReason?: string
  /** Kết quả xử lý: giữ hay gỡ */
  complaintDecision?: 'KEPT' | 'REMOVED'
  complaintDecisionNote?: string
}

export interface ReviewPayload {
  applicationId: string
  rating: number
  comment: string
}
