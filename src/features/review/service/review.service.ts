import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { ReviewComplaintResponse, ReviewResponse as ReviewDto } from "../types/review.dto";
import type { ReviewPayload, ReviewResponse } from "../types/review.types";

// BE: NONE/PENDING/APPROVED/REJECTED -> FE: NONE/OPEN/RESOLVED
function toComplaintStatus(s?: string): "NONE" | "OPEN" | "RESOLVED" {
  if (!s || s === "NONE") return "NONE";
  if (s === "PENDING") return "OPEN";
  return "RESOLVED";
}

export const reviewService = {
  async getReviewsByTutor(tutorId: string): Promise<ReviewResponse[]> {
    const page = await http
      .get<CursorResponse<ReviewDto>>("/v1/reviews", {
        params: { tutorId, limit: 100 },
      })
      .then((res) => res.data);

    // BE trả sẵn studentName — không fetch public-profile từng review (1 request lỗi làm hỏng cả list)
    return page.content.map((r) => ({
      id: r.id,
      applicationId: r.applicationId,
      tutorId: r.tutorId,
      rating: r.rating,
      comment: r.comment ?? "",
      student: { id: r.studentId, fullName: r.studentName ?? "" },
      createdAt: r.createdAt,
      complaintStatus: toComplaintStatus(r.complaintStatus),
    }));
  },

  /** Học viên đánh giá gia sư sau khi lớp kết nối (đã thanh toán). Mỗi lớp 1 đánh giá. */
  async createReview(payload: ReviewPayload): Promise<ReviewResponse> {
    return http
      .post<ReviewResponse>("/v1/reviews", payload)
      .then((res) => res.data);
  },

  /** Lớp này đã được đánh giá chưa. */
  async hasReviewed(applicationId: string): Promise<boolean> {
    return http
      .get<boolean>("/v1/reviews/exists", { params: { applicationId } })
      .then((res) => res.data);
  },

  /** Gia sư khiếu nại một đánh giá để Admin xem xét. */
  async submitComplaint(
    reviewId: string,
    reason: string,
  ): Promise<ReviewComplaintResponse> {
    return http
      .post<ReviewComplaintResponse>(`/v1/reviews/${reviewId}/complaints`, { reason })
      .then((res) => res.data);
  },

  /** Chi tiết 1 đánh giá (admin xem khiếu nại). */
  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    return http
      .get<ReviewDto>(`/v1/reviews/${reviewId}`)
      .then((res) => ({
        id: res.data.id,
        applicationId: res.data.applicationId,
        tutorId: res.data.tutorId,
        rating: res.data.rating,
        comment: res.data.comment ?? "",
        student: { id: res.data.studentId, fullName: res.data.studentName ?? "" },
        createdAt: res.data.createdAt,
        complaintStatus: toComplaintStatus(res.data.complaintStatus),
      }));
  },
};
