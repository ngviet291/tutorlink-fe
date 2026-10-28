import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError, type PageResponse } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { AccountStatus } from '@/shared/types/common.types'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'
import type { PostResponse } from '@/features/post/types/post.types'
import type { PostFilter } from '@/features/post/types/post.types'
import type { UserAdminRow } from '@/features/user/types/user.types'
import type { TransactionFilter, TransactionResponse } from '@/features/wallet/types/wallet.types'
import type {
  AdminStats, ComplaintDecisionPayload, FeeRateConfig, FeeRatePayload, ProfileReviewPayload, ReviewComplaint,
} from '../types/admin.types'
import {
  applications, feeRates, nextId, notifications, posts, recountSubjectUsage, reviews, revenueHistory, transactions, tutors, users,
} from '@/mocks/db'
import { delay, paginate, requireUser } from '@/mocks/session'
import { recomputeRating } from '@/features/review/service/review.service'

const USE_MOCK = env.useMock

function requireAdmin(): void {
  const me = requireUser()
  if (me.role !== 'ADMIN') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
}

export const adminService = {
  async getPendingTutors(): Promise<TutorResponse[]> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      return tutors.filter((t) => t.profileStatus === 'PENDING')
    }
    return http.get<TutorResponse[]>('/v1/admin/tutors/pending') // TODO: nối API
  },

  async reviewTutor(tutorId: string, payload: ProfileReviewPayload): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const t = tutors.find((x) => x.id === tutorId)
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      t.profileStatus = payload.decision
      t.reviewNote = payload.note || undefined
      const u = users.find((x) => x.id === tutorId)
      if (u) u.profileStatus = payload.decision
      notifications[tutorId] = [
        {
          id: nextId('n'), type: 'PROFILE_REVIEWED', read: false, createdAt: new Date().toISOString(),
          title: payload.decision === 'APPROVED' ? 'Hồ sơ gia sư đã được duyệt' : 'Hồ sơ gia sư bị từ chối',
          body: payload.decision === 'APPROVED' ? 'Bạn có thể đăng ký nhận lớp ngay bây giờ.' : (payload.note ?? 'Vui lòng cập nhật lại hồ sơ.'),
          link: '/profile/tutor',
        },
        ...(notifications[tutorId] ?? []),
      ]
      return t
    }
    return http.put<TutorResponse>(`/v1/admin/tutors/${tutorId}/review`, payload) // TODO: nối API
  },

  async getUsers(params: { keyword?: string; page?: number; pageSize?: number } = {}): Promise<PageResponse<UserAdminRow>> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const k = params.keyword?.toLowerCase()
      const list = users.filter((u) => !k || `${u.fullName} ${u.email} ${u.phone}`.toLowerCase().includes(k))
      return paginate(list.map((u) => ({ ...u })), params.page, params.pageSize ?? 10)
    }
    return http.get<PageResponse<UserAdminRow>>('/v1/admin/users', { params }) // TODO: nối API
  },

  async setUserStatus(userId: string, status: AccountStatus): Promise<UserAdminRow> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const u = users.find((x) => x.id === userId)
      if (!u) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (u.role === 'ADMIN') throw new ApiError('Không thể khóa tài khoản Admin.', 'FORBIDDEN', 403)
      u.status = status
      return { ...u }
    }
    return http.put<UserAdminRow>(`/v1/admin/users/${userId}/status`, { status }) // TODO: nối API
  },

  async getPosts(params: PostFilter = {}): Promise<PageResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const list = posts
        .filter((p) => !params.status || p.status === params.status)
        .filter((p) => !params.keyword || p.title.toLowerCase().includes(params.keyword.toLowerCase()))
        .map((p) => ({ ...p, applicationCount: applications.filter((a) => a.post.id === p.id).length }))
      return paginate(list, params.page, params.pageSize ?? 10)
    }
    return http.get<PageResponse<PostResponse>>('/v1/admin/posts', { params }) // TODO: nối API
  },

  /** Gỡ bài vi phạm → REMOVED. */
  async removePost(postId: string, reason: string): Promise<void> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const p = posts.find((x) => x.id === postId)
      if (!p) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      p.status = 'REMOVED'
      notifications[p.author.id] = [
        { id: nextId('n'), type: 'POST_PUBLISHED', title: 'Bài đăng bị gỡ', body: `"${p.title}" đã bị gỡ: ${reason}`, read: false, createdAt: new Date().toISOString() },
        ...(notifications[p.author.id] ?? []),
      ]
      recountSubjectUsage()
      return
    }
    await http.put<void>(`/v1/admin/posts/${postId}/remove`, { reason }) // TODO: nối API
  },

  async getTransactions(params: TransactionFilter = {}): Promise<PageResponse<TransactionResponse>> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const list = transactions
        .filter((t) => !params.status || t.status === params.status)
        .filter((t) => !params.tutorId || t.tutorId === params.tutorId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      return paginate(list, params.page, params.pageSize ?? 10)
    }
    return http.get<PageResponse<TransactionResponse>>('/v1/admin/transactions', { params }) // TODO: nối API
  },

  async getFeeRates(): Promise<FeeRateConfig[]> {
    if (USE_MOCK) {
      await delay(250)
      return [...feeRates].sort((a, b) => +new Date(b.effectiveFrom) - +new Date(a.effectiveFrom))
    }
    return http.get<FeeRateConfig[]>('/v1/admin/fee-rates') // TODO: nối API
  },

  /** Mức mới chỉ áp dụng từ ngày hiệu lực; giao dịch cũ không bị ảnh hưởng. */
  async createFeeRate(payload: FeeRatePayload): Promise<FeeRateConfig> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      if (payload.ratePercent <= 0 || payload.ratePercent > 100) throw new ApiError('Tỉ lệ phải trong khoảng 0–100%.', 'INVALID_RATE', 400)
      const created: FeeRateConfig = {
        id: nextId('fr'), rate: payload.ratePercent / 100, effectiveFrom: payload.effectiveFrom, createdBy: 'Quản trị viên', active: true,
      }
      for (const f of feeRates) if (new Date(f.effectiveFrom) <= new Date(created.effectiveFrom)) f.active = false
      feeRates.push(created)
      return created
    }
    return http.post<FeeRateConfig>('/v1/admin/fee-rates', payload) // TODO: nối API
  },

  async getComplaints(): Promise<ReviewComplaint[]> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      return reviews
        .filter((r) => r.complaintStatus === 'OPEN' || r.complaintStatus === 'RESOLVED')
        .map((r) => ({
          id: `cp-${r.id}`, reviewId: r.id, tutorId: r.tutorId, tutorName: tutors.find((t) => t.id === r.tutorId)?.fullName ?? '—',
          rating: r.rating, reviewComment: r.comment, reason: r.complaintReason ?? '',
          status: r.complaintStatus === 'OPEN' ? ('OPEN' as const) : ('RESOLVED' as const),
          decision: r.complaintDecision, decisionNote: r.complaintDecisionNote, createdAt: r.createdAt ?? new Date().toISOString(),
        }))
    }
    return http.get<ReviewComplaint[]>('/v1/admin/complaints') // TODO: nối API
  },

  /** Giữ hoặc gỡ đánh giá kèm lý do. Gỡ → xóa review và tính lại điểm trung bình. */
  async decideComplaint(reviewId: string, payload: ComplaintDecisionPayload): Promise<void> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const idx = reviews.findIndex((r) => r.id === reviewId)
      const r = reviews[idx]
      if (!r) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (payload.decision === 'REMOVED') {
        reviews.splice(idx, 1)
        recomputeRating(r.tutorId)
      } else {
        r.complaintStatus = 'RESOLVED'
        r.complaintDecision = 'KEPT'
        r.complaintDecisionNote = payload.note
      }
      return
    }
    await http.put<void>(`/v1/admin/complaints/${reviewId}`, payload) // TODO: nối API
  },

  async getStats(): Promise<AdminStats> {
    if (USE_MOCK) {
      await delay()
      requireAdmin()
      const thisMonth = transactions
        .filter((t) => t.type === 'ENROLLMENT_FEE' && t.status === 'SUCCESS')
        .reduce((s, t) => s + t.amount, 0)
      const revenueByMonth = [...revenueHistory.slice(0, -1), { label: revenueHistory[revenueHistory.length - 1]?.label ?? 'T10', revenue: (revenueHistory[revenueHistory.length - 1]?.revenue ?? 0) + thisMonth }]
      const statuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'REMOVED'] as const
      const paid = applications.filter((a) => a.paid)
      const byTutor = new Map<string, number>()
      for (const a of paid) {
        const tid = a.post.type === 'FIND_TUTOR' ? a.applicant.id : a.post.author.id
        byTutor.set(tid, (byTutor.get(tid) ?? 0) + 1)
      }
      return {
        revenueByMonth,
        postsByStatus: statuses.map((status) => ({ status, count: posts.filter((p) => p.status === status).length })),
        totalSuccessfulMatches: paid.length + 18,
        topTutors: [
          ...[...byTutor.entries()].map(([tutorId, c]) => ({ tutorId, fullName: tutors.find((t) => t.id === tutorId)?.fullName ?? '—', matchCount: c + 4 })),
          { tutorId: 't-3', fullName: 'Phạm Ngọc Mai', matchCount: 9 },
          { tutorId: 't-4', fullName: 'Nguyễn Quốc Bảo', matchCount: 6 },
        ]
          .filter((v, i, arr) => arr.findIndex((x) => x.tutorId === v.tutorId) === i)
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 5),
      }
    }
    return http.get<AdminStats>('/v1/admin/stats') // TODO: nối API
  },
}
