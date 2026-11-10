import type {
  BudgetUnit,
  EducationLevel,
  PostStatus,
  PostType,
  Role,
  TeachingMode,
} from "@/shared/types/common.types";

/** BE: post/dto/request/AddressRequest.java — cả 3 field bắt buộc (khác AddressRequest của user) */
export interface PostAddressRequest {
  street: string;
  ward: string;
  province: string;
}
/** BE: post/dto/response/AddressResponse.java */
export interface PostAddressResponse {
  street: string;
  ward: string;
  province: string;
}

/** BE: post/dto/response/SubjectSummaryResponse.java */
export interface SubjectSummaryResponse {
  id: string;
  name: string;
}

/** BE: post/dto/response/AuthorResponse.java */
export interface AuthorResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
}

/** BE: post/dto/request/CreatePostRequest.java */
export interface CreatePostRequest {
  title: string; // <= 255
  content: string; // <= 5000
  budgetUnit?: BudgetUnit;
  type: PostType;
  subjectId: string;
  educationLevel: EducationLevel;
  teachingMode: TeachingMode;
  status?: PostStatus; // mặc định PUBLISHED, không cho DRAFT
  address?: PostAddressRequest; // bắt buộc khi OFFLINE hoặc BOTH
  minBudget?: number;
  maxBudget?: number;
  sessionsPerWeek?: number; // >= 1
  durationMinutes?: number; // >= 15
  deadline?: string; // ISO Instant, phải ở tương lai
}

/** BE: post/dto/request/UpdatePostRequest.java — chỉ title bắt buộc */
export interface UpdatePostRequest {
  title: string;
  content?: string;
  budgetUnit?: BudgetUnit;
  type?: PostType;
  subjectId?: string;
  educationLevel?: EducationLevel;
  teachingMode?: TeachingMode;
  address?: PostAddressRequest;
  minBudget?: number;
  maxBudget?: number;
  sessionsPerWeek?: number;
  durationMinutes?: number;
  deadline?: string;
  status?: PostStatus;
}

/** BE: post/dto/request/RemovePostRequest.java */
export interface RemovePostRequest {
  reason?: string;
}

/** BE: post/dto/response/PostResponse.java */
export interface PostResponse {
  id: string;
  title: string;
  content?: string;
  type: PostType;
  status: PostStatus;
  subject: SubjectSummaryResponse;
  educationLevel?: EducationLevel;
  teachingMode: TeachingMode;
  address?: PostAddressResponse;
  minBudget?: number;
  maxBudget?: number;
  budgetUnit?: BudgetUnit;
  sessionsPerWeek?: number;
  durationMinutes?: number;
  deadline?: string;
  author: AuthorResponse;
  createdAt: string;
  updatedAt?: string;
}

/** BE: post/dto/response/PostApplicationResponse.java */
export interface PostApplicationResponse {
  applicationId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  status: string;
  appliedAt: string;
}

/** BE: post/dto/response/PostStatisticsByStatus.java */
export interface PostStatisticsByStatus {
  status: PostStatus;
  count: number;
}
