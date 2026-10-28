import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import { PAYMENT_WINDOW_HOURS } from '@/constants/enums'
import type { AiSuggestionResponse, ApplicationResponse, ApplyPayload } from '../types/application.types'
import { isTutorApplicant } from '../types/application.types'
import {
  applications, contacts, nextId, notifications, posts, studentSummary, transactions, tutors, wallets,
} from '@/mocks/db'
import { delay, requireUser, aiShouldFail } from '@/mocks/session'
import { rankApplications } from '@/mocks/ai'
import { payerTutorId, quoteFor } from '@/mocks/fee'

const USE_MOCK = env.useMock

function notify(userId: string, n: { type: 'SELECTED' | 'NEW_APPLICATION' | 'PAYMENT_SUCCESS'; title: string; body: string; link?: string }): void {
  notifications[userId] = [
    { id: nextId('n'), read: false, createdAt: new Date().toISOString(), ...n },
    ...(notifications[userId] ?? []),
  ]
}

/** Quá hạn thanh toán → lượt đăng ký bị CANCELLED, người đăng bài chọn lại. */
function expireOverdue(): void {
  const now = Date.now()
  for (const a of applications) {
    if (a.awaitingPayment && a.payDeadline && new Date(a.payDeadline).getTime() < now) cancelOffer(a)
  }
}

function cancelOffer(a: ApplicationResponse): void {
  a.status = 'CANCELLED'
  a.awaitingPayment = false
  // Trả các lượt bị từ chối do lần chọn này về lại PENDING để chọn ứng viên khác
  for (const o of applications) {
    if (o.post.id === a.post.id && o.id !== a.id && o.status === 'REJECTED') o.status = 'PENDING'
  }
  notify(a.post.author.id, {
    type: 'SELECTED', title: 'Ứng viên không hoàn tất nhận lớp',
    body: `Bài "${a.post.title}" đã mở lại để bạn chọn ứng viên khác.`, link: `/post/${a.post.id}`,
  })
}

/** Gắn thông tin liên hệ thật CHỈ khi đã thanh toán và người xem là một trong hai bên. */
function view(a: ApplicationResponse, viewerId: string, isAdmin = false): ApplicationResponse {
  const party = a.post.author.id === viewerId || a.applicant.id === viewerId || isAdmin
  const unlocked = Boolean(a.paid) && party
  const copy: ApplicationResponse = { ...a, post: { ...a.post, author: { ...a.post.author, contact: undefined } } }
  const contact = unlocked ? contacts[a.applicant.id] : undefined
  copy.applicant = isTutorApplicant(a.applicant) ? { ...a.applicant, contact } : { ...a.applicant, contact }
  if (unlocked) copy.post = { ...copy.post, author: { ...copy.post.author, contact: contacts[a.post.author.id] } }
  return copy
}

function findApp(id: string): ApplicationResponse {
  const a = applications.find((x) => x.id === id)
  if (!a) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
  return a
}

