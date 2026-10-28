import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { SubjectPayload, SubjectResponse } from '../types/subject.types'
import { nextId, recountSubjectUsage, subjects } from '@/mocks/db'
import { delay } from '@/mocks/session'

const USE_MOCK = env.useMock

export const subjectService = {
  async getSubjects(): Promise<SubjectResponse[]> {
    if (USE_MOCK) {
      await delay(150)
      recountSubjectUsage()
      return subjects.map((s) => ({ ...s }))
    }
    return http.get<SubjectResponse[]>('/v1/subjects') // TODO: nối API
  },

  async createSubject(payload: SubjectPayload): Promise<SubjectResponse> {
    if (USE_MOCK) {
      await delay()
      if (subjects.some((s) => s.name.toLowerCase() === payload.name.trim().toLowerCase())) {
        throw new ApiError('Môn học đã tồn tại.', 'SUBJECT_EXISTS', 409)
      }
      const created: SubjectResponse = { id: nextId('sub'), name: payload.name.trim(), description: payload.description, usageCount: 0 }
      subjects.push(created)
      return created
    }
    return http.post<SubjectResponse>('/v1/subjects', payload) // TODO: nối API
  },

  async updateSubject(id: string, payload: SubjectPayload): Promise<SubjectResponse> {
    if (USE_MOCK) {
      await delay()
      const s = subjects.find((x) => x.id === id)
      if (!s) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      s.name = payload.name.trim()
      s.description = payload.description
      return { ...s }
    }
    return http.put<SubjectResponse>(`/v1/subjects/${id}`, payload) // TODO: nối API
  },

  /** Chặn xóa khi môn học đang được dùng. */
  async deleteSubject(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay()
      recountSubjectUsage()
      const idx = subjects.findIndex((x) => x.id === id)
      const s = subjects[idx]
      if (!s) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (s.usageCount > 0) throw new ApiError(ERROR_MESSAGES.SUBJECT_IN_USE, 'SUBJECT_IN_USE', 409)
      subjects.splice(idx, 1)
      return
    }
    await http.delete(`/v1/subjects/${id}`) // TODO: nối API
  },
}
