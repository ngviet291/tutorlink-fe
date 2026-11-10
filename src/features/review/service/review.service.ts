import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
import type { ReviewComplaintResponse, ReviewResponse as ReviewDto } from "../types/review.dto";
import type { BaseUserResponse } from "@/features/user/types/user.dto";
import { mockConfig } from "@/config/env";
import { ApiError } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type { ReviewPayload, ReviewResponse } from "../types/review.types";
import {
  applications,
  nextId,
  reviews,
  studentSummary,
  tutors,
} from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";

const USE_MOCK = mockConfig.review;

export function recomputeRating(tutorId: string): void {
  const t = tutors.find((x) => x.id === tutorId);
  if (!t) return;
  const list = reviews.filter((r) => r.tutorId === tutorId);
  t.reviewCount = list.length;
  t.averageRating = list.length
    ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) /
      10
    : 0;
}

export const reviewService = {
  async getReviewsByTutor(tutorId: string): Promise<ReviewResponse[]> {
    if (USE_MOCK) {
      await delay(250);
      return reviews
        .filter((r) => r.tutorId === tutorId)
        .sort(
          (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
        );
    }
    const page = await http
      .get<CursorResponse<ReviewDto>>("/v1/reviews", {
        params: { tutorId, limit: 100 },
      })
      .then((res) => res.data);

    return Promise.all(
      page.content.map(async (r) => {
        const student = await http
          .get<BaseUserResponse>(`/v1/users/${r.studentId}/public-profile`)
          .then((res) => res.data);
        return {
          id: r.id,
          tutorId: r.tutorId,
          rating: r.rating,
          comment: r.comment ?? "",
          student: { id: student.id, fullName: student.fullName, avatarUrl: student.avatarUrl },
          createdAt: r.createdAt,
          complaintStatus: "NONE" as const,
        };
      }),
    );
  },

  /** Học viên đánh giá gia sư sau khi lớp kết nối (đã thanh toán). Mỗi lớp 1 đánh giá. */
  async createReview(payload: ReviewPayload): Promise<ReviewResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const a = applications.find((x) => x.id === payload.applicationId);
      if (
        !a ||
        (a.applicationStatus !== "PAID" && a.applicationStatus !== "FINISHED")
      )
        throw new ApiError(
          "Lớp chưa được kết nối nên chưa thể đánh giá.",
          "INVALID_STATE",
          409,
        );
      const studentId =
        a.post.type === "FIND_TUTOR" ? a.post.author.id : a.tutor.id;
      const tutorId =
        a.post.type === "FIND_TUTOR" ? a.tutor.id : a.post.author.id;
      if (studentId !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (reviews.some((r) => r.id.startsWith(`r-${a.id}`)))
        throw new ApiError(
          "Bạn đã đánh giá lớp này rồi.",
          "ALREADY_REVIEWED",
          409,
        );
      const review: ReviewResponse = {
        id: `r-${a.id}-${nextId("x")}`,
        tutorId,
        rating: payload.rating,
        comment: payload.comment,
        student: studentSummary(me.id),
        createdAt: new Date().toISOString(),
        complaintStatus: "NONE",
      };
      reviews.unshift(review);
      recomputeRating(tutorId);
      return review;
    }
    return http
      .post<ReviewResponse>("/v1/reviews", payload)
      .then((res) => res.data); // TODO: nối API
  },

  /** Lớp này đã được đánh giá chưa (mock). */
  async hasReviewed(applicationId: string): Promise<boolean> {
    if (USE_MOCK)
      return reviews.some((r) => r.id.startsWith(`r-${applicationId}-`));
    return http
      .get<boolean>("/v1/reviews/exists", { params: { applicationId } })
      .then((res) => res.data);
  },

  /** Gia sư khiếu nại một đánh giá để Admin xem xét. */
  async submitComplaint(
    reviewId: string,
    reason: string,
  ): Promise<ReviewComplaintResponse> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const r = reviews.find((x) => x.id === reviewId);
      if (!r) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (r.tutorId !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (r.complaintStatus && r.complaintStatus !== "NONE")
        throw new ApiError(
          "Đánh giá này đã được khiếu nại.",
          "ALREADY_COMPLAINED",
          409,
        );
      r.complaintStatus = "OPEN";
      r.complaintReason = reason;
      return {
        id: `cp-${r.id}`,
        reason,
        status: "PENDING" as const,
        reviewId: r.id,
        tutorId: r.tutorId,
      };
    }
    return http
      .post<ReviewComplaintResponse>(`/v1/reviews/${reviewId}/complaints`, { reason })
      .then((res) => res.data);
  },
};
