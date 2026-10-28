import type {
  AccountStatus,
  ApplicationStatus,
  EducationLevel,
  PostStatus,
  PostType,
  ProfileStatus,
  TeachingMode,
  TransactionStatus,
} from '@/shared/types/common.types'

export type BadgeTone = 'gray' | 'darkGray' | 'green' | 'red' | 'yellow' | 'blue' | 'orange'

export const POST_STATUS_META: Record<PostStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Bản nháp', tone: 'gray' },
  PUBLISHED: { label: 'Đang tuyển', tone: 'green' },
  CLOSED: { label: 'Đã đủ', tone: 'red' },
  REMOVED: { label: 'Đã gỡ', tone: 'darkGray' },
}

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Chờ xử lý', tone: 'yellow' },
  ACCEPTED: { label: 'Được chọn', tone: 'green' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
  CANCELLED: { label: 'Đã hủy', tone: 'gray' },
}

export const PROFILE_STATUS_META: Record<ProfileStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'yellow' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
}

export const TRANSACTION_STATUS_META: Record<TransactionStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Đang xử lý', tone: 'yellow' },
  SUCCESS: { label: 'Thành công', tone: 'green' },
  FAILED: { label: 'Thất bại', tone: 'red' },
  CANCELLED: { label: 'Đã hủy', tone: 'gray' },
}

export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  INACTIVE: { label: 'Tạm khóa', tone: 'yellow' },
  BANNED: { label: 'Bị cấm', tone: 'red' },
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  FIND_TUTOR: 'Tìm gia sư',
  FIND_STUDENT: 'Tìm học viên',
}

export const TEACHING_MODE_LABEL: Record<TeachingMode, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Tại nhà',
  BOTH: 'Online & Tại nhà',
}

export const EDUCATION_LEVEL_LABEL: Record<EducationLevel, string> = {
  PRIMARY: 'Tiểu học',
  SECONDARY: 'THCS',
  HIGH_SCHOOL: 'THPT',
  UNIVERSITY: 'Đại học',
}

export const EDUCATION_LEVELS: EducationLevel[] = ['PRIMARY', 'SECONDARY', 'HIGH_SCHOOL', 'UNIVERSITY']
export const TEACHING_MODES: TeachingMode[] = ['ONLINE', 'OFFLINE', 'BOTH']

export const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'] as const

export const DAY_LABEL: Record<string, string> = {
  MON: 'Thứ 2',
  TUE: 'Thứ 3',
  WED: 'Thứ 4',
  THU: 'Thứ 5',
  FRI: 'Thứ 6',
  SAT: 'Thứ 7',
  SUN: 'Chủ nhật',
}

export const PAYMENT_WINDOW_HOURS = 24
