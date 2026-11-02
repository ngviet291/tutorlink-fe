import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { delay } from '@/mocks/session'
import { subjects } from '@/mocks/db'
import type { SubjectResponse } from '../types/subject.types'

const USE_MOCK = env.useMock

export const subjectService = {
  async getAll(): Promise<SubjectResponse[]> {
    if (USE_MOCK) {
      await delay(200)
      return subjects
    }
    return http.get<SubjectResponse[]>('/v1/subjects')
  },
}
