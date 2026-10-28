import type { AccountStatus, Address, Role } from '@/shared/types/common.types'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string
  role: Role
  avatarUrl?: string
  address?: Address
  status: AccountStatus
  /** Chỉ có với gia sư: trạng thái duyệt hồ sơ */
  profileStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface ContactInfo {
  phone: string
  email: string
}

export interface AuthorResponse {
  id: string
  fullName: string
  avatarUrl?: string
  role: Role
  /** Luôn là dạng đã mask khi chưa mở khóa, ví dụ 09xx xxx xxx */
  maskedPhone: string
  contact?: ContactInfo
}

export interface StudentSummary {
  id: string
  fullName: string
  avatarUrl?: string
  educationLevel?: string
  city?: string
  contact?: ContactInfo
}

export interface UserAdminRow extends AuthUser {
  createdAt: string
}

export interface UpdateProfilePayload {
  fullName: string
  phone: string
  city: string
  district: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
