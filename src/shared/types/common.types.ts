export type Role = 'STUDENT' | 'TUTOR' | 'ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'BANNED'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PostType = 'FIND_TUTOR' | 'FIND_STUDENT'
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'PAID' | 'FINISHED' | 'REJECTED' | 'CANCELLED'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type TransactionType = 'TOP_UP' | 'COMMISSION' | 'REFUND'
export type NotificationType = 'SYSTEM' | 'APPLICATION' | 'PAYMENT' | 'CHAT'
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'BOTH'
export type EducationLevel = 'PRIMARY' | 'SECONDARY' | 'HIGH_SCHOOL' | 'UNIVERSITY' | 'OTHER'
export type BudgetUnit = 'PER_HOUR' | 'PER_SESSION' | 'PER_MONTH'
export type PaymentMethod = 'BANK_TRANSFER' | 'WALLET' | 'MOMO' | 'ZALOPAY'

export interface Address {
  street?: string
  ward?: string
  province?: string
}

/** Tên cũ của UserStatus, giữ lại cho code admin. */
export type AccountStatus = UserStatus
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
