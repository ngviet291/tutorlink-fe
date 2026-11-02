import type { Address, Gender, Role, UserStatus } from '@/shared/types/common.types'

export interface BaseUserResponse {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  gender: Gender
  dateOfBirth: string
  address: Address
  userStatus: UserStatus
  role: Role
  createdAt?: string
}

export interface StudentSummary {
  id: string
  fullName: string
  avatarUrl?: string
}

export interface StudentResponse extends BaseUserResponse {
  grade?: string
  learningGoal?: string
}

export interface TutorUserResponse extends BaseUserResponse {
  bio?: string
  education?: string
  experienceYears?: number
  hourlyRate?: number
}

export type AuthUser = BaseUserResponse

export interface ContactInfo {
  phone: string
  email: string
}

export interface AuthorResponse {
  id: string
  fullName: string
  avatarUrl?: string
  role: Role
  /** Chỉ có sau khi kết nối thành công */
  contact?: ContactInfo
}

export interface UpdateProfilePayload {
  fullName: string
  phone: string
  gender: Gender
  dateOfBirth: string
  address: Address
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