export const applicationService = {
  /** Đăng ký nhận lớp. Mỗi người 1 lần/bài, không đăng ký bài của mình. */
  async applyToPost(payload: ApplyPayload): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const post = posts.find((p) => p.id === payload.postId)
      if (!post || post.status !== 'PUBLISHED') throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (post.author.id === me.id) throw new ApiError(ERROR_MESSAGES.OWN_POST, 'OWN_POST', 409)
      if (applications.some((a) => a.post.id === post.id && a.applicant.id === me.id)) {
        throw new ApiError(ERROR_MESSAGES.ALREADY_APPLIED, 'ALREADY_APPLIED', 409)
      }
      let applicant: ApplicationResponse['applicant']
      if (post.type === 'FIND_TUTOR') {
        const t = tutors.find((x) => x.id === me.id)
        if (me.role !== 'TUTOR' || !t) throw new ApiError('Chỉ gia sư mới đăng ký bài tìm gia sư.', 'FORBIDDEN', 403)
        if (t.profileStatus !== 'APPROVED') throw new ApiError(ERROR_MESSAGES.TUTOR_NOT_APPROVED, 'TUTOR_NOT_APPROVED', 403)
        applicant = t
      } else {
        if (me.role !== 'STUDENT') throw new ApiError('Chỉ học viên mới đăng ký bài tìm học viên.', 'FORBIDDEN', 403)
        applicant = studentSummary(me.id)
      }
      const created: ApplicationResponse = {
        id: nextId('ap'), post, applicant, status: 'PENDING', message: payload.message, createdAt: new Date().toISOString(),
      }
      applications.push(created)
      notify(post.author.id, {
        type: 'NEW_APPLICATION', title: 'Có lượt ứng tuyển mới',
        body: `${me.fullName} vừa đăng ký bài "${post.title}".`, link: `/post/${post.id}`,
      })
      return view(created, me.id)
    }
    return http.post<ApplicationResponse>('/v1/applications', payload)
  },

  /** Đơn tôi đã ứng tuyển + các lời mời cần thanh toán (khi tôi là gia sư đăng bài FIND_STUDENT). */
  async getMyApplications(): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay()
      expireOverdue()
      const me = requireUser()
      return applications
        .filter((a) => a.applicant.id === me.id || (a.post.type === 'FIND_STUDENT' && a.post.author.id === me.id && (a.awaitingPayment || a.paid)))
        .map((a) => view(a, me.id, me.role === 'ADMIN'))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    }
    return http.get<ApplicationResponse[]>('/v1/applications/me')
  },

  /** Các lớp đã kết nối thành công (đã thanh toán) mà tôi tham gia — dùng cho Chat & đánh giá. */
  async getConnections(): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      return applications
        .filter((a) => a.paid && (a.applicant.id === me.id || a.post.author.id === me.id))
        .map((a) => view(a, me.id))
    }
    return http.get<ApplicationResponse[]>('/v1/applications/me?paid=true') // TODO: nối API
  },

  /** Lượt đăng ký của một bài — chỉ tác giả (hoặc admin). */
  async getApplicationsByPost(postId: string): Promise<ApplicationResponse[]> {
    if (USE_MOCK) {
      await delay()
      expireOverdue()
      const me = requireUser()
      const post = posts.find((p) => p.id === postId)
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (post.author.id !== me.id && me.role !== 'ADMIN') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      return applications
        .filter((a) => a.post.id === postId)
        .map((a) => view(a, me.id, me.role === 'ADMIN'))
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    }
    return http.get<ApplicationResponse[]>('/v1/applications', { params: { postId } })
  },

  /** Gợi ý top 5. Khi AI lỗi, backend trả source = 'RULE_BASED' (mock giả lập bằng tl_mock_ai_fail). */
  async getAiTop5(postId: string): Promise<AiSuggestionResponse> {
    if (USE_MOCK) {
      await delay(700)
      const me = requireUser()
      const post = posts.find((p) => p.id === postId)
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (post.author.id !== me.id && me.role !== 'ADMIN') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      const items = rankApplications(applications.filter((a) => a.post.id === postId), 5).map((a) => view(a, me.id))
      return { items, source: aiShouldFail() ? 'RULE_BASED' : 'AI' }
    }
    return http.get<AiSuggestionResponse>(`/v1/posts/${postId}/ai-suggestions`)
  },

  /** Người đăng bài chọn 1 ứng viên → ACCEPTED, các lượt khác REJECTED, chờ gia sư thanh toán. */
  async selectApplicant(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const a = findApp(id)
      if (a.post.author.id !== me.id) throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      if (a.status !== 'PENDING') throw new ApiError('Lượt đăng ký này không còn ở trạng thái chờ.', 'INVALID_STATE', 409)
      if (applications.some((x) => x.post.id === a.post.id && x.status === 'ACCEPTED')) {
        throw new ApiError('Bài này đã có ứng viên được chọn.', 'ALREADY_SELECTED', 409)
      }
      a.status = 'ACCEPTED'
      a.awaitingPayment = true
      a.payDeadline = new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600_000).toISOString()
      for (const o of applications) {
        if (o.post.id === a.post.id && o.id !== a.id && o.status === 'PENDING') {
          o.status = 'REJECTED'
        }
      }
      notify(payerTutorId(a), {
        type: 'SELECTED', title: 'Bạn được chọn nhận lớp!',
        body: `Bài "${a.post.title}" — thanh toán phí nhận lớp trong ${PAYMENT_WINDOW_HOURS} giờ để mở khóa liên hệ.`,
        link: '/applications/mine',
      })
      return view(a, me.id)
    }
    return http.post<ApplicationResponse>(`/v1/applications/${id}/select`)
  },

  /** Thanh toán phí nhận lớp bằng ví → mở liên hệ + chat, bài chuyển CLOSED. */
  async confirmAndPayFee(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay(600)
      expireOverdue()
      const me = requireUser()
      const a = findApp(id)
      if (payerTutorId(a) !== me.id) throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      if (!a.awaitingPayment) throw new ApiError('Lượt đăng ký này không cần thanh toán hoặc đã quá hạn.', 'INVALID_STATE', 409)
      const quote = quoteFor(a)
      const balance = wallets[me.id] ?? 0
      if (balance < quote.feeAmount) throw new ApiError(ERROR_MESSAGES.INSUFFICIENT_BALANCE, 'INSUFFICIENT_BALANCE', 402)
      wallets[me.id] = balance - quote.feeAmount
      transactions.unshift({
        id: nextId('tx'), type: 'ENROLLMENT_FEE', amount: quote.feeAmount, status: 'SUCCESS',
        applicationId: a.id, createdAt: new Date().toISOString(), tutorId: me.id, tutorName: me.fullName,
      })
      a.paid = true
      a.awaitingPayment = false
      const post = posts.find((p) => p.id === a.post.id)
      if (post) post.status = 'CLOSED'
      a.post = { ...a.post, status: 'CLOSED' }
      for (const uid of [a.post.author.id, a.applicant.id]) {
        notify(uid, { type: 'PAYMENT_SUCCESS', title: 'Kết nối thành công', body: 'Thông tin liên hệ và kênh chat đã được mở.', link: `/chat/${a.id}` })
      }
      return view(a, me.id)
    }
    return http.post<ApplicationResponse>(`/v1/applications/${id}/pay`)
  },

  /** Gia sư từ chối nhận lớp → CANCELLED, người đăng bài chọn lại. */
  async declineOffer(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const a = findApp(id)
      if (payerTutorId(a) !== me.id) throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      if (!a.awaitingPayment) throw new ApiError('Không thể từ chối lượt này.', 'INVALID_STATE', 409)
      cancelOffer(a)
      return view(a, me.id)
    }
    return http.post<ApplicationResponse>(`/v1/applications/${id}/decline`)
  },

  /** Người ứng tuyển tự hủy khi còn PENDING. */
  async cancelApplication(id: string): Promise<ApplicationResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const a = findApp(id)
      if (a.applicant.id !== me.id || a.status !== 'PENDING') throw new ApiError(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403)
      a.status = 'CANCELLED'
      return view(a, me.id)
    }
    return http.post<ApplicationResponse>(`/v1/applications/${id}/cancel`) // TODO: nối API
  },
}
