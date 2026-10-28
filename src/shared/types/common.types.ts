export type Role = 'GUEST' | 'STUDENT' | 'TUTOR' | 'ADMIN'
export type PostType = 'FIND_TUTOR' | 'FIND_STUDENT'
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type ProfileStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'BOTH'
export type EducationLevel = 'PRIMARY' | 'SECONDARY' | 'HIGH_SCHOOL' | 'UNIVERSITY'

export interface Address {
  city: string
  district: string
  detail?: string
}
