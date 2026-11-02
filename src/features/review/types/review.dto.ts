// AUTO-GENERATED từ DTO của BE (src/main/java/.../dto). Tên class + tên field giữ nguyên như BE.
// Quy ước: Instant/LocalDate/UUID → string, BigDecimal/Integer/long/double → number, `?` = BE có thể không trả / request không bắt buộc.


/**
 * BE enum `ComplaintStatus` (PENDING | APPROVED | REJECTED).
 * KHÁC với `ComplaintStatus` trong review.types.ts ('NONE' | 'OPEN' | 'RESOLVED') — đó là trạng thái hiển thị ở FE.
 */
export type ComplaintStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** BE: review/dto/request/CreateReviewComplaintRequest.java */
export interface CreateReviewComplaintRequest {
  reason: string
}

/** BE: review/dto/request/CreateReviewRequest.java */
export interface CreateReviewRequest {
  applicationId: string
  rating: number
  comment?: string
}

/** BE: review/dto/request/ResolveReviewComplaintRequest.java */
export interface ResolveReviewComplaintRequest {
  status: ComplaintStatus
}

/** BE: review/dto/response/ReviewComplaintResponse.java */
export interface ReviewComplaintResponse {
  id: string
  reason: string
  status: ComplaintStatus
  reviewId: string
  tutorId: string
  adminId?: string
}

/** BE: review/dto/response/ReviewResponse.java */
export interface ReviewResponse {
  id: string
  applicationId: string
  studentId: string
  tutorId: string
  rating: number
  comment?: string
  createdAt: string
}
