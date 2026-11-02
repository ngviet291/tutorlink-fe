export type Role = 'STUDENT' | 'TUTOR' | 'ADMIN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'BANNED'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PostType = 'FIND_TUTOR' | 'FIND_STUDENT'
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REMOVED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'PAID' | 'FINISHED' | 'REJECTED' | 'CANCELLED'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type TransactionType = 'TOP_UP' | 'COMMISSION' | 'REFUND'
/** Giá trị của BE: SYSTEM, APPLICATION, TRANSACTION, MESSAGE, REVIEW, POST, MATCHING. PAYMENT/CHAT là tên cũ của FE (mock), giữ lại để không vỡ code cũ. */
export type NotificationType =
  | 'SYSTEM' | 'APPLICATION' | 'TRANSACTION' | 'MESSAGE' | 'REVIEW' | 'POST' | 'MATCHING'
  | 'PAYMENT' | 'CHAT'
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

/** Enum của BE chưa có ở FE trước đây */
export type MediaType = 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO'
export type MatchWarning =
  | 'SUBJECT_MISMATCH' | 'LEVEL_MISMATCH' | 'MODE_MISMATCH' | 'AREA_MISMATCH' | 'AVAILABILITY_MISMATCH'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TimeDetail = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
