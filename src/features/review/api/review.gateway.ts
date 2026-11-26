import type {
  CreateReviewRequest,
  CreateReviewComplaintRequest,
  ReviewComplaintResponse as ReviewComplaintDto,
  ReviewResponse as ReviewDto,
} from "../types/review.dto";

import type { ReviewPayload, ReviewResponse } from "../types/review.types";

export interface ReviewGateway {
  getReviewsByTutor(tutorId: string): Promise<ReviewResponse[]>;

  createReview(payload: CreateReviewRequest): Promise<ReviewResponse>;

  hasReviewed(applicationId: string): Promise<boolean>;

  submitComplaint(
    reviewId: string,
    request: CreateReviewComplaintRequest,
  ): Promise<ReviewComplaintDto>;

  getReviewById(reviewId: string): Promise<ReviewResponse>;

  updateReview(reviewId: string, payload: ReviewPayload): Promise<ReviewDto>;
}
