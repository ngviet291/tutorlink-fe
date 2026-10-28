import type {
  EducationLevel,
  ProfileStatus,
  TeachingMode,
} from '@/shared/types/common.types'
import type { ContactInfo } from '@/features/user/types/user.types'

export interface Certificate {
  id: string
  name: string
  issuer: string
  year: number
}

export interface ScheduleSlot {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  from: string
  to: string
}

export interface TutorResponse {
  id: string
  fullName: string
  avatarUrl?: string
  bio?: string
  education?: string
  experienceYears: number
  hourlyRate: number
  averageRating: number
  reviewCount?: number
  profileStatus: ProfileStatus
  reviewNote?: string
  subjects: { id: string; name: string }[]
  certificates: Certificate[]
  teachingMode?: TeachingMode
  educationLevels?: EducationLevel[]
  city?: string
  district?: string
  schedule?: ScheduleSlot[]
  maskedPhone?: string
  /** Chỉ có sau khi kết nối thành công */
  contact?: ContactInfo
  createdAt?: string
}

export interface TutorFilter {
  keyword?: string
  subjectId?: string
  city?: string
  teachingMode?: TeachingMode | ''
  minRate?: number
  maxRate?: number
  educationLevels?: EducationLevel[]
  page?: number
  pageSize?: number
}

export interface TutorProfilePayload {
  subjectIds: string[]
  experienceYears: number
  education: string
  hourlyRate: number
  bio: string
  city: string
  district: string
  teachingMode: TeachingMode
  certificates: { name: string; issuer: string; year: number }[]
}
