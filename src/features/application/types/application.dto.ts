// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.

import type { MatchWarning } from "@/shared/types/common.types";
import type { TutorMatchScore } from "@/features/ai/types/ai.dto";

/** BE có bản trùng tên, cùng shape; dùng chung một định nghĩa. */
export type { TutorMatchScore };

/** Projection nội bộ của BE — không đi qua API, giữ lại để FE có đủ DTO. */
/** BE: application/dto/projection/ReviewCountRow.java */
export interface ReviewCountRow {
  tutorId: string;
  cnt: number;
}

/** BE: application/dto/request/CreateApplicationRequest.java */
export interface CreateApplicationRequest {
  postId: string;
  message?: string;
  proposedFee: number;
}

/** BE: application/dto/response/ApplicationResponse.java */
export interface UserSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface ApplicationResponse {
  id: string;
  postId: string;
  student: UserSummary;
  tutor: UserSummary;
  applicationStatus: string;
  proposedFee?: number;
  message?: string;
  appliedAt: string;
  processedByAdminId?: string;
  transactionId?: string;
}
/** BE: application/dto/response/MatchBreakdown.java */
export interface MatchBreakdown {
  /** 0..1 */
  price: number;
  /** 0..1 */
  rating: number;
  /** 0..1 */
  experience: number;
  experienceYears: number;
  semantic?: number;
}

/** BE: application/dto/response/RankedApplicationsResponse.java */
export interface RankedApplicationsResponse {
  /** true: > 5 ứng viên và đã chấm điểm */
  ranked: boolean;
  /** tối đa 5 gia sư phù hợp nhất */
  top: ScoredApplicationResponse[];
  /** phần còn lại, sắp theo điểm giảm dần */
  others: ScoredApplicationResponse[];
}

/** BE: application/dto/response/ScoredApplicationResponse.java */
export interface ScoredApplicationResponse {
  application?: ApplicationResponse;
  score?: number;
  breakdown?: Record<string, number>;
  warnings?: MatchWarning[];
}
