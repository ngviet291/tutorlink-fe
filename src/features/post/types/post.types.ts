import type {
  Address,
  EducationLevel,
  PostStatus,
  PostType,
  TeachingMode,
} from '@/shared/types/common.types'
import type { AuthorResponse } from '@/features/user/types/user.types'
import type { SubjectSummaryResponse } from '@/features/subject/types/subject.types'

export interface PostResponse {
  id: string
  title: string
  content: string
  type: PostType
  status: PostStatus
  author: AuthorResponse
  subject: SubjectSummaryResponse
  educationLevel: EducationLevel
  teachingMode: TeachingMode
  address: Address
  minBudget: number
  maxBudget: number
  sessionsPerWeek: number
  durationMinutes: number
  deadline: string
  createdAt: string
  applicationCount?: number
  /** Số lượng gia sư/học viên đã được ghép cặp (dùng cho lịch sử) */
  matchedApplicationId?: string
}

export interface PostFilter {
  keyword?: string
  type?: PostType
  subjectId?: string
  city?: string
  teachingMode?: TeachingMode | ''
  educationLevels?: EducationLevel[]
  minBudget?: number
  maxBudget?: number
  status?: PostStatus | ''
  page?: number
  pageSize?: number
}

export interface PostPayload {
  type: PostType
  title: string
  content: string
  subjectId: string
  educationLevel: EducationLevel
  teachingMode: TeachingMode
  city: string
  district: string
  detail?: string
  minBudget: number
  maxBudget: number
  sessionsPerWeek: number
  durationMinutes: number
  deadline: string
}
