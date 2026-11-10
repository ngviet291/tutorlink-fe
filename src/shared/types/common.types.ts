export type Role = "STUDENT" | "TUTOR" | "ADMIN";
export type Gender = "MALE" | "FEMALE" ;
export type UserStatus = "ACTIVE" | "BANNED"|"INACTIVE" | "PENDING_VERIFICATION";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PostType = "FIND_TUTOR" | "FIND_STUDENT";
export type PostStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "REMOVED";
export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "CONFIRMED"
  | "FINISHED";
export type TransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";
export type TransactionType = "TOP_UP" | "COMMISSION" | "REFUND";
export type NotificationType = "SYSTEM" | "APPLICATION" | "PAYMENT" | "CHAT" | "TRANSACTION" | "MESSAGE" | "REVIEW" | "POST" | "MATCHING";
export type TeachingMode = "ONLINE" | "OFFLINE" | "BOTH";
export type EducationLevel =
  | "PRIMARY"
  | "SECONDARY"
  | "HIGH_SCHOOL"
  | "UNIVERSITY"
  | "OTHER";
export type BudgetUnit = "PER_SESSION" | "PER_MONTH" | "PER_HOUR";

export interface Address {
  street?: string;
  ward?: string;
  province?: string;
}

export type PaymentMethod = "BANK_TRANSFER" | "WALLET" | "MOMO" | "ZALOPAY";

/** Tên cũ của UserStatus, giữ lại cho code admin. */
export type AccountStatus = UserStatus;
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type MediaType = "IMAGE" | "VIDEO" | "FILE" | "AUDIO";
export type MatchWarning =
  | "SUBJECT_MISMATCH"
  | "LEVEL_MISMATCH"
  | "MODE_MISMATCH"
  | "AREA_MISMATCH"
  | "AVAILABILITY_MISMATCH";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TimeDetail = "DAY" | "WEEK" | "MONTH" | "YEAR";
