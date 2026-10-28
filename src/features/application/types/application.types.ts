import type { ApplicationStatus } from '@/shared/types/common.types'
import type { PostResponse } from '@/features/post/types/post.types'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'
import type { StudentSummary } from '@/features/user/types/user.types'

export interface ApplicationResponse {
  id: string
  post: PostResponse
  applicant: TutorResponse | StudentSummary
  status: ApplicationStatus
  message?: string
  createdAt: string
  aiScore?: number
  aiReason?: string
  aiRank?: number
  payDeadline?: string
  /** true khi người đăng bài đã chọn nhưng chưa thanh toán xong */
  awaitingPayment?: boolean
  /** true khi đã thanh toán phí nhận lớp thành công → mở khóa liên hệ + chat */
  paid?: boolean
}

export interface AiSuggestionResponse {
  items: ApplicationResponse[]
  source: 'AI' | 'RULE_BASED'
}

export interface ApplyPayload {
  postId: string
  message?: string
}

export function isTutorApplicant(
  applicant: TutorResponse | StudentSummary,
): applicant is TutorResponse {
  return 'hourlyRate' in applicant
}
