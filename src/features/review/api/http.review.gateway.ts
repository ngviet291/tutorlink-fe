import type { IHttpClient } from "@/config/http/IHttpClient";
import type { CursorResponse } from "@/shared/types/api.types";

import type {
  CreateReviewComplaintRequest,
  CreateReviewRequest,
  ReviewComplaintResponse as ReviewComplaintDto,
  ReviewResponse as ReviewDto,
} from "../types/review.dto";

import type { ReviewPayload, ReviewResponse } from "../types/review.types";

import type { ReviewGateway } from "./review.gateway";

const REVIEWS = "/v1/reviews";

function toComplaintStatus(status?: string): "NONE" | "OPEN" | "RESOLVED" {
  if (!status || status === "NONE") {
    return "NONE";
  }

  if (status === "PENDING") {
    return "OPEN";
  }

  return "RESOLVED";
}

function toReviewResponse(review: ReviewDto): ReviewResponse {
  return {
    id: review.id,
    applicationId: review.applicationId,
    tutorId: review.tutorId,
    rating: review.rating,
    comment: review.comment ?? "",
    student: {
      id: review.studentId,
      fullName: review.studentName ?? "",
    },
    createdAt: review.createdAt,
    complaintStatus: toComplaintStatus(review.complaintStatus),
  };
}

export class HttpReviewGateway implements ReviewGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }
  async getReviewsByTutor(tutorId: string): Promise<ReviewResponse[]> {
    const res = await this.http.get<CursorResponse<ReviewDto>>(REVIEWS, {
      params: {
        tutorId,
        limit: 100,
      },
    });

    return res.content.map(toReviewResponse);
  }

  async createReview(payload: CreateReviewRequest): Promise<ReviewResponse> {
    const res = await this.http.post<ReviewDto>(REVIEWS, payload);

    return toReviewResponse(res);
  }

  async hasReviewed(applicationId: string): Promise<boolean> {
    return this.http.get<boolean>(`${REVIEWS}/exists`, {
      params: {
        applicationId,
      },
    });
  }

  async submitComplaint(
    reviewId: string,
    request: CreateReviewComplaintRequest,
  ): Promise<ReviewComplaintDto> {
    return this.http.post<ReviewComplaintDto>(
      `${REVIEWS}/${reviewId}/complaints`,
      request,
    );
  }

  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    const res = await this.http.get<ReviewDto>(`${REVIEWS}/${reviewId}`);

    return toReviewResponse(res);
  }

  async updateReview(
    reviewId: string,
    payload: ReviewPayload,
  ): Promise<ReviewDto> {
    return this.http.put<ReviewDto>(`${REVIEWS}/${reviewId}`, payload);
  }
}
