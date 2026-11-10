import type { ApplicationStatus } from "@/shared/types/common.types";
import type { PostResponse } from "@/features/post/types/post.types";
import type {
  BaseUserResponse,
  StudentResponse,
} from "@/features/user/types/user.types";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";

/**
 * UI model. Không phải DTO của BE.
 * DTO thật của BE nằm ở application.dto.ts và chỉ chứa postId/studentId/tutorId.
 * Service sẽ map DTO -> model này để các component không phải biết cấu trúc API.
 */
export interface ApplicationResponse {
  id: string;
  post: PostResponse;
  tutor: TutorResponse;
  student: StudentResponse;
  applicationStatus: ApplicationStatus | string;
  message?: string;
  proposedFee?: number;
  appliedAt: string;
  processedByAdminId?: string;
  transactionId?: string;
  paid?: boolean;
  awaitingPayment?: boolean;
  aiRank?: number;
  aiScore?: number;
  aiReason?: string;
}

/** Dữ liệu applicant BE trả trực tiếp từ GET /v1/posts/{postId}/applications. */
export interface PostApplicationItem {
  applicationId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  status: string;
  appliedAt: string;
}

export type AiRankedApplication = ApplicationResponse & {
  aiRank: number;
  aiScore?: number;
  aiReason?: string;
};

export interface AiSuggestionResponse {
  items: AiRankedApplication[];
  source?: "AI" | "RULE_BASED";
}

export interface ApplyPayload {
  postId: string;
  message?: string;
  proposedFee: number;
}

/** Minimal user được lấy từ public-profile để ghép Application DTO. */
export type ApplicationUser = BaseUserResponse;
