import type {
  Address,
  BudgetUnit,
  EducationLevel,
  PostStatus,
  PostType,
  TeachingMode,
} from "@/shared/types/common.types";
import type { AuthorResponse } from "@/features/user/types/user.types";
import type { SubjectSummaryResponse } from "@/features/subject/types/subject.types";

/**
 * Response của BE (PostResponse.java).
 *
 * Lưu ý: BE trả `status` (không phải `postStatus`).
 * Trong FE vẫn dùng `postStatus` để không đổi toàn bộ component — service sẽ map khi nhận.
 */
export interface PostResponse {
  id: string;
  title: string;
  content: string;
  type: PostType;
  status: PostStatus;
  author: AuthorResponse;
  subject: SubjectSummaryResponse;
  educationLevel: EducationLevel;
  teachingMode: TeachingMode;
  address: Address | null;
  minBudget: number;
  maxBudget: number;
  budgetUnit?: BudgetUnit;
  sessionsPerWeek: number;
  durationMinutes: number;
  deadline: string;
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;
  matchedApplicationId?: string;
}
export interface AdminPostFilter {
  status?: PostStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
export interface PostFilter {
  keyword?: string;
  type?: PostType;
  subjectName?: string; // BE nhận subjectName (tên môn), không phải subjectId
  province?: string;
  teachingMode?: TeachingMode | "";
  educationLevel?: EducationLevel | ""; // BE nhận single value
  minBudget?: number;
  maxBudget?: number;
  cursor?: string;
  limit?: number;
}

export interface PostPayload {
  type: PostType;
  title: string;
  content: string;
  subjectId: string;
  educationLevel: EducationLevel;
  teachingMode: TeachingMode;
  address: Address;
  minBudget: number;
  maxBudget: number;
  budgetUnit?: BudgetUnit;
  sessionsPerWeek: number;
  durationMinutes: number;
  deadline: string;
}
