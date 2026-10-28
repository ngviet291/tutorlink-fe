import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { ReviewPayload, ReviewResponse } from '../types/review.types'
import { applications, nextId, reviews, studentSummary, tutors } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

export function recomputeRating(tutorId: string): void {
  const t = tutors.find((x) => x.id === tutorId)
  if (!t) return
  const list = reviews.filter((r) => r.tutorId === tutorId)
  t.reviewCount = list.length
  t.averageRating = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : 0
}

export const reviewService = {
  async getReviewsByTutor(tutorId: string): Promise<ReviewResponse[]> {
    if (USE_MOCK) {
      await delay(250)
      return reviews.filter((r) => r.tutorId === tutorId).sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0))
    }
    return http.get<ReviewResponse[]>(`/v1/tutors/${tutorId}/reviews`) // TODO: nối API
  },

  /** Học viên đánh giá gia sư sau khi lớp kết nối (đã thanh toán). Mỗi lớp 1 đánh giá. */
  async createReview(payload: ReviewPayload): Promise<ReviewResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const a = applications.find((x) => x.id === payload.applicationId)
      if (!a || !a.paid) throw new ApiError('Lớp chưa được kết nối nên chưa thể đánh giá.', 'INVALID_STATE', 409)
      const studentId = a.post.type === 'FIND_TUTOR' ? a.post.author.id : a.applicant.id
      const tutorId = a.post.type === 'FIND_TUTOR' ? a.applicant.id : a.post.author.id
      if (studentId !== me.id) throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      if (reviews.some((r) => r.id.startsWith(`r-${a.id}`))) throw new ApiError('Bạn đã đánh giá lớp này rồi.', 'ALREADY_REVIEWED', 409)
      const review: ReviewResponse = {
        id: `r-${a.id}-${nextId('x')}`, tutorId, rating: payload.rating, comment: payload.comment,
        student: studentSummary(me.id), createdAt: new Date().toISOString(), complaintStatus: 'NONE',
      }
      reviews.unshift(review)
      recomputeRating(tutorId)
      return review
    }
    return http.post<ReviewResponse>('/v1/reviews', payload) // TODO: nối API
  },

  /** Lớp này đã được đánh giá chưa (mock). */
  async hasReviewed(applicationId: string): Promise<boolean> {
    if (USE_MOCK) return reviews.some((r) => r.id.startsWith(`r-${applicationId}-`))
    return false // TODO: nối API
  },

  /** Gia sư khiếu nại một đánh giá để Admin xem xét. */
  async submitComplaint(reviewId: string, reason: string): Promise<ReviewResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const r = reviews.find((x) => x.id === reviewId)
      if (!r) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (r.tutorId !== me.id) throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      if (r.complaintStatus && r.complaintStatus !== 'NONE') throw new ApiError('Đánh giá này đã được khiếu nại.', 'ALREADY_COMPLAINED', 409)
      r.complaintStatus = 'OPEN'
      r.complaintReason = reason
      return { ...r }
    }
    return http.post<ReviewResponse>(`/v1/reviews/${reviewId}/complaint`, { reason }) // TODO: nối API
  },
}
