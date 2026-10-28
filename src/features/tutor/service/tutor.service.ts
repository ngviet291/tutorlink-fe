import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError, type PageResponse } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { TutorFilter, TutorProfilePayload, TutorResponse } from '../types/tutor.types'
import { notifications, nextId, recountSubjectUsage, subjects, tutors, users } from '@/mocks/db'
import { delay, paginate, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

/** Luôn bỏ `contact` — liên hệ chỉ được mở qua luồng thanh toán (xem application.service). */
const publicView = (t: TutorResponse): TutorResponse => ({ ...t, contact: undefined })

export const tutorService = {
  /** Chỉ hồ sơ APPROVED được hiển thị công khai. */
  async getTutors(params: TutorFilter = {}): Promise<PageResponse<TutorResponse>> {
    if (USE_MOCK) {
      await delay()
      const k = params.keyword?.toLowerCase()
      const list = tutors
        .filter((t) => t.profileStatus === 'APPROVED')
        .filter((t) => !params.subjectId || t.subjects.some((s) => s.id === params.subjectId))
        .filter((t) => !params.city || t.city === params.city)
        .filter((t) => !params.teachingMode || t.teachingMode === params.teachingMode || t.teachingMode === 'BOTH')
        .filter((t) => params.minRate === undefined || t.hourlyRate >= params.minRate)
        .filter((t) => params.maxRate === undefined || t.hourlyRate <= params.maxRate)
        .filter((t) => !params.educationLevels?.length || params.educationLevels.some((l) => t.educationLevels?.includes(l)))
        .filter((t) => !k || `${t.fullName} ${t.bio ?? ''} ${t.subjects.map((s) => s.name).join(' ')}`.toLowerCase().includes(k))
        .sort((a, b) => b.averageRating - a.averageRating)
      const page = paginate(list, params.page, params.pageSize ?? 9)
      return { ...page, items: page.items.map(publicView) }
    }
    return http.get<PageResponse<TutorResponse>>('/v1/users/tutors', { params })
  },

  async getTutorById(id: string): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay(250)
      const t = tutors.find((x) => x.id === id)
      let canSeeAll = false
      try {
        const me = requireUser()
        canSeeAll = me.role === 'ADMIN' || me.id === id
      } catch {
        /* guest */
      }
      if (!t || (t.profileStatus !== 'APPROVED' && !canSeeAll)) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      return publicView(t)
    }
    return http.get<TutorResponse>(`/v1/users/${id}`)
  },

  /** Hồ sơ của chính gia sư đang đăng nhập (kể cả PENDING/REJECTED). */
  async getMyProfile(): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay(250)
      const me = requireUser()
      const t = tutors.find((x) => x.id === me.id)
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      return publicView(t)
    }
    return http.get<TutorResponse>('/v1/users/me/tutor-profile') // TODO: nối API
  },

  /** Cập nhật hồ sơ → quay về PENDING để Admin duyệt lại. */
  async saveMyProfile(payload: TutorProfilePayload): Promise<TutorResponse> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      const t = tutors.find((x) => x.id === me.id)
      if (!t) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      t.subjects = payload.subjectIds.map((id) => subjects.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s)).map((s) => ({ id: s.id, name: s.name }))
      t.experienceYears = payload.experienceYears
      t.education = payload.education
      t.hourlyRate = payload.hourlyRate
      t.bio = payload.bio
      t.city = payload.city
      t.district = payload.district
      t.teachingMode = payload.teachingMode
      t.certificates = payload.certificates.map((c) => ({ id: nextId('c'), ...c }))
      const wasApproved = t.profileStatus === 'APPROVED'
      if (!wasApproved) {
        t.profileStatus = 'PENDING'
        t.reviewNote = undefined
        const u = users.find((x) => x.id === me.id)
        if (u) u.profileStatus = 'PENDING'
        notifications['a-1'] = [
          { id: nextId('n'), type: 'REGISTERED', title: 'Hồ sơ gia sư mới chờ duyệt', body: `${t.fullName} vừa gửi hồ sơ giảng dạy.`, read: false, createdAt: new Date().toISOString(), link: '/admin/tutor-review' },
          ...(notifications['a-1'] ?? []),
        ]
      }
      recountSubjectUsage()
      return publicView(t)
    }
    return http.put<TutorResponse>('/v1/users/me/tutor-profile', payload) // TODO: nối API
  },
}
