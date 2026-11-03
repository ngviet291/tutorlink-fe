import type {
  Address,
  BudgetUnit,
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
  postStatus: PostStatus
  author: AuthorResponse
  subject: SubjectSummaryResponse
  educationLevel: EducationLevel
  teachingMode: TeachingMode
  address: Address
  minBudget: number
  maxBudget: number
  budgetUnit?: BudgetUnit
  sessionsPerWeek: number
  durationMinutes: number
  deadline: string
  createdAt: string
  applicationCount?: number
  matchedApplicationId?: string

}

export interface PostFilter {
  keyword?: string
  type?: PostType
  subjectId?: string
  province?: string
  teachingMode?: TeachingMode | ''
  educationLevels?: EducationLevel[]
  minBudget?: number
  maxBudget?: number
  postStatus?: PostStatus | ''
  cursor?: string
  limit?: number
}

export interface AdminPostFilter {
  keyword?: string
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
  address: Address
  minBudget: number
  maxBudget: number
  budgetUnit?: BudgetUnit
  sessionsPerWeek: number
  durationMinutes: number
  deadline: string
}
