import type { ApplicationStatus } from '@/shared/types/common.types'
import type { PostResponse } from '@/features/post/types/post.types'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'
import type { StudentResponse } from '@/features/user/types/user.types'

export interface ApplicationResponse {
  id: string
  post: PostResponse
  tutor: TutorResponse
  student: StudentResponse
  applicationStatus: ApplicationStatus
  message?: string
  /** Mức phí/học phí gia sư đề xuất (VND) */
  proposedFee?: number
  appliedAt: string
  /** true khi applicationStatus === 'PAID' — tiện cho logic UI */
  paid?: boolean
  /** Gia sư được chọn nhưng chưa thanh toán phí */
  awaitingPayment?: boolean
  /** Do AI/rule-based gợi ý (Top 5) */
  aiRank?: number
  aiScore?: number
  aiReason?: string
}

export interface AiSuggestionResponse {
  items: ApplicationResponse[]
  source: 'AI' | 'RULE_BASED'
}

export interface ApplyPayload {
  postId: string
  message?: string
  proposedFee: number
}
