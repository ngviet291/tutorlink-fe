// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { BudgetUnit, EducationLevel, PostStatus, PostType, TeachingMode } from '@/shared/types/common.types'
import type { AddressRequest, AddressResponse } from '@/features/user/types/user.dto'

/** BE có bản trùng tên, cùng shape; dùng chung một định nghĩa. */
export type { AddressRequest }
/** BE có bản trùng tên, cùng shape; dùng chung một định nghĩa. */
export type { AddressResponse }

/** BE: post/dto/request/CreatePostRequest.java */
export interface CreatePostRequest {
  title: string
  content: string
  budgetUnit?: BudgetUnit
  type: PostType
  subjectId: string
  educationLevel: EducationLevel
  teachingMode: TeachingMode
  status?: PostStatus
  address?: AddressRequest
  minBudget?: number
  maxBudget?: number
  sessionsPerWeek?: number
  durationMinutes?: number
  deadline?: string
}

/** BE: post/dto/request/UpdatePostRequest.java */
export interface UpdatePostRequest {
  title: string
  content?: string
  budgetUnit?: BudgetUnit
  type?: PostType
  subjectId?: string
  educationLevel?: EducationLevel
  teachingMode?: TeachingMode
  address?: AddressRequest
  minBudget?: number
  maxBudget?: number
  sessionsPerWeek?: number
  durationMinutes?: number
  deadline?: string
  status?: PostStatus
}

/** BE: post/dto/response/AuthorResponse.java */
export interface AuthorResponse {
  id: string
  email: string
}

/** BE: post/dto/response/PostApplicationResponse.java */
export interface PostApplicationResponse {
  applicationId: string
  userId: string
  fullName: string
  email: string
  avatarUrl?: string
  status: string
  appliedAt: string
}

/** BE: post/dto/response/PostResponse.java */
export interface PostResponse {
  id: string
  title: string
  content: string
  type: PostType
  status: PostStatus
  subject: SubjectSummaryResponse
  educationLevel: EducationLevel
  teachingMode: TeachingMode
  address?: AddressResponse
  minBudget: number
  maxBudget: number
  sessionsPerWeek?: number
  durationMinutes?: number
  deadline: string
  author: AuthorResponse
  createdAt: string
  updatedAt: string
}

/** BE: post/dto/response/PostStatisticsByStatus.java */
export interface PostStatisticsByStatus {
  status: PostStatus
  count?: number
}

/** BE: post/dto/response/SubjectSummaryResponse.java */
export interface SubjectSummaryResponse {
  id: string
  name: string
}
